import { useState } from "react";
import { ArrowLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { useRadar } from "@/hooks/use-radar";
import { strongestSignal } from "@/lib/radar";
import { RadarCards, SignalCard } from "./RadarCards";
import { Button } from "./ui/button";
import { BrandImage } from "./BrandImage";
import { IdeaCard, TallyBar } from "./Results";
import { curatorPick, exhibitStatus, showPattern, type Exhibit, type MuseumSweep } from "@/lib/museum";
import type { IdeaResult, SweepResult, Thread } from "@/lib/types";

export function Museum({ sweeps, current, currentId, onFeedback, busy, extraPattern }: { sweeps: MuseumSweep[]; current: SweepResult; currentId: string | null; onFeedback: (id: string, f: "yes" | "no", note?: string) => void; busy: boolean; extraPattern?: Thread | null }) {
  const [selected, setSelected] = useState<string | null>(null);
  const visible = currentId ? [{ id: currentId, result: !busy ? sweeps.find((s) => s.id === currentId)?.result ?? current : current }, ...sweeps.filter((s) => s.id !== currentId)] : sweeps;
  const exhibits: Exhibit[] = visible.flatMap((s) => s.result.ideas.map((r) => ({ key: `${s.id}:${r.idea.id}`, sweepId: s.id, result: r })));
  const pick = curatorPick(exhibits);
  const radar = useRadar(exhibits, busy);
  const news = strongestSignal(exhibits.map((e) => ({ key: e.key, radar: e.result.radar })));
  const chosen = exhibits.find((e) => e.key === selected);
  const pattern = visible.map((s) => s.result.thread).find((t) => t && showPattern(exhibits.length, t.receipts.length)) ?? (extraPattern && showPattern(exhibits.length, extraPattern.receipts.length) ? extraPattern : null);
  const tally: SweepResult = { thread: null, ideas: [], pileTally: { checked: 0, dropped: 0 }, webTally: { checked: 0, dropped: 0 } };
  for (const s of visible) { tally.pileTally.checked += s.result.pileTally.checked; tally.pileTally.dropped += s.result.pileTally.dropped; tally.webTally.checked += s.result.webTally.checked; tally.webTally.dropped += s.result.webTally.dropped; }
  if (!exhibits.length) return null;
  const ideaQuote = (r: IdeaResult) => r.idea.receipts[0]?.quote;
  return <section aria-label="Your idea exhibits" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Your exhibits <span className="font-sans text-sm text-muted-foreground">({exhibits.length})</span></h2><TallyBar result={tally} /></div>
    <p className="text-xs text-muted-foreground">I check due exhibits while your museum is open, then again when you return. I don't watch while it's closed.</p>
    {chosen ? <div className="space-y-4">
      <Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft />Back to the museum</Button>
      <IdeaCard r={chosen.result} onFeedback={chosen.sweepId === currentId && !busy ? (f, note) => onFeedback(chosen.result.idea.id, f, note) : undefined} />
      <Button variant="paperOutline" disabled={busy || Boolean(radar.checking)} onClick={() => void radar.checkAgain(chosen)}><RefreshCw />{radar.checking === chosen.key ? "KROWE is scanning the web" : "Check again"}</Button>
      {radar.errors[chosen.key] && <p role="status" className="text-sm text-destructive">{radar.errors[chosen.key]}</p>}
      <RadarCards r={chosen.result} />
    </div> : <>
      {news && <section aria-label="KROWE has news" className="space-y-3 border-y border-teal/40 py-5"><p className="eyebrow text-teal">KROWE has news</p><SignalCard signal={news.signal} /><Button variant="link" className="px-0" onClick={() => setSelected(news.key)}>Pick up this exhibit <ArrowUpRight /></Button></section>}
      {pick && <div className="flex items-center gap-4 border-y border-foreground/20 py-5">
        <BrandImage slot="krowe-thinking" alt="KROWE choosing an exhibit" className="h-24 w-18 shrink-0" />
        <div className="min-w-0 flex-1"><p className="eyebrow text-amber-ink">KROWE picked this one</p><h3 className="mt-2 text-2xl font-semibold">{pick.result.idea.name}</h3><p className="mt-2 text-sm text-muted-foreground">{pick.result.check?.evidence[0]?.claim ?? (pick.result.kit ? "I've made your first drafts. Your idea is already in motion." : "Let me mull this one over.")}</p><Button variant="link" className="mt-2 px-0" onClick={() => setSelected(pick.key)}>Pick it up <ArrowUpRight /></Button></div>
      </div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exhibits.map((e, i) => <article key={e.key} className="flex min-h-64 flex-col rounded-md border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2"><span className="font-mono text-xs text-muted-foreground">EXHIBIT {String(i + 1).padStart(2, "0")}</span><span className="rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">{exhibitStatus(e.result)}</span></div>
          <h3 className="text-xl font-semibold">{e.result.idea.name}</h3>
          {ideaQuote(e.result) ? <blockquote className="receipt mt-4 text-sm">“{ideaQuote(e.result)}”</blockquote> : <p className="mt-4 text-sm text-muted-foreground">{e.result.check ? "Your brainwave has a place here." : "I'm reading your words."}</p>}
          {e.result.check && <span className={`mt-4 self-start rounded-sm px-2 py-1 font-mono text-xs font-semibold ${e.result.check.verdict === "BUILD NOW" ? "bg-revive text-paper" : e.result.check.verdict === "WATCH" ? "bg-accent text-accent-foreground" : "bg-dead text-paper"}`}>{e.result.check.verdict}</span>}
          <Button variant="link" className="mt-auto justify-start px-0 pt-4" onClick={() => setSelected(e.key)}>Pick it up <ArrowUpRight /></Button>
          <Button variant="ghost" size="sm" className="justify-start px-0" disabled={busy || Boolean(radar.checking)} onClick={() => void radar.checkAgain(e)}><RefreshCw />{radar.checking === e.key ? "KROWE is scanning" : "Check again"}</Button>
          {radar.errors[e.key] && <p role="status" className="mt-2 text-sm text-destructive">{radar.errors[e.key]}</p>}
        </article>)}
      </div>
    </>}
    {pattern && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm font-semibold text-primary">KROWE noticed a pattern: {pattern.theme}</summary><div className="mt-3 space-y-2">{pattern.receipts.slice(0, 3).map((r, i) => <blockquote key={i} className="receipt text-sm">“{r.quote}”</blockquote>)}</div></details>}
  </section>;
}