import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chat, chatJson, tavilySearch } from "./ai.server";
import { LIMITS, MODELS } from "./models.config";
import { emptyTally, filterByQuote, quoteIsInSource, sameUrl } from "./verify";
import type {
  Checked,
  Evidence,
  Idea,
  LiveCheck,
  RevivalKit,
  SweepResult,
  Thread,
  VerdictLabel,
  WhyStopped,
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
      `You read someone's messy notes and find side projects or ideas they STARTED or seriously considered and then DROPPED, paused or abandoned.
Today is ${today()}.
Return {"ideas":[{"name":"short name","summary":"one sentence","dropped_when":"when they stopped in their words, or null","dropped_date":"YYYY-MM-DD best estimate of when they stopped, or null if unknown","quotes":["exact sentence copied from the notes", "..."]}]}
Rules: at most ${LIMITS.maxIdeas} ideas. Each quote MUST be copied character for character from the notes (1-3 quotes per idea, each 8-200 characters). Never paraphrase inside quotes. If nothing was dropped, return {"ideas":[]}.`,
      `NOTES:\n"""\n${pile}\n"""`,
    );
    const tally = emptyTally();
    const ideas: Idea[] = [];
    for (const [i, it] of (raw.ideas ?? []).slice(0, LIMITS.maxIdeas).entries()) {
      const quotes = Array.isArray(it?.quotes) ? it.quotes.map((q: unknown) => str(q, 400)) : [];
      const kept = filterByQuote(quotes, (q: string) => q, pile, tally);
      if (!kept.length || !str(it?.name)) continue;
      const date = str(it?.dropped_date, 10);
      ideas.push({
        id: `idea-${i}`,
        name: str(it.name, 120),
        summary: str(it.summary, 400),
        droppedWhen: str(it.dropped_when, 120) || null,
        droppedDate: /^\d{4}-\d{2}-\d{2}$/.test(date) && date < today() ? date : null,
        receipts: kept.map((quote) => ({ quote })),
      });
    }
    return { value: ideas, tally };
  });

// ---------- 2. thread (Super) ----------

export const findThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid(), ideas: z.array(ideaSchema).max(LIMITS.maxIdeas) }).parse(d))
  .handler(async ({ data, context }): Promise<Checked<Thread | null>> => {
    const pile = await loadPile(context as Ctx, data.sweepId);
    const tally = emptyTally();
    if (data.ideas.length < 2) return { value: null, tally };
    const list = data.ideas.map((i) => `- ${i.name}: ${i.summary}`).join("\n");
    const raw = await chatJson<{ theme?: string; explanation?: string; quotes?: string[] }>(
      "reason",
      `Find the ONE theme that keeps coming back across these dropped ideas: a recurring interest, need, or pattern in how the person drops things. Be specific, warm and honest.
Return {"theme":"short phrase","explanation":"two sentences","quotes":["exact sentences copied from the notes that show the theme", "..."]}. 2-4 quotes, copied character for character. If there is no real common theme return {"theme":"","explanation":"","quotes":[]}.`,
      `DROPPED IDEAS:\n${list}\n\nNOTES:\n"""\n${pile}\n"""`,
    );
    const receipts = filterByQuote(raw.quotes ?? [], (q) => q, pile, tally).map((quote) => ({ quote }));
    if (!str(raw.theme) || receipts.length === 0) return { value: null, tally };
    return { value: { theme: str(raw.theme, 160), explanation: str(raw.explanation, 600), receipts }, tally };
  });

// ---------- 3a. why stopped (Super) ----------

