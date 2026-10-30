import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Plus } from "lucide-react";
import { KroweClip } from "@/components/KroweClip";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ensureGuestSession } from "@/lib/session";
import { Museum } from "@/components/Museum";
import { PileInput } from "@/components/PileInput";
import { SweepProgress } from "@/components/SweepProgress";
import { useSweep } from "@/hooks/use-sweep";
import { getKeysStatus, listMuseum } from "@/lib/stash.functions";
import { useFirstResult } from "@/components/FirstResultContext";
import { hasFirstResult } from "@/lib/first-result";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STASH | Your ideas start building themselves" },
      { name: "description", content: "STASH | Your ideas start building themselves" },
      { property: "og:title", content: "STASH | Your ideas start building themselves" },
      { property: "og:description", content: "STASH | Your ideas start building themselves" },
      { name: "twitter:title", content: "STASH | Your ideas start building themselves" },
      { name: "twitter:description", content: "STASH | Your ideas start building themselves" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

let introducedThisVisit = false;

function Home() {
  const [introducing, setIntroducing] = useState(false);
  useEffect(() => {
    if (introducedThisVisit) return;
    introducedThisVisit = true;
    setIntroducing(true);
    const timer = window.setTimeout(() => setIntroducing(false), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1800 : 6500);
    return () => window.clearTimeout(timer);
  }, []);
  const sweep = useSweep();
  const loadMuseum = useServerFn(listMuseum);
  const museum = useQuery({ queryKey: ["museum"], queryFn: async () => { await ensureGuestSession(); return loadMuseum(); } });
  const keys = useQuery({ queryKey: ["keys-status"], queryFn: () => getKeysStatus() });
  const keysMissing = keys.data && (!keys.data.nebius || !keys.data.tavily);
  const busy = ["starting", "reading", "checking"].includes(sweep.phase);
  const { unlock } = useFirstResult();
  const [adding, setAdding] = useState(false);
  const count = (museum.data ?? []).filter((s) => s.id !== sweep.sweepId).reduce((n, s) => n + s.result.ideas.length, 0) + sweep.result.ideas.length;
  useEffect(() => {
    if (hasFirstResult(sweep.phase, sweep.result.ideas.length)) { unlock(); void museum.refetch(); }
  }, [sweep.phase, sweep.result.ideas.length, unlock]);
  const inputVisible = !busy && (count === 0 || adding);
  return <>
    {introducing && <section aria-label="Meet KROWE" className="flex flex-col items-center gap-4 py-8 text-center">
      <KroweClip slot="rise" eager loop={false} onEnded={() => setIntroducing(false)} className="h-72 w-48" />
      <p className="max-w-md font-display text-2xl text-primary">I'm KROWE. Give me your ideas, I'll get on with them.</p>
      <Button variant="ghost" onClick={() => setIntroducing(false)}>Skip</Button>
    </section>}
    <div hidden={introducing} className={`space-y-7 pt-2 sm:pt-4 ${introducing ? "" : "workshop-unfold"}`}>
    <section className="flex items-center gap-4">
      <KroweClip key={inputVisible ? "capture" : "idle"} slot={busy ? "typing" : inputVisible ? "shard" : "sleep"} className="h-36 w-24 shrink-0" />
      <div className="min-w-0 flex-1"><p className="eyebrow text-muted-foreground">STASH · your idea workshop</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Every idea you ever had starts building itself.</h1><p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">I'm KROWE, the crow who gets on with it. {count ? "Here's what I've been working on for you." : "Stash a brainwave. I'll research what's around it and make your first drafts."}</p></div>
    </section>
    {count > 0 && !busy && <Button variant="paperOutline" aria-expanded={adding} onClick={() => setAdding((v) => !v)}><Plus />{adding ? "Back to the exhibits" : "Stash another idea"}</Button>}
    {keysMissing && <p className="rounded-md border border-border p-4 text-sm"><KeyRound className="mr-2 inline h-4 w-4" />Keys not set. KROWE needs the model and search keys before he can mull an idea over.</p>}
    <div hidden={!inputVisible}><PileInput disabled={busy} sweepBlocked={Boolean(keysMissing)} onSweep={(pile, example) => { setAdding(false); void sweep.run(pile, example); }} /></div>
    {sweep.message && <p role="status" className="border-l-2 border-accent pl-4 text-sm">{sweep.message}</p>}
    {museum.error && <p className="text-sm text-destructive">{museum.error.message}</p>}
    {busy && <SweepProgress phase={sweep.phase} threadStage={sweep.threadStage} stages={sweep.stages} result={sweep.result} />}
    <Museum sweeps={museum.data ?? []} current={sweep.result} currentId={sweep.sweepId} onFeedback={sweep.giveFeedback} busy={busy} />
    {!busy && <section aria-labelledby="museum-how" className="border-t border-foreground/20 pt-6"><h2 id="museum-how" className="text-xl font-semibold">How it works</h2><ol className="mt-4 grid gap-5 sm:grid-cols-3">{[
      { title: "Stash it", text: "One idea is enough. I'll keep it here." },
      { title: "KROWE gets on it", text: "I'll research the context and make your first drafts." },
      { title: "You pick it up", text: "A pitch, page copy and first steps, already in motion." },
    ].map((step) => <li key={step.title}><h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-1 text-sm text-muted-foreground">{step.text}</p></li>)}</ol><p className="mt-5 text-xs leading-relaxed text-muted-foreground">Your words and web receipts are checked on the server. Unverifiable claims are dropped. Drafts and verdicts are AI suggestions, not guarantees.</p></section>}
  </div></>;
}
