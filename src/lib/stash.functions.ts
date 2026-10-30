import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chat, chatJson, tavilySearch } from "./ai.server";
import { LIMITS, MODELS } from "./models.config";
import { emptyTally, filterByQuote, quoteIsInSource, sameUrl } from "./verify";
import { assembleParts, storePart } from "./museum.server";
import { neutralMuseum } from "./idea-framing";
import type { MuseumSweep } from "./museum";
import type {
  Checked,
  Evidence,
  Idea,
  LiveCheck,
  RevivalKit,
  SweepResult,
  Thread,
  VerdictLabel,
  IdeaContext,
} from "./types";

type Ctx = { supabase: { from: (t: "sweeps") => any; rpc: (...a: any[]) => any } };

const today = () => new Date().toISOString().slice(0, 10);

async function loadPile(context: Ctx, sweepId: string): Promise<string> {
  const { data, error } = await context.supabase
    .from("sweeps")
    .select("pile, created_at")
    .eq("id", sweepId)
    .maybeSingle();
  if (error || !data) throw new Error("Sweep not found for this session.");
  if (Date.now() - new Date(data.created_at).getTime() > 3 * 60 * 60 * 1000) {
    throw new Error("This sweep has expired. Start a new one.");
  }
  return data.pile as string;
}

const ideaSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  summary: z.string().max(1000),
  droppedWhen: z.string().nullable(),
  droppedDate: z.string().nullable(),
  receipts: z.array(z.object({ quote: z.string().max(600) })).max(10),
});

const str = (v: unknown, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ---------- status ----------

export const getKeysStatus = createServerFn({ method: "GET" }).handler(async () => ({
  nebius: Boolean(process.env["NEBIUS_API_KEY"]),
  tavily: Boolean(process.env["TAVILY_API_KEY"]),
}));

export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { userId: context.userId, isAdmin: Boolean(data) };
  });

// ---------- start ----------

const CAP_MESSAGES: Record<string, string> = {
  DAILY_LIMIT: `KROWE needs a rest: each guest session gets ${LIMITS.sweepsPerDay} sweeps a day. Come back tomorrow.`,
  PILE_TOO_LARGE: `That pile is over ${LIMITS.maxPileChars.toLocaleString()} characters. Trim it a little and try again.`,
  PILE_TOO_SMALL: "The pile is nearly empty. Drop in some notes first.",
  NOT_SIGNED_IN: "Your guest session hasn't started yet. Refresh and try again.",
};

export const startSweep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ pile: z.string().max(LIMITS.maxPileChars + 1000), isExample: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!process.env["NEBIUS_API_KEY"] || !process.env["TAVILY_API_KEY"]) {
      return { ok: false as const, message: "API keys are not set yet, so STASH can't run a live sweep." };
    }
    const { data: id, error } = await context.supabase.rpc("start_sweep", {
      _pile: data.pile,
      _is_example: data.isExample,
    });
    if (error) {
      const code = Object.keys(CAP_MESSAGES).find((k) => error.message.includes(k));
      return { ok: false as const, message: code ? CAP_MESSAGES[code] : "Couldn't start the sweep." };
    }
    return { ok: true as const, sweepId: id as string };
  });

// ---------- 1. extract ideas (Nano) ----------

export const extractIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<Checked<Idea[]>> => {
    const pile = await loadPile(context as Ctx, data.sweepId);
    const raw = await chatJson<{ ideas?: any[] }>(
      "extract",
      `You are KROWE, curator and maker in an idea museum. Find brainwaves, including ONE half-formed thought or aspiration. Describe only the idea itself, never interpret the person's past behaviour.
Today is ${today()}.
Return {"ideas":[{"name":"short name","summary":"one sentence","quotes":["exact sentence copied from the notes", "..."]}]}
Rules: at most ${LIMITS.maxIdeas} ideas. Each quote MUST be copied character for character from the notes (1-3 quotes per idea, each 8-200 characters). Never paraphrase inside quotes. Only return no ideas if there is no idea-like content. Do not infer personal history or dates. Choose quotes describing the idea, not past behaviour.`,
      `NOTES:\n"""\n${pile}\n"""`,
    );
    const tally = emptyTally();
    const ideas: Idea[] = [];
    for (const [i, it] of (raw.ideas ?? []).slice(0, LIMITS.maxIdeas).entries()) {
      const quotes = Array.isArray(it?.quotes) ? it.quotes.map((q: unknown) => str(q, 400)) : [];
      const kept = filterByQuote(quotes, (q: string) => q, pile, tally);
      if (!kept.length || !str(it?.name)) continue;
      
      ideas.push({
        id: `idea-${i}`,
        name: str(it.name, 120),
        summary: str(it.summary, 400),
        droppedWhen: null,
        droppedDate: null,
        receipts: kept.map((quote) => ({ quote })),
      });
    }
    const output = { value: ideas, tally };
    await storePart(data.sweepId, "extract", output);
    return output;
  });

