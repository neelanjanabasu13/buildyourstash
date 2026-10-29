import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { BrandImage } from "@/components/BrandImage";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { KroweClip } from "@/components/KroweClip";
import { PileInput } from "@/components/PileInput";
import { SweepProgress } from "@/components/SweepProgress";
import { ResultsView } from "@/components/Results";
import { useSweep } from "@/hooks/use-sweep";
import { getKeysStatus } from "@/lib/stash.functions";
import { useFirstResult } from "@/components/FirstResultContext";
import { hasFirstResult } from "@/lib/first-result";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STASH — KROWE rescues your half-finished projects" },
      { name: "description", content: "STASH — KROWE rescues your half-finished projects" },
      { property: "og:title", content: "STASH — KROWE rescues your half-finished projects" },
      { property: "og:description", content: "STASH — KROWE rescues your half-finished projects" },
      { name: "twitter:title", content: "STASH — KROWE rescues your half-finished projects" },
      { name: "twitter:description", content: "STASH — KROWE rescues your half-finished projects" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const sweep = useSweep();
  const keys = useQuery({ queryKey: ["keys-status"], queryFn: () => getKeysStatus() });
  const keysMissing = keys.data && (!keys.data.nebius || !keys.data.tavily);
  const busy = ["starting", "reading", "checking"].includes(sweep.phase);
  const showProgress = sweep.phase !== "idle" && sweep.phase !== "error";
  const [editPile, setEditPile] = useState(false);
  const hasOutcome = sweep.phase === "done";
  const inputVisible = !busy && (!hasOutcome || editPile);
  const { unlock } = useFirstResult();
  useEffect(() => {
    if (hasFirstResult(sweep.phase, sweep.result.ideas.length)) unlock();
  }, [sweep.phase, sweep.result.ideas.length, unlock]);

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      {inputVisible && <section className="flex items-center gap-3 sm:gap-6">
        <BrandImage slot="krowe-standing" alt="KROWE, ready to rescue your unfinished projects" className="h-28 w-20 shrink-0 sm:h-36 sm:w-24" />
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">KROWE says</p>
          <h1 className="max-w-xl text-2xl font-semibold leading-tight sm:text-4xl">You stopped for a reason. <span className="block">See if it still holds.</span></h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Meet KROWE, STASH's crow. He rescues half-finished side projects.</p>
        </div>
      </section>}
      {hasOutcome && <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow text-muted-foreground">Sweep complete</p><h1 className="mt-1 text-3xl font-semibold">{sweep.result.ideas.length ? "Here's what we can rescue." : "Nothing to rescue from this pile."}</h1></div>
        <Button variant="paperOutline" aria-expanded={editPile} onClick={() => setEditPile((v) => !v)}>{editPile ? "Back to results" : "Sweep another pile"}</Button>
      </div>}

      {keysMissing && (
        <div className="flex gap-3 rounded-xl border border-primary/50 bg-primary/10 p-4 text-sm">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Keys not set</p>
            <p className="text-muted-foreground">
              STASH only runs live. Missing: {[!keys.data?.nebius && "NEBIUS_API_KEY", !keys.data?.tavily && "TAVILY_API_KEY"].filter(Boolean).join(" and ")}.
              Sweeps are switched off until the owner adds them.
            </p>
          </div>
        </div>
      )}

      <div hidden={!inputVisible}>
        <PileInput disabled={busy} sweepBlocked={Boolean(keysMissing)} onSweep={(pile, example) => { setEditPile(false); void sweep.run(pile, example); }} />
      </div>

      {inputVisible && <section aria-labelledby="how-it-works-title" className="border-t border-foreground/20 pt-8 sm:pt-10">
        <p className="eyebrow mb-2 text-muted-foreground">From your pile to a next step</p>
        <h2 id="how-it-works-title" className="text-3xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { slot: "krowe-standing", title: "Drop your pile", text: "Notes, files, a GitHub repo or a ChatGPT export.", alt: "KROWE standing, ready for your pile" },
            { slot: "krowe-thinking", title: "Find why you stopped", text: "KROWE reads it and finds why you stopped, in your own words, plus the thread running through your ideas.", alt: "KROWE thinking through your unfinished ideas" },
            { slot: "krowe-thinking", title: "Check what changed", text: "He searches the live web for what changed since you stopped, with sources.", alt: "KROWE with a laptop, investigating what changed" },
            { slot: "krowe-shipped", title: "Get a verdict and a kit", text: "You get a verdict per idea: REVIVE NOW, NOT YET or STILL DEAD, and a revival kit for the ones worth restarting.", alt: "KROWE celebrating a project ready to ship" },
          ] as const).map((step, index) => <li key={step.title} className="grid grid-cols-[4.5rem_1fr] items-start gap-4 sm:block">
            <BrandImage slot={step.slot} alt={step.alt} className="h-24 w-18 sm:mb-4 sm:h-32 sm:w-24" />
            <div><span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-sm bg-accent font-mono text-sm font-bold text-accent-foreground">{index + 1}</span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          </li>)}
        </ol>
        <p className="mt-8 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">Every claim about your ideas comes with a quote that the server checks against your pile, and unverifiable claims are dropped.</p>
      </section>}

      {sweep.phase === "done" && sweep.result.ideas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <BrandImage slot="krowe-sleeping" alt="KROWE resting beside the pile" className="h-40 w-32" />
          <KroweClip slot="sleep" className="h-44 w-32" />
        </div>
      )}

      {sweep.message && (
        <p className={`rounded-lg border p-4 text-sm ${sweep.phase === "error" ? "border-destructive/60 text-foreground" : "border-border text-muted-foreground"}`}>
          {sweep.message}
        </p>
      )}

      {showProgress && busy && (
        <SweepProgress phase={sweep.phase} threadStage={sweep.threadStage} stages={sweep.stages} result={sweep.result} />
      )}

      {showProgress && !busy && sweep.result.ideas.length > 0 && (
        <ResultsView result={sweep.result} onFeedback={sweep.giveFeedback} threadPending={sweep.threadStage !== "done"} />
      )}
    </div>
  );
}
