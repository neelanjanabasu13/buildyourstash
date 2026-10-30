import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Plus, RefreshCw } from "lucide-react";
import { KroweClip } from "@/components/KroweClip";
import { FrameTour } from "@/components/FrameTour";
import { StackBadge } from "@/components/StackBadge";
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
import { runError } from "@/lib/run-safety";
import { supabase } from "@/integrations/supabase/client";
import { listExamples } from "@/lib/examples.functions";
import { toast } from "sonner";
import { ExampleIdeas, type WorkshopExample } from "@/components/ExampleIdeas";
import { guestIdeas, demoAtCap } from "@/lib/museum";
import { Shelf } from "@/components/Shelf";
import { Showcase } from "@/components/Showcase";

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
  const [introducing, setIntroducing] = useState(true);
  useEffect(() => {
    if (introducedThisVisit) { setIntroducing(false); return; }
    introducedThisVisit = true;
    setIntroducing(true);
  }, []);
  const sweep = useSweep();
  const loadMuseum = useServerFn(listMuseum);
  const museum = useQuery({ queryKey: ["museum"], queryFn: async () => { await ensureGuestSession(); return loadMuseum(); } });
  const loadExamples = useServerFn(listExamples);
  const examples = useQuery({ queryKey: ["workshop-examples"], queryFn: () => loadExamples() });
  const [demo, setDemo] = useState(false);
  const [cachedDemo, setCachedDemo] = useState(false);
  const [hasStashed, setHasStashed] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => { void museum.refetch(); }, 0); });
    return () => data.subscription.unsubscribe();
  }, []);
  const keys = useQuery({ queryKey: ["keys-status"], queryFn: () => getKeysStatus() });
  const keysMissing = keys.data && (!keys.data.nebius || !keys.data.tavily);
  const busy = ["starting", "reading", "checking"].includes(sweep.phase);
  const { unlock } = useFirstResult();
  const [adding, setAdding] = useState(false);
  const ownedSweeps = guestIdeas(museum.data ?? []);
  const count = ownedSweeps.filter((s) => s.id !== sweep.sweepId).reduce((n, s) => n + s.result.ideas.length, 0) + (demo ? 0 : sweep.result.ideas.length);
  useEffect(() => {
    if (demo && demoAtCap(sweep.phase, sweep.message)) setCachedDemo(true);
  }, [demo, sweep.phase, sweep.message]);
  useEffect(() => {
    if (sweep.phase === "error" && sweep.message) toast.error(sweep.message, { duration: 8000 });
  }, [sweep.phase, sweep.message]);
  const runDemo = (example: WorkshopExample) => { setDemo(true); setCachedDemo(false); void sweep.run(example.title, true); };
  useEffect(() => {
    if (hasFirstResult(sweep.phase, sweep.result.ideas.length)) { unlock(); void museum.refetch(); }
  }, [sweep.phase, sweep.result.ideas.length, unlock]);
  const inputVisible = !busy && (count === 0 || adding);
  const firstExample = examples.data?.find((e) => e.slug !== "toastmasters") ?? examples.data?.[0];
  return <>
    <div className="space-y-7 pt-2 sm:pt-4">
    <section className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">{introducing ? <FrameTour onDone={() => setIntroducing(false)} /> : <FrameTour autoStart={false} />}</div>
      <div className="min-w-0 space-y-4">
        <p className="eyebrow text-muted-foreground">STASH · your idea workshop</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Every idea you ever had starts building itself.</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">I'm KROWE, the keeper of STASH. Drop a half-finished idea and I research it live, find what others built, and move it from a 2% spark to about 40% ready. {count ? "Here's what I've been working on for you." : ""}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="amberOnPaper" size="lg" disabled={busy || !firstExample} onClick={() => { if (firstExample) { setIntroducing(false); runDemo(firstExample); } }}><Play />See live demo</Button>
          <a href="#capture" className="text-sm underline underline-offset-4">or drop your own idea</a>
        </div>
        <p className="text-xs text-muted-foreground">The demo runs a real idea through NVIDIA Nemotron on Nebius and Tavily live search, start to finish.</p>
        <StackBadge compact />
      </div>
    </section>
    <section id="capture" className="flex items-center gap-4">
      <KroweClip key={inputVisible ? "capture" : "idle"} slot={busy ? "typing" : inputVisible ? "shard" : "sleep"} className="h-24 w-16 shrink-0" />
      <p className="text-lg font-semibold">{busy ? "KROWE is working on it." : "Your turn: what's an idea you never got round to?"}</p>
    </section>
    {count > 0 && !busy && <Button variant="paperOutline" aria-expanded={adding} onClick={() => setAdding((v) => !v)}><Plus />{adding ? "Back to the workshop" : "Stash another idea"}</Button>}
    {keysMissing && <p className="rounded-md border border-border p-4 text-sm"><KeyRound className="mr-2 inline h-4 w-4" />Keys not set. KROWE needs the model and search keys before he can mull an idea over.</p>}
    {keys.error && <p role="alert" className="text-sm text-destructive">I couldn't check KROWE's keys. You can try stashing your idea again.</p>}
    <div hidden={!inputVisible}><PileInput disabled={busy} onSweep={(pile, example) => { setDemo(example); setHasStashed(!example); setCachedDemo(false); setIntroducing(false); setAdding(false); void sweep.run(pile, example); }} /></div>
    {sweep.message && <div role="alert" className="flex flex-wrap items-center gap-3 border-l-2 border-accent pl-4 text-sm"><p>{sweep.message}</p><Button variant="paperOutline" disabled={busy} onClick={sweep.retry}><RefreshCw />Retry</Button></div>}
    {!busy && ownedSweeps.filter((s) => s.status === "running" && s.id !== sweep.sweepId).map((s) => <div key={s.id} className="flex flex-wrap items-center gap-3 border-l-2 border-accent pl-4"><p className="text-sm">Your idea is saved. Pick up the unfinished work.</p><Button variant="paperOutline" onClick={() => void sweep.resume(s.id)}><RefreshCw />Resume work</Button></div>)}
    {museum.error && <p role="alert" className="text-sm text-destructive">{runError(museum.error)}</p>}
    {busy && <SweepProgress phase={sweep.phase} threadStage={sweep.threadStage} stages={sweep.stages} result={sweep.result} sources={sweep.sources} />}
    {museum.isPending && <p role="status" className="text-sm text-muted-foreground">I'm opening your saved ideas.</p>}
    {demo && sweep.result.ideas.length > 0 ? <section aria-label="Live example result"><p className="eyebrow text-amber-ink">Example · live run</p><Museum sweeps={[]} current={sweep.result} currentId={sweep.sweepId} onFeedback={sweep.giveFeedback} busy={busy} /></section> : <Museum sweeps={ownedSweeps} current={demo ? { ...sweep.result, ideas: [] } : sweep.result} currentId={demo ? null : sweep.sweepId} onFeedback={sweep.giveFeedback} busy={busy} />}
    {!busy && <Showcase />}
    <Shelf onWork={(text) => { setDemo(false); setHasStashed(true); setAdding(false); void sweep.run(text, false); }} busy={busy} />
    {!busy && examples.data && <ExampleIdeas examples={examples.data} onDemo={runDemo} cached={cachedDemo} />}
    {examples.error && count === 0 && <p role="alert" className="text-sm text-destructive">{runError(examples.error)}</p>}
    {!busy && <section aria-labelledby="museum-how" className="space-y-4 border-t border-foreground/20 pt-6"><h2 id="museum-how" className="text-xl font-semibold">How KROWE works</h2><FrameTour autoStart={false} /><StackBadge /><p className="text-xs leading-relaxed text-muted-foreground">Your words and web receipts are checked on the server. Unverifiable claims are dropped. Drafts and verdicts are AI suggestions, not guarantees.</p></section>}
  </div></>;
}