// ---------- 2. thread (Super) ----------

export const findThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid(), ideas: z.array(ideaSchema).max(LIMITS.maxIdeas) }).parse(d))
  .handler(async ({ data, context }): Promise<Checked<Thread | null>> => {
    const pile = await loadPile(context as Ctx, data.sweepId);
    const tally = emptyTally();
    if (data.ideas.length < 3) return { value: null, tally };
    const list = data.ideas.map((i) => `- ${i.name}: ${i.summary}`).join("\n");
    const raw = await chatJson<{ theme?: string; explanation?: string; quotes?: string[] }>(
      "reason",
      `Find ONE shared interest across these ideas. Describe the ideas, not the person's behaviour or history. Be specific and warm.
Return {"theme":"short phrase","explanation":"one sentence","quotes":["exact sentences copied from the notes that show the theme", "..."]}. Exactly three quotes from different ideas, copied character for character. If there is no real common theme return {"theme":"","explanation":"","quotes":[]}.`,
      `IDEAS:\n${list}\n\nNOTES:\n"""\n${pile}\n"""`,
    );
    const receipts = filterByQuote(raw.quotes ?? [], (q) => q, pile, tally).map((quote) => ({ quote }));
    const output = { value: str(raw.theme) && receipts.length >= 3 ? { theme: str(raw.theme, 160), explanation: str(raw.explanation, 600), receipts: receipts.slice(0, 3) } : null, tally };
    await storePart(data.sweepId, "thread", output);
    return output;
  });

// ---------- 3a. idea context (Super) ----------

export const researchContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid(), idea: ideaSchema }).parse(d))
  .handler(async ({ data, context }): Promise<Checked<IdeaContext>> => {
    const pile = await loadPile(context as Ctx, data.sweepId);
    const { data: parts } = await context.supabase.from("sweep_parts").select("part,value").eq("sweep_id", data.sweepId);
    const idea = assembleParts(parts ?? []).ideas.find((i) => i.idea.id === data.idea.id)?.idea;
    if (!idea) throw new Error("Idea not found.");
    const raw = await chatJson<{ focus?: string; search_query?: string; quotes?: string[] }>("reason",
      `You are KROWE. Describe the idea itself and identify useful current tools or launches to research. Never ask or infer anything about the person's past behaviour. Return {"focus":"one sentence describing the idea's practical research direction","search_query":"short query for relevant current tools","quotes":["exact quotes describing the idea, copied from NOTES"]}. Quotes must describe the brainwave, not personal history.`,
      `IDEA: ${idea.name}: ${idea.summary}\nNOTES:\n${pile}`);
    const tally = emptyTally();
    const receipts = filterByQuote(raw.quotes ?? [], (q) => q, pile, tally).map((quote) => ({ quote }));
    const output: Checked<IdeaContext> = { value: { receipts, focus: str(raw.focus, 300), searchQuery: str(raw.search_query, 200) || idea.name, topic: "general" }, tally };
    await storePart(data.sweepId, `context:${idea.id}`, output);
    return output;
  });

// ---------- 3b. live check + verdict (Tavily + Super) ----------

