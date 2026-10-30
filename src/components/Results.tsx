import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KroweClip } from "@/components/KroweClip";
import { BrandImage } from "@/components/BrandImage";
import { ARCHETYPES, readiness, readinessSteps } from "@/lib/archetypes";
import type { IdeaResult, Receipt, SweepResult, VerdictLabel } from "@/lib/types";

// Quote-tally badge retired by product decision; kept as a no-op so callers stay stable.
export function TallyBar(_: { result: SweepResult }) {
  return null;
}

function Receipts({ items }: { items: Receipt[] }) {
  return (
    <ul className="space-y-2">
      {items.map((r, i) => (
        <li key={i} className="receipt text-sm">
          “{r.quote}”
        </li>
      ))}
    </ul>
  );
}

const VERDICT_STYLE: Record<VerdictLabel, string> = {
  "BUILD NOW": "bg-revive text-paper",
  "WATCH": "bg-amber text-foreground",
  "PARK": "bg-dead text-paper",
};

function Feedback({ r, onFeedback }: { r: IdeaResult; onFeedback: (f: "yes" | "no", note?: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  if (r.feedback === "yes") return <p className="text-sm text-paper-muted">Your idea, noted.</p>;
  if (r.feedback === "no" && !editing)
    return <p className="text-sm text-paper-muted">Noted{r.feedbackNote ? `: “${r.feedbackNote}”` : ""}.</p>;
  if (editing)
    return (
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          onFeedback("no", note.trim() || undefined);
          setEditing(false);
        }}
      >
        <input
          autoFocus
          maxLength={140}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional: a correction to the idea, in one line"
          aria-label="Your idea correction"
          className="min-h-10 min-w-0 flex-1 rounded-md border border-paper-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber"
        />
        <Button size="sm" variant="paper" type="submit">
          Save
        </Button>
      </form>
    );
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="paper" onClick={() => onFeedback("yes")}>
        Yes, that's my idea
      </Button>
      <Button size="sm" variant="paperOutline" onClick={() => setEditing(true)}>
        Not really
      </Button>
    </div>
  );
}

