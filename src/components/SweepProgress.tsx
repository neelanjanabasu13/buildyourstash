import { Check, Loader2, AlertTriangle } from "lucide-react";
import type { IdeaStage, Phase } from "@/hooks/use-sweep";
import type { SweepResult } from "@/lib/types";
import { KroweClip } from "@/components/KroweClip";
import { BrandImage } from "@/components/BrandImage";

const IDEA_LABEL: Record<IdeaStage, string> = {
  context: "Nemotron Super is planning searches for your idea",
  web: "Tavily is searching the live web",
  verdict: "Nemotron Super is weighing the evidence",
  kit: "Nemotron Ultra is writing your first drafts",
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
  stages,
  result,
  sources = [],
}: {
  phase: Phase;
  threadStage: "idle" | "running" | "done";
  stages: Record<string, IdeaStage>;
  result: SweepResult;
  sources?: { title: string; url: string }[];
}) {
  const after = (p: Phase[]) => (p.includes(phase) ? "done" : "todo");
  const done = Object.values(stages).filter((s) => s === "done" || s === "error").length;
  const headline = phase === "starting" ? "Got it. Leave it with me." : phase === "reading" ? "Let me pick up your idea." : Object.values(stages).some((s) => s === "kit") ? "I'm doing the first bit myself." : "I'm finding what's happening around your idea.";
  return (
    <section aria-live="polite" className="py-6">
      <div className="mb-6 flex items-center gap-4">
        <BrandImage slot="krowe-thinking" alt="KROWE thinking through your pile" className="h-32 w-24 shrink-0" />
        <div><p className="eyebrow mb-2 text-muted-foreground">KROWE is on it</p><h1 className="text-3xl font-semibold">{headline}</h1>{result.ideas.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{done} of {result.ideas.length} ideas checked</p>}</div>
      </div>
      <div className="flex flex-col gap-5 border-y border-foreground/20 py-6 sm:flex-row">
      <KroweClip key={phase} slot={phase === "starting" ? "shard" : phase === "reading" ? "bulb" : "typing"} loop={phase === "checking"} className="mx-auto h-48 w-32 shrink-0 sm:mx-0" />
      <div className="min-w-0 flex-1">
      <p className="eyebrow mb-2 text-primary">KROWE is mulling · live on Nebius Token Factory + Tavily</p>
      <ul className="text-sm">
        <Row state={phase === "starting" ? "run" : after(["reading", "checking", "done"])} label="I'm getting your pile ready" />
        <Row state={phase === "reading" ? "run" : after(["checking", "done"])} label="Nemotron Nano is finding the ideas in your notes" />
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
      {sources.length > 0 && <ul aria-label="Arriving sources" className="mt-4 flex flex-wrap gap-2">{Array.from(new Map(sources.map((s) => [s.url, s])).values()).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="inline-block max-w-64 truncate rounded-sm border border-teal/40 px-2 py-1 text-xs text-teal underline">{s.title}</a></li>)}</ul>}
      </div>
      </div>
    </section>
  );
}