export const liveCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sweepId: z.string().uuid(),
        idea: ideaSchema,
        trigger: z.string().max(400),
        searchQuery: z.string().max(300),
        topic: z.enum(["news", "general"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<Checked<LiveCheck>> => {
    await loadPile(context as Ctx, data.sweepId); // ownership + freshness check
    const since = null;
    const results = await tavilySearch(data.searchQuery, { topic: data.topic, timeRange: "month" });
    const tally = emptyTally();
    const base = { query: data.searchQuery, searchedSince: since, resultsSeen: results.length };

    if (results.length === 0) {
      const output: Checked<LiveCheck> = { value: { ...base, verdict: "WATCH", summary: "Nothing found. The web search returned no results for this.", evidence: [], nothingFound: true }, tally };
      await storePart(data.sweepId, `check:${data.idea.id}`, output);
      return output;
    }

    const sources = results
      .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nDATE: ${r.published_date ?? "unknown"}\nTEXT: ${r.content.slice(0, 1200)}`)
      .join("\n\n");
    const raw = await chatJson<{ verdict?: string; summary?: string; evidence?: { claim?: string; url?: string; quote?: string }[] }>(
      "reason",
      `You are KROWE. Judge a brainwave using ONLY current search context, never the person's past behaviour. Today is ${today()}.
Verdicts: BUILD NOW for a useful supported first experiment, WATCH for uncertain context, PARK for evidence suggesting this direction is not a useful current investment. Never treat competition alone as failure. Never invent news or user history.
Return {"verdict":"BUILD NOW|WATCH|PARK","evidence":[{"claim":"one useful context headline","url":"exact search URL","quote":"exact source passage supporting it"}]}. Every verdict needs evidence; without evidence choose WATCH.`,
      `IDEA: ${data.idea.name}: ${data.idea.summary}\nRESEARCH FOCUS: ${data.trigger}\nSEARCH RESULTS:\n${sources}`
    );

    const evidence: Evidence[] = [];
    for (const e of raw.evidence ?? []) {
      tally.checked += 1;
      const match = results.find((r) => sameUrl(r.url, str(e?.url, 1000)));
      if (match && quoteIsInSource(e?.quote, `${match.title}\n${match.content}`)) {
        evidence.push({ claim: str(e.claim, 300), url: match.url, title: match.title, quote: str(e.quote, 400) });
      } else tally.dropped += 1;
    }

    let verdict: VerdictLabel = (["BUILD NOW", "WATCH", "PARK"] as const).find((v) => v === raw.verdict) ?? "WATCH";
    let summary = evidence[0]?.claim ?? "Nothing found that we could verify.";
    const nothingFound = evidence.length === 0;
    if (nothingFound) {
      if (verdict === "BUILD NOW") verdict = "WATCH";
      summary = "Nothing found that we could verify. There is not enough source evidence for a recommendation.";
    }
    const output: Checked<LiveCheck> = { value: { ...base, verdict, summary, evidence, nothingFound }, tally };
    await storePart(data.sweepId, `check:${data.idea.id}`, output);
    return output;
  });

// ---------- 4. first-work drafts (Ultra) ----------

export const firstWorkDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sweepId: z.string().uuid(),
        idea: ideaSchema,
        trigger: z.string().max(400),
        evidence: z.array(z.object({ claim: z.string(), url: z.string(), title: z.string(), quote: z.string() })).max(5),
        verdict: z.enum(["BUILD NOW", "WATCH", "PARK"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RevivalKit> => {
    await loadPile(context as Ctx, data.sweepId);
    const { data: savedParts, error: savedError } = await context.supabase.from("sweep_parts").select("part,value").eq("sweep_id", data.sweepId);
    if (savedError) throw new Error("Couldn't read verified evidence.");
    const verified = assembleParts(savedParts ?? []).ideas.find((i) => i.idea.id === data.idea.id);
    if (!verified?.check) throw new Error("Check this exhibit before drafting its first work.");
    const raw = await chatJson<{ pitch?: string; steps?: string[]; headline?: string; subhead?: string }>(
      "write",
      `You are KROWE, an idea museum's curator. Do the first piece of work yourself, don't merely tell the user to write it. Never interpret personal history. Draft a sharper pitch and finished landing page headline and subhead, plus three tiny 5-15 minute steps. For WATCH or PARK offer a low-risk sketch or test, not a launch guarantee. Never invent facts about the user or claim anything was published, coded or deployed. No em dashes.
Return {"pitch":"rewritten one-line pitch","steps":["one tiny thing to do today","second","third"],"headline":"finished landing page headline under 10 words","subhead":"finished landing page subhead"}.`,
      `IDEA: ${verified.idea.name} - ${verified.idea.summary}\nVERDICT: ${verified.check.verdict}\nRESEARCH FOCUS: ${verified.context?.focus ?? verified.idea.summary}\nVERIFIED EVIDENCE:\n${verified.check.evidence.map((e) => `- ${e.claim}`).join("\n")}`,
    );
    const steps = (raw.steps ?? []).map((s) => str(s, 300)).filter(Boolean).slice(0, 3);
    const output = { pitch: str(raw.pitch, 300), steps, headline: str(raw.headline, 140), subhead: str(raw.subhead, 300) };
    if (!output.pitch || !output.headline || !output.subhead || steps.length !== 3) throw new Error("KROWE couldn't finish the first draft. Please try again.");
    await storePart(data.sweepId, `kit:${data.idea.id}`, output);
    return output;
  });

// ---------- save ----------

export const saveSweep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid(), result: z.any(), status: z.enum(["running", "done", "failed"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await loadPile(context as Ctx, data.sweepId);
    const { data: parts, error: partError } = await context.supabase.from("sweep_parts").select("part,value").eq("sweep_id", data.sweepId);
    if (partError) throw new Error("Couldn't read KROWE's saved work.");
    const result = assembleParts(parts ?? []);
    const supplied = data.result as SweepResult;
    for (const idea of result.ideas) {
      const feedback = supplied?.ideas?.find((i) => i.idea.id === idea.idea.id);
      if (feedback?.feedback === "yes" || feedback?.feedback === "no") { idea.feedback = feedback.feedback; idea.feedbackNote = str(feedback.feedbackNote, 140); }
      if (feedback?.error) idea.error = str(feedback.error, 160);
    }
    const { error } = await context.supabase.rpc("save_sweep_result", {
      _id: data.sweepId,
      _result: JSON.parse(JSON.stringify(result)),
      _status: data.status,
    });
    if (error) throw new Error("Couldn't save your museum.");
    return { ok: true };
  });

export const listMuseum = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MuseumSweep[]> => {
    const { data, error } = await context.supabase.from("sweeps").select("id,created_at,status,result").eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't open your museum.");
    const { data: parts, error: partsError } = await context.supabase.from("sweep_parts").select("sweep_id,part,value");
    if (partsError) throw new Error("Couldn't read the saved exhibits.");
    return (data ?? []).map((s) => {
      const saved = s.result as unknown as SweepResult | null;
      const serverParts = (parts ?? []).filter((p) => p.sweep_id === s.id);
      const result = serverParts.length ? assembleParts(serverParts) : neutralMuseum(saved ?? assembleParts([]));
      for (const idea of result.ideas) {
        const previous = saved?.ideas?.find((i) => i.idea.id === idea.idea.id);
        if (previous?.feedback) { idea.feedback = previous.feedback; idea.feedbackNote = previous.feedbackNote; }
        if (previous?.error) idea.error = previous.error;
      }
      return { id: s.id, createdAt: s.created_at, status: s.status, result };
    });
  });

export const museumPattern = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Thread | null> => {
    const { data: rows, error } = await context.supabase.from("sweeps").select("pile,result").eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't read the ideas for a pattern.");
    const ideas = (rows ?? []).flatMap((r) => (r.result as unknown as SweepResult | null)?.ideas ?? []);
    if (ideas.length < 3) return null;
    const existing = (rows ?? []).map((r) => (r.result as unknown as SweepResult | null)?.thread).find((t) => t && t.receipts.length >= 3);
    if (existing) return existing;
    const source = (rows ?? []).map((r) => r.pile).join("\n\n").slice(0, LIMITS.maxPileChars);
    const raw = await chatJson<{ theme?: string; quotes?: string[] }>("reason", 'Find one optional common theme across at least three distinct ideas. Return {"theme":"short name","quotes":["exact quote for idea one","exact quote for idea two","exact quote for idea three"]}. Copy quotes character for character from NOTES. If no pattern, return {"theme":"","quotes":[]}. Quote only descriptions of the ideas, never infer personal history or behaviour.', `IDEAS: ${ideas.map((i) => i.idea.name).join("; ")}\nNOTES:\n${source}`);
    const receipts = filterByQuote(raw.quotes ?? [], (q) => q, source, emptyTally()).slice(0, 3).map((quote) => ({ quote }));
    return str(raw.theme) && receipts.length === 3 ? { theme: str(raw.theme, 160), explanation: "", receipts } : null;
  });

// ---------- admin API test ----------

export const runApiTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only.");
    const time = async (name: string, fn: () => Promise<string>) => {
      const t = Date.now();
      try {
        const detail = await fn();
        return { name, ok: true, ms: Date.now() - t, detail: detail.slice(0, 160) };
      } catch (e) {
        return { name, ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message : "failed" };
      }
    };
    const roles = ["extract", "reason", "write"] as const;
    return Promise.all([
      ...roles.map((r) => time(`${r}: ${MODELS[r].model}`, () => chat(r, "You are a test.", "Reply with the single word: ok", false))),
      time("Tavily search", async () => {
        const res = await tavilySearch("open source large language models news", { topic: "news" });
        return `${res.length} results`;
      }),
    ]);
  });
