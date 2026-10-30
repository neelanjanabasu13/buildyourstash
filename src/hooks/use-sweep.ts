import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startSweep, saveSweep } from "@/lib/stash.functions";
import { readWorkshopJob, advanceWorkshopJob } from "@/lib/jobs.functions";
import { supabase } from "@/integrations/supabase/client";
import { ensureGuestSession } from "@/lib/session";
import type { IdeaResult, SweepResult } from "@/lib/types";
import { runError, withDeadline } from "@/lib/run-safety";

export type IdeaStage = "context" | "web" | "verdict" | "kit" | "done" | "error";
export type Phase = "idle" | "starting" | "reading" | "checking" | "done" | "error";

const emptyResult = (): SweepResult => ({ thread: null, ideas: [], pileTally: { checked: 0, dropped: 0 }, webTally: { checked: 0, dropped: 0 } });

const errText = runError;

export function useSweep() {
  const start = useServerFn(startSweep), save = useServerFn(saveSweep);
  const read = useServerFn(readWorkshopJob), advance = useServerFn(advanceWorkshopJob);
  const active = useRef(false);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [threadStage, setThreadStage] = useState<"idle" | "running" | "done">("idle");
  const [stages, setStages] = useState<Record<string, IdeaStage>>({});
  const [result, setResult] = useState<SweepResult>(emptyResult);
  const [sweepId, setSweepId] = useState<string | null>(null);
  const resultRef = useRef<SweepResult>(emptyResult());

  const update = useCallback((fn: (r: SweepResult) => SweepResult) => {
    resultRef.current = fn(resultRef.current);
    setResult(resultRef.current);
  }, []);
  const patchIdea = useCallback(
    (id: string, patch: Partial<IdeaResult>) =>
      update((r) => ({ ...r, ideas: r.ideas.map((i) => (i.idea.id === id ? { ...i, ...patch } : i)) })),
    [update],
  );
  const sync = useCallback(async (id: string) => {
    const snapshot = await withDeadline(read({ data: { sweepId: id } }), "Opening progress took too long. Please retry.");
    resultRef.current = snapshot.result; setResult(snapshot.result);
    setThreadStage("done");
    const nextStages = Object.fromEntries(snapshot.result.ideas.map((r) => [r.idea.id, r.kit ? "done" : r.check ? "kit" : r.context ? "web" : "context"])) as Record<string, IdeaStage>;
    const step = snapshot.job.step;
    if (step.startsWith("verdict:")) nextStages[step.split(":")[1] ?? ""] = "verdict";
    setStages(nextStages);
    setPhase(snapshot.job.status === "done" ? "done" : snapshot.job.status === "failed" ? "error" : snapshot.result.ideas.length ? "checking" : "reading");
    if (snapshot.job.error) setMessage(snapshot.job.error);
    return snapshot;
  }, [read]);

  const resume = useCallback(async (id: string) => {
    if (active.current) return;
    active.current = true; setSweepId(id); setMessage(null); setPhase("starting");
    try {
      for (let n = 0; n < 90; n++) {
        const before = await sync(id);
        if (before.job.status === "done") break;
        const next = await withDeadline(advance({ data: { sweepId: id } }), "This step took too long. Your progress is saved; please retry.");
        await sync(id);
        if (next.done) break;
        if (next.waiting) await new Promise((resolve) => window.setTimeout(resolve, 1500));
        if (n === 89) throw new Error("This run needs more time. Your progress is saved; please retry.");
      }
    } catch (e) { setMessage(runError(e)); setPhase("error"); }
    finally { active.current = false; }
  }, [sync, advance]);

  useEffect(() => {
    if (!sweepId || !["starting", "reading", "checking"].includes(phase)) return;
    const channel = supabase.channel(`job-${sweepId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "workshop_jobs", filter: `sweep_id=eq.${sweepId}` }, () => { void sync(sweepId).catch((e) => setMessage(runError(e))); })
      .subscribe();
    // Source chips are read from owner-checked stored search results, never guessed.
    const timer = window.setInterval(async () => {
      const { data, error } = await supabase.from("sweep_parts").select("part,value").eq("sweep_id", sweepId).like("part", "radar-search:%");
      if (error) { setMessage("I couldn't refresh the source chips. Your work is still saved."); return; }
      setSources((data ?? []).flatMap((p) => {
        const value = p.value as { sources?: { title: string; url: string }[] };
        return value.sources ?? [];
      }));
    }, 2000);
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [sweepId, sync, phase]);

  const run = useCallback(async (pile: string, isExample: boolean) => {
    resultRef.current = emptyResult(); setResult(resultRef.current); setSources([]); setStages({}); setMessage(null); setSweepId(null); setPhase("starting");
    try {
      await ensureGuestSession();
      const started = await withDeadline(start({ data: { pile, isExample } }), "Saving your idea took too long. Please retry.");
      if (!started.ok || !started.sweepId) throw new Error(started.message ?? "I couldn't save your idea. Please retry.");
      await resume(started.sweepId);
    } catch (e) { setMessage(runError(e)); setPhase("error"); }
  }, [start, resume]);

  const giveFeedback = useCallback(
    (ideaId: string, feedback: "yes" | "no", note?: string) => {
      patchIdea(ideaId, { feedback, feedbackNote: note });
      if (sweepId) withDeadline(save({ data: { sweepId, result: resultRef.current, status: "done" } }), "Saving your feedback took too long. Please try again.").catch((error) => setMessage(errText(error)));
    },
    [patchIdea, save, sweepId],
  );

  return { phase, message, threadStage, stages, result, sweepId, run, resume, sources, giveFeedback };
}
