import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  extractIdeas,
  saveSweep,
  startSweep,
  researchContext,
} from "@/lib/stash.functions";
import { ensureGuestSession } from "@/lib/session";
import type { IdeaResult, SweepResult, Tally } from "@/lib/types";
import { needsKit } from "@/lib/museum";
import { beginRadar, searchRadar, finishRadar, draftRadarActions } from "@/lib/radar.functions";
import { RADAR_KINDS } from "@/lib/radar";

export type IdeaStage = "context" | "web" | "verdict" | "kit" | "done" | "error";
export type Phase = "idle" | "starting" | "reading" | "checking" | "done" | "error";

const add = (a: Tally, b: Tally): Tally => ({ checked: a.checked + b.checked, dropped: a.dropped + b.dropped });
const emptyResult = (): SweepResult => ({ thread: null, ideas: [], pileTally: { checked: 0, dropped: 0 }, webTally: { checked: 0, dropped: 0 } });

const errText = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("KEYS_NOT_SET")) return "API keys are not set yet.";
  return m.length > 160 ? "Something went wrong talking to the model or search." : m;
};

export function useSweep() {
  const start = useServerFn(startSweep);
  const extract = useServerFn(extractIdeas);
  const context = useServerFn(researchContext);
  const radarStart = useServerFn(beginRadar), radarSearch = useServerFn(searchRadar), radarFinish = useServerFn(finishRadar), radarDraft = useServerFn(draftRadarActions);
  const save = useServerFn(saveSweep);

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
  const setStage = (id: string, s: IdeaStage) => setStages((m) => ({ ...m, [id]: s }));

  const run = useCallback(
    async (pile: string, isExample: boolean) => {
      resultRef.current = emptyResult();
      setResult(resultRef.current);
      setStages({});
      setThreadStage("idle");
      setMessage(null);
      setSweepId(null);
      setPhase("starting");
      try {
        await ensureGuestSession();
        const started = await start({ data: { pile, isExample } });
        if (!started.ok) {
          setMessage(started.message ?? "Couldn't start the sweep.");
          setPhase("error");
          return;
        }
        const id = started.sweepId as string;
        setSweepId(id ?? null);
        setPhase("reading");

        const ex = await extract({ data: { sweepId: id } });
        update((r) => ({ ...r, pileTally: add(r.pileTally, ex.tally), ideas: ex.value.map((idea) => ({ idea })) }));
        if (ex.value.length === 0) {
          setMessage("I couldn't find an idea in those words yet. A half-formed thought is enough, so try naming what you'd like to make.");
          setPhase("done");
          await save({ data: { sweepId: id, result: resultRef.current, status: "done" } });
          return;
        }
        setPhase("checking");
        setStages(Object.fromEntries(ex.value.map((i) => [i.id, "context" as IdeaStage])));

        setThreadStage("done");

        const ideaJobs = ex.value.map(async (idea) => {
          try {
            const w = await context({ data: { sweepId: id, idea } });
            update((r) => ({ ...r, pileTally: add(r.pileTally, w.tally) }));
            patchIdea(idea.id, { context: w.value });
            setStage(idea.id, "web");
            const radarData = { sweepId: id, ideaId: idea.id };
            const roundId = await radarStart({ data: { ...radarData, force: false } });
            if (!roundId) throw new Error("This exhibit is already being checked.");
            await Promise.all(RADAR_KINDS.map((kind) => radarSearch({ data: { ...radarData, roundId, kind } })));
            const c = await radarFinish({ data: { ...radarData, roundId } });
            update((r) => ({ ...r, webTally: add(r.webTally, c.radar.webTally), pileTally: add(r.pileTally, c.radar.pileTally) }));
            patchIdea(idea.id, { check: c.check.value, radar: c.radar });
            if (needsKit(c.check.value.verdict)) {
              setStage(idea.id, "kit");
              const k = await radarDraft({ data: radarData });
              if (k) patchIdea(idea.id, { kit: k });
            }
            setStage(idea.id, "done");
          } catch (e) {
            patchIdea(idea.id, { error: errText(e) });
            setStage(idea.id, "error");
          }
        });

        await Promise.all(ideaJobs);
        await save({ data: { sweepId: id, result: resultRef.current, status: "done" } });
        setPhase("done");
      } catch (e) {
        console.error(e);
        setMessage(errText(e));
        setPhase("error");
      }
    },
    [start, extract, context, radarStart, radarSearch, radarFinish, radarDraft, save, update, patchIdea],
  );

  const giveFeedback = useCallback(
    (ideaId: string, feedback: "yes" | "no", note?: string) => {
      patchIdea(ideaId, { feedback, feedbackNote: note });
      if (sweepId) save({ data: { sweepId, result: resultRef.current, status: "done" } }).catch(console.error);
    },
    [patchIdea, save, sweepId],
  );

  return { phase, message, threadStage, stages, result, sweepId, run, giveFeedback };
}
