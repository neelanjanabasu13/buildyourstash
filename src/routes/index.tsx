import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { BrandImage } from "@/components/BrandImage";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { KroweClip } from "@/components/KroweClip";
import { PileInput } from "@/components/PileInput";
import { SweepProgress } from "@/components/SweepProgress";
import { ResultsView } from "@/components/Results";
import { useSweep } from "@/hooks/use-sweep";
import { getKeysStatus } from "@/lib/stash.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STASH | You stopped for a reason. See if it still holds." },
      { name: "description", content: "Drop your old notes. KROWE the crow finds the side projects you abandoned and checks the live web for what changed." },
      { property: "og:title", content: "STASH | You stopped for a reason. See if it still holds." },
      { property: "og:description", content: "KROWE the crow finds your dropped side projects and checks the live web for what changed since." },
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

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      {inputVisible && <section className="flex items-center gap-3 sm:gap-6">
        <BrandImage slot="krowe-standing" alt="KROWE, ready to rescue your unfinished projects" className="h-28 w-20 shrink-0 sm:h-36 sm:w-24" />
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">KROWE says</p>
          <h1 className="max-w-xl text-2xl font-semibold leading-tight sm:text-4xl">You stopped for a reason. <span className="block">See if it still holds.</span></h1>
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
