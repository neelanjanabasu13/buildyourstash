import { Check, Loader2, AlertTriangle } from "lucide-react";
import type { IdeaStage, Phase } from "@/hooks/use-sweep";
import type { SweepResult } from "@/lib/types";
import { BrandImage } from "@/components/BrandImage";

const IDEA_LABEL: Record<IdeaStage, string> = {
  why: "working out why you stopped",
  web: "checking the web",
  verdict: "weighing the evidence",
  kit: "writing a revival kit",
  done: "done",
  error: "hit a snag",
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
  return (
    <section aria-live="polite" className="flex gap-5 rounded-xl border border-border bg-secondary/60 p-5">
      <BrandImage slot="krowe-thinking" alt="KROWE thinking" label="KROWE thinking" className="hidden h-28 w-24 shrink-0 sm:flex" />
      <div className="min-w-0 flex-1">
      <p className="eyebrow mb-2 text-primary">Sweep in progress</p>
      <ul className="text-sm">
        <Row state={phase === "starting" ? "run" : after(["reading", "checking", "done"])} label="KROWE is waking up" />
        <Row state={phase === "reading" ? "run" : after(["checking", "done"])} label="KROWE is reading your pile" />
        {result.ideas.length > 0 && (
          <Row
            state={threadStage === "running" ? "run" : threadStage === "done" ? "done" : "todo"}
            label="Looking for the thread that ties your dropped ideas together"
          />
        )}
        {result.ideas.map(({ idea }) => {
          const s = stages[idea.id] ?? "why";
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
    </section>
  );
}
