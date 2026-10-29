import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { BrandImage } from "./BrandImage";
import { IdeaCard, TallyBar } from "./Results";
import { curatorPick, exhibitStatus, showPattern, type Exhibit, type MuseumSweep } from "@/lib/museum";
import type { IdeaResult, SweepResult } from "@/lib/types";

export function Museum({ sweeps, current, currentId, onFeedback, busy }: { sweeps: MuseumSweep[]; current: SweepResult; currentId: string | null; onFeedback: (id: string, f: "yes" | "no", note?: string) => void; busy: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const visible = currentId ? [{ id: currentId, result: current }, ...sweeps.filter((s) => s.id !== currentId)] : sweeps;
  const exhibits: Exhibit[] = visible.flatMap((s) => s.result.ideas.map((r) => ({ key: `${s.id}:${r.idea.id}`, sweepId: s.id, result: r })));
  const pick = curatorPick(exhibits);
  const chosen = exhibits.find((e) => e.key === selected);
  const pattern = visible.map((s) => s.result.thread).find((t) => t && showPattern(exhibits.length, t.receipts.length));
  const tally: SweepResult = { thread: null, ideas: [], pileTally: { checked: 0, dropped: 0 }, webTally: { checked: 0, dropped: 0 } };
  for (const s of visible) { tally.pileTally.checked += s.result.pileTally.checked; tally.pileTally.dropped += s.result.pileTally.dropped; tally.webTally.checked += s.result.webTally.checked; tally.webTally.dropped += s.result.webTally.dropped; }
  if (!exhibits.length) return null;
  const reason = (r: IdeaResult) => r.feedback === "no" ? r.feedbackNote : r.why?.reasons[0]?.quote;
  return <section aria-label="Your idea exhibits" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Your exhibits <span className="font-sans text-sm text-muted-foreground">({exhibits.length})</span></h2><TallyBar result={tally} /></div>
    {chosen ? <div className="space-y-4">
      <Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft />Back to the museum</Button>
      <IdeaCard r={chosen.result} onFeedback={chosen.sweepId === currentId && !busy ? (f, note) => onFeedback(chosen.result.idea.id, f, note) : undefined} />
    </div> : <>
      {pick && <div className="flex items-center gap-4 border-y border-foreground/20 py-5">
        <BrandImage slot="krowe-thinking" alt="KROWE choosing an exhibit" className="h-24 w-18 shrink-0" />
        <div className="min-w-0 flex-1"><p className="eyebrow text-amber-ink">KROWE picked this one</p><h3 className="mt-2 text-2xl font-semibold">{pick.result.idea.name}</h3><p className="mt-2 text-sm text-muted-foreground">{pick.result.check?.evidence[0]?.claim ?? (pick.result.kit ? "I've made a first draft. You don't have to start from nothing." : "Let me mull this one over.")}</p><Button variant="link" className="mt-2 px-0" onClick={() => setSelected(pick.key)}>Pick it up <ArrowUpRight /></Button></div>
      </div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exhibits.map((e, i) => <article key={e.key} className="flex min-h-64 flex-col rounded-md border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2"><span className="font-mono text-xs text-muted-foreground">EXHIBIT {String(i + 1).padStart(2, "0")}</span><span className="rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">{exhibitStatus(e.result)}</span></div>
          <h3 className="text-xl font-semibold">{e.result.idea.name}</h3>
          {reason(e.result) ? <blockquote className="receipt mt-4 text-sm">“{reason(e.result)}”</blockquote> : <p className="mt-4 text-sm text-muted-foreground">{e.result.check ? "You haven't told me why you stopped. I won't guess." : "I'm reading your words."}</p>}
          {e.result.check && <span className={`mt-4 self-start rounded-sm px-2 py-1 font-mono text-xs font-semibold ${e.result.check.verdict === "REVIVE NOW" ? "bg-revive text-paper" : e.result.check.verdict === "NOT YET" ? "bg-accent text-accent-foreground" : "bg-dead text-paper"}`}>{e.result.check.verdict}</span>}
          <Button variant="link" className="mt-auto justify-start px-0 pt-4" onClick={() => setSelected(e.key)}>Pick it up <ArrowUpRight /></Button>
        </article>)}
      </div>
    </>}
    {pattern && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm font-semibold text-primary">KROWE noticed a pattern: {pattern.theme}</summary><div className="mt-3 space-y-2">{pattern.receipts.slice(0, 3).map((r, i) => <blockquote key={i} className="receipt text-sm">“{r.quote}”</blockquote>)}</div></details>}
  </section>;
}