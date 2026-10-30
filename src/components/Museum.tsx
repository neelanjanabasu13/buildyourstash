import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { useRadar } from "@/hooks/use-radar";
import { KroweClip } from "./KroweClip";
import { strongestSignal } from "@/lib/radar";
import { RadarCards, SignalCard } from "./RadarCards";
import { Button } from "./ui/button";
import { IdeaCard, TallyBar } from "./Results";
import { exhibitStatus, type Exhibit, type MuseumSweep } from "@/lib/museum";
import { activityDate, activityDay, workActivity } from "@/lib/workshop";
import type { SweepResult } from "@/lib/types";

export function Museum({ sweeps, current, currentId, onFeedback, busy }: { sweeps: MuseumSweep[]; current: SweepResult; currentId: string | null; onFeedback: (id: string, f: "yes" | "no", note?: string) => void; busy: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const visible = currentId ? [{ id: currentId, result: !busy ? sweeps.find((s) => s.id === currentId)?.result ?? current : current }, ...sweeps.filter((s) => s.id !== currentId)] : sweeps;
  const exhibits: Exhibit[] = visible.flatMap((s) => s.result.ideas.map((r) => ({ key: `${s.id}:${r.idea.id}`, sweepId: s.id, result: r })));

  const radar = useRadar(exhibits, busy);
  const news = strongestSignal(exhibits.map((e) => ({ key: e.key, radar: e.result.radar })));
  const chosen = exhibits.find((e) => e.key === selected);
  const [seenNews, setSeenNews] = useState<string | null>(null);
  useEffect(() => { try { setSeenNews(localStorage.getItem("stash-news-seen")); } catch { /* optional UI preference */ } }, []);
  const newsIsNew = Boolean(news && (!seenNews || news.checkedAt > seenNews));
  const open = (key: string) => {
    setSelected(key);
    if (news?.key === key) { setSeenNews(news.checkedAt); try { localStorage.setItem("stash-news-seen", news.checkedAt); } catch { /* optional UI preference */ } }
  };
  const tally: SweepResult = { thread: null, ideas: [], pileTally: { checked: 0, dropped: 0 }, webTally: { checked: 0, dropped: 0 } };
  for (const s of visible) { tally.pileTally.checked += s.result.pileTally.checked; tally.pileTally.dropped += s.result.pileTally.dropped; tally.webTally.checked += s.result.webTally.checked; tally.webTally.dropped += s.result.webTally.dropped; }
  if (!exhibits.length) return null;
  return <section aria-label="KROWE’s work feed" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">KROWE’s work <span className="font-sans text-sm text-muted-foreground">({exhibits.length})</span></h2><TallyBar result={tally} /></div>
    <p className="text-xs text-muted-foreground">I get on with research while STASH is open and check due ideas when you return. Your drafts stay here; I don't work while the tab is closed.</p>
    {chosen ? <div className="space-y-4">
      <Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft />Back to the workshop</Button>
      <IdeaCard r={chosen.result} onFeedback={chosen.sweepId === currentId && !busy ? (f, note) => onFeedback(chosen.result.idea.id, f, note) : undefined} />
      <Button variant="paperOutline" disabled={busy || Boolean(radar.checking)} onClick={() => void radar.checkAgain(chosen)}><RefreshCw />{radar.checking === chosen.key ? "KROWE is scanning the web" : "Check again"}</Button>
      {radar.errors[chosen.key] && <p role="status" className="text-sm text-destructive">{radar.errors[chosen.key]}</p>}
      <RadarCards r={chosen.result} />
    </div> : <>
      {news && <section aria-label="KROWE has news" className="space-y-3 border-y border-teal/40 py-5"><p className="eyebrow text-teal">KROWE has news {newsIsNew && <span className="ml-2 rounded-sm bg-teal px-2 py-1 text-paper">New</span>}</p><SignalCard signal={news.signal} /><Button variant="link" className="px-0" onClick={() => open(news.key)}>Open this workbench <ArrowUpRight /></Button></section>}
      <div className="grid gap-4 sm:grid-cols-2">
        {exhibits.map((e) => <article key={e.key} className="flex min-h-64 flex-col rounded-md border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs text-muted-foreground">{activityDay(activityDate(e.result, sweeps.find((s) => s.id === e.sweepId)?.createdAt ?? new Date().toISOString()))}</span><span className="rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">{radar.checking === e.key ? "KROWE is mulling" : exhibitStatus(e.result)}</span></div>
          <h3 className="text-xl font-semibold">{e.result.idea.name}</h3>
          {e.result.kit && <KroweClip slot="typing" className="mt-3 h-24 w-16 self-end" />}
          <p className="mt-3 text-sm text-muted-foreground">{workActivity(e.result)}</p>
          {e.result.error && <p role="status" className="mt-3 text-sm text-destructive">I hit a snag: {e.result.error}</p>}
          {e.result.kit && <p className="mt-4 font-display text-lg italic">{e.result.kit.pitch}</p>}
          {e.result.kit && <p className="mt-3 text-xs text-muted-foreground">Pitch · Landing copy · First steps · Research</p>}
          {e.result.check && <span className={`mt-4 self-start rounded-sm px-2 py-1 font-mono text-xs font-semibold ${e.result.check.verdict === "BUILD NOW" ? "bg-revive text-paper" : e.result.check.verdict === "WATCH" ? "bg-accent text-accent-foreground" : "bg-dead text-paper"}`}>{e.result.check.verdict}</span>}
          <Button variant="link" className="mt-auto justify-start px-0 pt-4" onClick={() => open(e.key)}>Open workbench <ArrowUpRight /></Button>
          <Button variant="ghost" size="sm" className="justify-start px-0" disabled={busy || Boolean(radar.checking)} onClick={() => void radar.checkAgain(e)}><RefreshCw />{radar.checking === e.key ? "KROWE is scanning" : "Check again"}</Button>
          {radar.errors[e.key] && <p role="status" className="mt-2 text-sm text-destructive">{radar.errors[e.key]}</p>}
        </article>)}
      </div>
    </>}

  </section>;
}