export function IdeaCard({ r, onFeedback }: { r: IdeaResult; onFeedback?: ((f: "yes" | "no", note?: string) => void) | undefined }) {
  const { idea, check, kit } = r;
  return (
    <section className="border-y border-foreground/20 py-5 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {check && <span className={`mb-4 inline-block rounded-sm px-3 py-2 font-mono text-lg font-bold sm:text-xl ${VERDICT_STYLE[check.verdict]}`}>{check.verdict}</span>}
          <h3 className="text-2xl font-semibold">{idea.name}</h3>

        </div>
        {check && (
          <div className="shrink-0">
            {check.verdict === "BUILD NOW" && <BrandImage slot="krowe-shipped" alt="KROWE celebrates a project ready to build" className="h-32 w-20 sm:w-24" />}
            {check.verdict === "PARK" && <BrandImage slot="krowe-sleeping" alt="KROWE keeps this idea safe" className="h-28 w-20 sm:w-24" />}
          </div>
        )}
      </div>
      <p className="mt-3">{idea.summary}</p>
      <Readiness r={r} />
      {kit && <section className="mt-5"><p className="eyebrow text-amber-ink">I sharpened your pitch</p><p className="mt-2 font-display text-xl italic">{kit.pitch}</p></section>}
      {check && <div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>Confidence: {check.confidence ?? r.radar?.signals[0]?.confidence ?? "low"}</p><p>What would change the verdict: {check.wouldChange ?? r.radar?.signals[0]?.wouldChange ?? "More current, directly relevant source evidence."}</p></div>}

      <section className="mt-6">
        <p className="eyebrow mb-2 text-amber-ink">Your brainwave</p>
        <Receipts items={idea.receipts} />
        {onFeedback && <div className="mt-3"><Feedback r={r} onFeedback={onFeedback} /></div>}
      </section>

      <section className="mt-6">
        <p className="eyebrow mb-2 text-amber-ink">KROWE's research focus</p>
        <p>{r.context?.focus ?? "Current tools, similar ideas and useful launch opportunities."}</p>
      </section>

      <section className="mt-6">
        <p className="eyebrow mb-2 text-amber-ink">Around your idea</p>
        {!check && !r.error && <p className="text-sm text-paper-muted">Checking the web...</p>}
        {check && (
          <>
            {check.nothingFound && <KroweClip slot="sleep" className="mb-3 h-36 w-24" />}
            <p>{check.summary}</p>
            <details className="mt-2 text-xs text-paper-muted"><summary className="cursor-pointer">Search details</summary><p className="mt-1 font-mono">
              searched “{check.query}”{check.searchedSince ? ` since ${check.searchedSince}` : ""}, {check.resultsSeen} results read
            </p></details>
            {check.evidence.length > 0 && (
              <ul className="mt-3 space-y-3">
                {check.evidence.map((e, i) => (
                  <li key={i} className="border-t border-paper-line pt-3">
                    <p className="font-semibold">{e.claim}</p>
                    <p className="receipt mt-2 text-sm">“{e.quote}”</p>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex max-w-full items-center gap-1 text-sm text-primary underline underline-offset-4"
                    >
                      {e.title || e.url} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {check && (
        <details open className="mt-6 border-t-2 border-primary pt-4">
          <summary className="cursor-pointer font-display text-xl font-semibold text-primary">I've done the first piece of work</summary>
          {!kit && !r.error && <p className="text-sm text-paper-muted">{"KROWE is building your first drafts..."}</p>}
          {kit && (
            <div className="mt-4 space-y-4">
              <KroweClip slot={check.verdict === "BUILD NOW" ? "shipped" : "typing"} className="h-40 w-28" />
              <p className="font-display text-lg italic">{kit.pitch}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {kit.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <div className="border-t border-paper-line pt-5">
                <p className="eyebrow mb-2 text-paper-muted">Landing page, ready to paste</p>
                <p className="font-display text-2xl font-extrabold">{kit.headline}</p>
                <p className="mt-2 text-paper-muted">{kit.subhead}</p>
              </div>
            </div>
          )}
        </details>
      )}

      {kit?.steps[0] && <section className="mt-6 border-t border-border pt-4"><p className="eyebrow text-amber-ink">Do this today</p><p className="mt-2 font-display text-lg">{kit.steps[0]}</p></section>}

      {r.error && <p className="mt-4 text-sm text-destructive">Couldn't finish this one: {r.error}</p>}
    </section>
  );
}

export function ResultsView({
  result,
  onFeedback,
  threadPending,
}: {
  result: SweepResult;
  onFeedback?: (ideaId: string, f: "yes" | "no", note?: string) => void;
  threadPending?: boolean;
}) {
  return (
    <div className="space-y-6">
      <TallyBar result={result} />
      {result.ideas.map((r) => (
        <IdeaCard key={r.idea.id} r={r} onFeedback={onFeedback ? (f, n) => onFeedback(r.idea.id, f, n) : undefined} />
      ))}
    </div>
  );
}

export function Readiness({ r }: { r: IdeaResult }) {
  const pct = readiness(r);
  const shape = r.kit?.archetype ? ARCHETYPES[r.kit.archetype] : null;
  return (
    <section className="mt-5 rounded-md border border-paper-line p-4" aria-label="Readiness">
      <div className="flex items-baseline justify-between gap-3"><p className="eyebrow text-amber-ink">Readiness to ship</p><span className="font-mono text-3xl font-bold text-primary">{pct}%</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} /></div>
      <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2">{readinessSteps(r).filter((s) => !s.yours).map((s) => <li key={s.label} className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.done ? "✓" : "○"} {s.label} <span className="font-mono">+{s.points}</span></li>)}</ul>
      <div className="mt-3 border-t border-paper-line pt-3">
        <p className="eyebrow text-amber-ink">The last mile is yours</p>
        <ul className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">{readinessSteps(r).filter((s) => s.yours).map((s) => <li key={s.label}>○ {s.label} <span className="font-mono">+{s.points}</span></li>)}</ul>
        <p className="mt-2 text-sm">100% means you are seconds away from hitting publish. I have done the groundwork, and the real making needs your hands, so pick the next step and tell me how I can help with it.</p>
      </div>
      {shape && <div className="mt-4 border-t border-paper-line pt-3">
        <p className="text-sm">KROWE sees this as: <b>{shape.label}</b>{shape.id === "other" ? ", so no ready-made playbook. Here is a live guide from the web instead." : "."}</p>
        {shape.id === "other" && (r.kit?.liveTemplate?.length ?? 0) > 0 && <ul className="mt-2 space-y-1 text-sm">{r.kit!.liveTemplate!.map((t) => <li key={t.url}><a href={t.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">{t.title || t.url}</a></li>)}</ul>}
        <p className="eyebrow mt-3 text-amber-ink">Carry on here</p>
        <div className="mt-2 flex flex-wrap gap-2">{shape.portals.map((p) => <Button key={p.url} asChild variant="paperOutline" size="sm"><a href={p.url} target="_blank" rel="noreferrer">{p.label} <ExternalLink /></a></Button>)}</div>
      </div>}
    </section>
  );
}