export const whyStopped = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid(), idea: ideaSchema }).parse(d))
  .handler(async ({ data, context }): Promise<Checked<WhyStopped>> => {
    const pile = await loadPile(context as Ctx, data.sweepId);
    const raw = await chatJson<{ reasons?: { reason?: string; quote?: string }[]; would_need_to_change?: string; search_query?: string; topic?: string }>(
      "reason",
      `Work out from the person's OWN words why they stopped this idea, and what in the outside world would have to change for it to be worth restarting.
Today is ${today()}.
Return {"reasons":[{"reason":"short reason","quote":"exact sentence copied from the notes that shows it"}],"would_need_to_change":"one sentence: the concrete external change that would unblock it","search_query":"a web search query (under 20 words) to find whether that change has happened","topic":"news or general"}.
Only include reasons you can back with an exact quote copied character for character. 1-3 reasons.`,
      `IDEA: ${data.idea.name} - ${data.idea.summary}\nKNOWN QUOTES: ${data.idea.receipts.map((r) => r.quote).join(" | ")}\n\nNOTES:\n"""\n${pile}\n"""`,
    );
    const tally = emptyTally();
    const reasons = filterByQuote(raw.reasons ?? [], (r) => r?.quote, pile, tally).map((r) => ({
      reason: str(r.reason, 200),
      quote: str(r.quote, 400),
    }));
    const trigger = str(raw.would_need_to_change, 300);
    return {
      value: {
        reasons,
        trigger,
        searchQuery: str(raw.search_query, 200) || `${data.idea.name} ${trigger}`.slice(0, 200),
        topic: raw.topic === "news" ? "news" : "general",
      },
      tally,
    };
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
    const since = data.idea.droppedDate;
    const results = await tavilySearch(data.searchQuery, { topic: data.topic, startDate: since ?? undefined });
    const tally = emptyTally();
    const base = { query: data.searchQuery, searchedSince: since, resultsSeen: results.length };

    if (results.length === 0) {
      return { value: { ...base, verdict: "NOT YET", summary: "Nothing found. The web search returned no results for this.", evidence: [], nothingFound: true }, tally };
    }

    const sources = results
      .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nDATE: ${r.published_date ?? "unknown"}\nTEXT: ${r.content.slice(0, 1200)}`)
      .join("\n\n");
    const raw = await chatJson<{ verdict?: string; summary?: string; evidence?: { claim?: string; url?: string; quote?: string }[] }>(
      "reason",
      `You judge whether a dropped side project is worth reviving TODAY (${today()}), based ONLY on the search results given.
Verdicts: "REVIVE NOW" (the blocker has clearly eased, with evidence), "NOT YET" (some movement but not enough, or unclear), "STILL DEAD" (nothing changed or it got worse).
Never invent news. If the results don't speak to the blocker, say so and choose NOT YET or STILL DEAD.
Return {"verdict":"REVIVE NOW|NOT YET|STILL DEAD","summary":"two honest sentences","evidence":[{"claim":"what changed","url":"exact URL from the results","quote":"exact phrase copied from that result's TEXT"}]}. 0-3 evidence items.`,
      `IDEA: ${data.idea.name} - ${data.idea.summary}\nSTOPPED ${since ? `around ${since}` : "at an unknown time"}.\nWHAT WOULD NEED TO CHANGE: ${data.trigger}\n\nSEARCH RESULTS:\n${sources}`,
    );

    const evidence: Evidence[] = [];
    for (const e of raw.evidence ?? []) {
      tally.checked += 1;
      const match = results.find((r) => sameUrl(r.url, str(e?.url, 1000)));
      if (match && quoteIsInSource(e?.quote, `${match.title}\n${match.content}`)) {
        evidence.push({ claim: str(e.claim, 300), url: match.url, title: match.title, quote: str(e.quote, 400) });
      } else tally.dropped += 1;
    }

    let verdict: VerdictLabel = (["REVIVE NOW", "NOT YET", "STILL DEAD"] as const).find((v) => v === raw.verdict) ?? "NOT YET";
    let summary = str(raw.summary, 600);
    const nothingFound = evidence.length === 0;
    if (nothingFound) {
      if (verdict === "REVIVE NOW") verdict = "NOT YET";
      summary = "Nothing found that we could verify. None of the search results contained checkable proof that the blocker has changed.";
    }
    return { value: { ...base, verdict, summary, evidence, nothingFound }, tally };
  });

// ---------- 4. revival kit (Ultra) ----------

export const revivalKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sweepId: z.string().uuid(),
        idea: ideaSchema,
        trigger: z.string().max(400),
        evidence: z.array(z.object({ claim: z.string(), url: z.string(), title: z.string(), quote: z.string() })).max(5),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RevivalKit> => {
    await loadPile(context as Ctx, data.sweepId);
    const raw = await chatJson<{ pitch?: string; steps?: string[]; headline?: string; subhead?: string }>(
      "write",
      `You help someone restart a side project they dropped, now that something changed. Be concrete, small and encouraging; no hype words.
Return {"pitch":"rewritten one-line pitch","steps":["first small step (under 2 hours)","second","third"],"headline":"landing page headline, under 10 words","subhead":"landing page subhead, one sentence"}.`,
      `IDEA: ${data.idea.name} - ${data.idea.summary}\nWHAT HAD TO CHANGE: ${data.trigger}\nWHAT CHANGED:\n${data.evidence.map((e) => `- ${e.claim}`).join("\n")}`,
    );
    const steps = (raw.steps ?? []).map((s) => str(s, 300)).filter(Boolean).slice(0, 3);
    return { pitch: str(raw.pitch, 300), steps, headline: str(raw.headline, 140), subhead: str(raw.subhead, 300) };
  });

// ---------- save ----------

export const saveSweep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sweepId: z.string().uuid(), result: z.any(), status: z.enum(["running", "done", "failed"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.rpc("save_sweep_result", {
      _id: data.sweepId,
      _result: data.result as SweepResult,
      _status: data.status,
    });
    return { ok: true };
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
