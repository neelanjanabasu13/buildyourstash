import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Plus } from "lucide-react";
import { BrandImage } from "@/components/BrandImage";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ensureGuestSession } from "@/lib/session";
import { Museum } from "@/components/Museum";
import { PileInput } from "@/components/PileInput";
import { SweepProgress } from "@/components/SweepProgress";
import { useSweep } from "@/hooks/use-sweep";
import { getKeysStatus, listMuseum, museumPattern } from "@/lib/stash.functions";
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
  const loadMuseum = useServerFn(listMuseum);
  const museum = useQuery({ queryKey: ["museum"], queryFn: async () => { await ensureGuestSession(); return loadMuseum(); } });
  const keys = useQuery({ queryKey: ["keys-status"], queryFn: () => getKeysStatus() });
  const keysMissing = keys.data && (!keys.data.nebius || !keys.data.tavily);
  const busy = ["starting", "reading", "checking"].includes(sweep.phase);
  const { unlock } = useFirstResult();
  const [adding, setAdding] = useState(false);
  const count = (museum.data ?? []).filter((s) => s.id !== sweep.sweepId).reduce((n, s) => n + s.result.ideas.length, 0) + sweep.result.ideas.length;
  const findPattern = useServerFn(museumPattern);
  const pattern = useQuery({ queryKey: ["museum-pattern", museum.dataUpdatedAt], enabled: count >= 3 && !busy, queryFn: () => findPattern(), staleTime: Infinity, retry: false });
  useEffect(() => {
    if (hasFirstResult(sweep.phase, sweep.result.ideas.length)) { unlock(); void museum.refetch(); }
  }, [sweep.phase, sweep.result.ideas.length, unlock]);
  const inputVisible = !busy && (count === 0 || adding);
  return <div className="space-y-7 pt-2 sm:pt-4">
    <section className="flex items-center gap-4">
      <BrandImage slot={busy ? "krowe-thinking" : "krowe-standing"} alt="KROWE, the curator of your ideas" className="h-32 w-24 shrink-0" />
      <div className="min-w-0 flex-1"><p className="eyebrow text-muted-foreground">STASH · your idea museum</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{count ? "Every idea has a place here." : "Your first idea belongs here."}</h1><p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">I'm KROWE, your curator. {count ? "I'll keep your ideas and check when the reason you stopped expires." : "Hand me one half-formed idea. I'll mull it over and get the first bit moving."}</p></div>
    </section>
    {count > 0 && !busy && <Button variant="paperOutline" aria-expanded={adding} onClick={() => setAdding((v) => !v)}><Plus />{adding ? "Back to the exhibits" : "Stash another idea"}</Button>}
    {keysMissing && <p className="rounded-md border border-border p-4 text-sm"><KeyRound className="mr-2 inline h-4 w-4" />Keys not set. KROWE needs the model and search keys before he can mull an idea over.</p>}
    <div hidden={!inputVisible}><PileInput disabled={busy} sweepBlocked={Boolean(keysMissing)} onSweep={(pile, example) => { setAdding(false); void sweep.run(pile, example); }} /></div>
    {sweep.message && <p role="status" className="border-l-2 border-accent pl-4 text-sm">{sweep.message}</p>}
    {museum.error && <p className="text-sm text-destructive">{museum.error.message}</p>}
    {busy && <SweepProgress phase={sweep.phase} threadStage={sweep.threadStage} stages={sweep.stages} result={sweep.result} />}
    <Museum sweeps={museum.data ?? []} current={sweep.result} currentId={sweep.sweepId} onFeedback={sweep.giveFeedback} busy={busy} extraPattern={pattern.data ?? null} />
    {!busy && <section aria-labelledby="museum-how" className="border-t border-foreground/20 pt-6"><h2 id="museum-how" className="text-xl font-semibold">How it works</h2><ol className="mt-4 grid gap-5 sm:grid-cols-3">{[
      { title: "Stash it", text: "One idea is enough. I'll keep it here." },
      { title: "KROWE mulls it", text: "I'll check what's changed and make a first draft." },
      { title: "You pick it up", text: "One tiny thing today. The ball is already rolling." },
    ].map((step) => <li key={step.title}><h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-1 text-sm text-muted-foreground">{step.text}</p></li>)}</ol><p className="mt-5 text-xs leading-relaxed text-muted-foreground">Your words and web receipts are checked on the server. Unverifiable claims are dropped. Drafts and verdicts are AI suggestions, not guarantees.</p></section>}
  </div>;
}
