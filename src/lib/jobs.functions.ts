import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assembleParts } from "./museum.server";
import { extractIdeas, researchContext, saveSweep } from "./stash.functions";
import { beginRadar, searchRadar, finishRadar, draftRadarActions } from "./radar.functions";
import { RADAR_KINDS } from "./radar";
import { runError } from "./run-safety";

const input = z.object({ sweepId: z.string().uuid() });
export const readWorkshopJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase.from("workshop_jobs").select("*").eq("sweep_id", data.sweepId).maybeSingle();
    if (error || !job) throw new Error("I couldn't open this job in your guest session.");
    const { data: parts, error: partError } = await context.supabase.from("sweep_parts").select("part,value").eq("sweep_id", data.sweepId);
    if (partError) throw new Error("I couldn't read the saved progress.");
    return { job, result: assembleParts(parts ?? []) };
  });

/** One provider operation per request. Persisted outputs decide the next step, not client input. */
export const advanceWorkshopJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ context, data }) => {
    const { data: job } = await context.supabase.from("workshop_jobs").select("*").eq("sweep_id", data.sweepId).maybeSingle();
    if (!job) throw new Error("This job isn't in your guest session.");
    if (job.status === "done") return { done: true };
    const { data: rows, error } = await context.supabase.from("sweep_parts").select("part,value").eq("sweep_id", data.sweepId);
    if (error) throw new Error("I couldn't read your saved work.");
    const parts = new Map((rows ?? []).map((p) => [p.part, p.value as any]));
    const result = assembleParts(rows ?? []);
    let step = "extract";
    let work: () => Promise<unknown> = () => extractIdeas({ data });
    if (parts.has("extract")) {
      step = "save";
      work = () => saveSweep({ data: { ...data, result, status: "done" } });
      for (const r of result.ideas) {
        const base = { ...data, ideaId: r.idea.id };
        if (!r.context) { step = `context:${r.idea.id}`; work = () => researchContext({ data: { ...data, idea: r.idea } }); break; }
        if (!r.check) {
          const round = parts.get(`radar-round:${r.idea.id}`);
          if (!round || round.done || !parts.has(`radar-plan:${round.id}`)) {
            step = `plan:${r.idea.id}`; work = () => beginRadar({ data: { ...base, force: false } }); break;
          }
          const missing = RADAR_KINDS.find((kind) => !parts.has(`radar-search:${round.id}:${kind}`));
          if (missing) { step = `search:${r.idea.id}:${missing}`; work = () => searchRadar({ data: { ...base, roundId: round.id, kind: missing } }); break; }
          step = `verdict:${r.idea.id}`; work = () => finishRadar({ data: { ...base, roundId: round.id } }); break;
        }
        if (!r.kit) { step = `kit:${r.idea.id}`; work = () => draftRadarActions({ data: base }); break; }
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: token, error: claimError } = await supabaseAdmin.rpc("claim_workshop_step", { _id: data.sweepId, _step: step });
    if (claimError) throw new Error("This step has reached its three-attempt safety limit. Please stash a fresh idea later.");
    if (!token) return { done: false, waiting: true };
    const started = Date.now();
    try {
      const output = await work();
      if (step.startsWith("plan:") && !output) throw new Error("The search plan is still being prepared. Please retry shortly.");
      const events = Array.isArray(job.events) ? job.events : [];
      const { error: savedError } = await supabaseAdmin.from("workshop_jobs").update({ status: step === "save" ? "done" : "queued", lease_token: null, lease_until: null, updated_at: new Date().toISOString(), events: [...events, { step, elapsedMs: Date.now() - started, completedAt: new Date().toISOString() }] }).eq("sweep_id", data.sweepId).eq("lease_token", token);
      if (savedError) throw new Error("The work finished, but I couldn't update its progress. Retry to read it back.");
      return { done: step === "save" };
    } catch (e) {
      const message = runError(e);
      await supabaseAdmin.from("workshop_jobs").update({ status: "failed", error: message, lease_until: null, lease_token: null, updated_at: new Date().toISOString() }).eq("sweep_id", data.sweepId).eq("lease_token", token);
      throw new Error(message);
    }
  });