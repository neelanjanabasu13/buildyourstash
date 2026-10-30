import { Check, Loader2, AlertTriangle } from "lucide-react";
import type { IdeaStage, Phase } from "@/hooks/use-sweep";
import type { SweepResult } from "@/lib/types";
import { KroweClip } from "@/components/KroweClip";
import { BrandImage } from "@/components/BrandImage";

const IDEA_LABEL: Record<IdeaStage, string> = {
  context: "I'm finding useful context for your idea",
  web: "I'm checking what changed",
  verdict: "I'm weighing the evidence",
  kit: "I'm building your first drafts",
  done: "checked and ready",
  error: "I hit a snag",
};

function Row({ state, label }: { state: "todo" | "run" | "done" | "error"; label: string }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      {state === "run" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      {state === "done" && <Check className="h-4 w-4 text-primary" />}
      {state === "error" && <AlertTriangle className="h-4 w-4 text-destructive" />}
      {state === "todo" && <span className="h-4 w-4 rounded-full border border-border" />}
      <span className={state === "run" ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

export function SweepProgress({
  phase,
  threadStage,
  stages,
  result,
}: {
  phase: Phase;
  threadStage: "idle" | "running" | "done";
  stages: Record<string, IdeaStage>;
  result: SweepResult;
}) {
  const after = (p: Phase[]) => (p.includes(phase) ? "done" : "todo");
  const done = Object.values(stages).filter((s) => s === "done" || s === "error").length;
  const headline = phase === "starting" ? "I'll keep this safe." : phase === "reading" ? "Let me pick up your idea." : Object.values(stages).some((s) => s === "kit") ? "I'm doing the first bit myself." : "I'm finding what's happening around your idea.";
  return (
    <section aria-live="polite" className="py-6">
      <div className="mb-6 flex items-center gap-4">
        <BrandImage slot="krowe-thinking" alt="KROWE thinking through your pile" className="h-32 w-24 shrink-0" />
        <div><p className="eyebrow mb-2 text-muted-foreground">KROWE is on it</p><h1 className="text-3xl font-semibold">{headline}</h1>{result.ideas.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{done} of {result.ideas.length} ideas checked</p>}</div>
      </div>
      <div className="flex flex-col gap-5 border-y border-foreground/20 py-6 sm:flex-row">
      <KroweClip slot={phase === "starting" || phase === "reading" ? "typing" : "bulb"} className="mx-auto h-48 w-32 shrink-0 sm:mx-0" />
      <div className="min-w-0 flex-1">
      <p className="eyebrow mb-2 text-primary">KROWE is mulling</p>
      <ul className="text-sm">
        <Row state={phase === "starting" ? "run" : after(["reading", "checking", "done"])} label="I'm getting your pile ready" />
        <Row state={phase === "reading" ? "run" : after(["checking", "done"])} label="I'm finding the brainwaves in your notes" />
        {result.ideas.length >= 3 && (
          <Row
            state={threadStage === "running" ? "run" : threadStage === "done" ? "done" : "todo"}
            label="I'm finding the thread that keeps coming back"
          />
        )}
        {result.ideas.map(({ idea }) => {
          const s = stages[idea.id] ?? "context";
          return (
            <Row
              key={idea.id}
              state={s === "done" ? "done" : s === "error" ? "error" : "run"}
              label={`${idea.name}: ${IDEA_LABEL[s]}`}
            />
          );
        })}
      </ul>
      </div>
      </div>
    </section>
  );
}
