import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { KroweClip } from "@/components/KroweClip";
import { PileInput } from "@/components/PileInput";
import { SweepProgress } from "@/components/SweepProgress";
import { ResultsView } from "@/components/Results";
import { useSweep } from "@/hooks/use-sweep";
import { getKeysStatus } from "@/lib/stash.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STASH: find abandoned side projects worth restarting" },
      { name: "description", content: "Drop your old notes. KROWE the crow finds the side projects you abandoned and checks the live web for what changed." },
      { property: "og:title", content: "STASH: find abandoned side projects worth restarting" },
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

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 pt-6 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow text-primary">Meet KROWE, the crow who digs up old projects</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            Find the side projects you gave up on, and learn which ones are worth restarting.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Paste your notes, upload files, or link a GitHub repo. STASH picks out the unfinished ideas, shows why you stopped using quotes from
            your own notes, searches the web for what has changed since, and tells you whether to revive each one now, wait, or let it go.
          </p>
        </div>
        <KroweClip slot="munch" className="mx-auto h-72 w-52 sm:h-80 sm:w-56" />
      </section>

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

      <PileInput disabled={busy} sweepBlocked={Boolean(keysMissing)} onSweep={sweep.run} />

      {sweep.phase === "done" && sweep.result.ideas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <KroweClip slot="sleep" className="h-64 w-40" />
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

      {showProgress && sweep.result.ideas.length > 0 && (
        <ResultsView result={sweep.result} onFeedback={sweep.giveFeedback} threadPending={sweep.threadStage !== "done"} />
      )}
    </div>
  );
}
