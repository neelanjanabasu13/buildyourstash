import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import type { IdeaResult, Signal } from "@/lib/types";

export function SignalCard({ signal, compact = false }: { signal: Signal; compact?: boolean }) {
  return <article className="min-w-0 rounded-md border border-teal/40 bg-card p-5">
    <div className="flex flex-wrap gap-2 text-xs font-mono"><span className="text-teal">{signal.type}</span><span className="text-muted-foreground">{signal.confidence} confidence</span></div>
    <h3 className="mt-3 text-xl font-semibold">{signal.headline}</h3>
    {signal.ideaQuote && <blockquote className="receipt mt-3 text-sm">Your idea: “{signal.ideaQuote}”</blockquote>}
    <p className="mt-3 text-sm"><b className="capitalize">{signal.move}</b>: {signal.why}</p>
    {!compact && <><blockquote className="receipt mt-3 text-sm">“{signal.evidence.quote}”</blockquote><p className="mt-3 text-xs text-muted-foreground">Source date: {signal.sourceDate ?? "not supplied by the source"}</p></>}
    <a className="mt-3 inline-flex max-w-full items-center gap-1 break-words text-sm text-primary underline" href={signal.evidence.url} target="_blank" rel="noreferrer">{signal.evidence.title}<ExternalLink className="h-3 w-3 shrink-0" /></a>
    {!compact && <><p className="mt-3 text-sm text-muted-foreground">What would change my mind: {signal.wouldChange}</p>{signal.type === "Opportunity" && signal.deadline && <p className="mt-3 text-sm">Deadline: {signal.deadline}. Prize: {signal.prize ?? "not found"}. {signal.fit}</p>}</>}
  </article>;
}
function ActionCard({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false), [error, setError] = useState(false);
  return <article className="min-w-0 rounded-md border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><h4 className="text-lg font-semibold">{title}</h4><Button size="sm" variant="paperOutline" aria-label={`Copy ${title}`} onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setError(false); } catch { setError(true); } }}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button></div>{children || <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p>}{error && <p role="status" className="mt-2 text-sm text-destructive">Copy wasn't available. You can select the draft above.</p>}</article>;
}
export function RadarCards({ r }: { r: IdeaResult }) {
  if (!r.radar) return null;
  const competitors = r.radar.signals.filter((s) => s.type === "Crowded");
  const events = r.radar.signals.filter((s) => s.type === "Opportunity" && s.deadline);
  const kit = r.kit;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-semibold">From KROWE's radar</h3><span className="text-xs text-muted-foreground">Checked {new Date(r.radar.checkedAt).toLocaleString()}</span></div>
    {r.radar.signals.length ? <div className="grid gap-4 sm:grid-cols-2">{r.radar.signals.map((s, i) => <SignalCard key={i} signal={s} />)}</div> : <p className="text-sm text-muted-foreground">I haven't found new context I can verify yet. Your first drafts can still take shape.</p>}
    <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Radar search receipts</summary><ul className="mt-2 space-y-2">{r.radar.queries.map((q) => <li key={q}>{q}</li>)}</ul><p className="mt-2">{r.radar.webTally.checked} web quotes checked; {r.radar.webTally.dropped} unverifiable quotes dropped. invented-quotes: 0</p></details>
    {kit && <details open className="border-t border-border pt-4"><summary className="cursor-pointer font-semibold text-primary">KROWE's work</summary><p className="mt-3 text-xs text-muted-foreground">Proposed drafts, not sent or published. Any research-backed moves have radar receipts above.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
      <ActionCard title="Sharper pitch" text={kit.pitch} /><ActionCard title="Landing page" text={`${kit.headline}\n\n${kit.subhead}`} /><ActionCard title="Three tiny first steps" text={kit.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")} />
      <ActionCard title="Competitor comparison" text={competitors.length ? ["Source | What shipped | Recommended move", ...competitors.map((s) => `${s.evidence.title} (${s.evidence.url}) | ${s.evidence.quote} | ${s.why}`)].join("\n\n") : "No competitor comparison survived this check. That is not evidence that you have no competitors."}>{competitors.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full table-fixed text-left text-xs"><thead><tr><th className="w-1/3 pb-2">Competitor source</th><th className="w-1/3 pb-2">Verified comparison</th><th className="pb-2">Recommended move</th></tr></thead><tbody>{competitors.map((s, i) => <tr key={i} className="border-t border-border"><td className="break-words py-3 pr-2 align-top"><a className="text-primary underline" href={s.evidence.url} target="_blank" rel="noreferrer">{s.evidence.title}</a></td><td className="break-words py-3 pr-2 align-top">“{s.evidence.quote}”</td><td className="break-words py-3 align-top">{s.move}: {s.why}</td></tr>)}</tbody></table></div>}</ActionCard>
      {events.length > 0 && <ActionCard title="Open events" text={events.map((s) => `${s.evidence.title}\nDeadline: ${s.deadline}\nPrize: ${s.prize ?? "not found"}\nFit: ${s.fit ?? s.why}\n${s.evidence.url}\nReceipt: ${s.evidence.quote}`).join("\n\n")} />}
      {kit.outreach && <ActionCard title="Outreach or submission note" text={kit.outreach} />}
    </div></details>}
  </div>;
}