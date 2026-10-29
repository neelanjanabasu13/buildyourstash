import { useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandImage } from "@/components/BrandImage";
import type { IdeaResult, Receipt, SweepResult, Thread, VerdictLabel } from "@/lib/types";

export function TallyBar({ result }: { result: SweepResult }) {
  const p = result.pileTally;
  const w = result.webTally;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border px-4 py-3 font-mono text-xs text-muted-foreground">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <span>
        quotes checked: <b className="text-foreground">{p.checked}</b>, invented quotes shown: <b className="text-foreground">0</b>
        {p.dropped > 0 && <> (dropped {p.dropped} that weren't in your pile)</>}
      </span>
      <span>
        web quotes checked: <b className="text-foreground">{w.checked}</b>, unverified shown: <b className="text-foreground">0</b>
        {w.dropped > 0 && <> (dropped {w.dropped})</>}
      </span>
    </div>
  );
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

export function ThreadCard({ thread }: { thread: Thread }) {
  return (
    <article className="paper-card p-6 sm:p-8">
      <p className="eyebrow text-amber-ink">The thread</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight">{thread.theme}</h2>
      <p className="mt-3 text-paper-muted">{thread.explanation}</p>
      <p className="eyebrow mt-5 mb-2 text-paper-muted">Receipts from your pile</p>
      <Receipts items={thread.receipts} />
    </article>
  );
}

const VERDICT_STYLE: Record<VerdictLabel, string> = {
  "REVIVE NOW": "bg-revive text-paper",
  "NOT YET": "bg-notyet text-paper",
  "STILL DEAD": "bg-dead text-paper",
};

function Feedback({ r, onFeedback }: { r: IdeaResult; onFeedback: (f: "yes" | "no", note?: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  if (r.feedback === "yes") return <p className="text-sm text-paper-muted">Thanks, noted.</p>;
  if (r.feedback === "no" && !editing)
    return <p className="text-sm text-paper-muted">Noted{r.feedbackNote ? `: “${r.feedbackNote}”` : ""}.</p>;
  if (editing)
    return (
      <form
        className="flex gap-2"
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
          placeholder="Optional: the real reason, in one line"
          className="flex-1 rounded-md border border-paper-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber"
        />
        <Button size="sm" variant="paper" type="submit">
          Save
        </Button>
      </form>
    );
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="paper" onClick={() => onFeedback("yes")}>
        Yes, that's why
      </Button>
      <Button size="sm" variant="paperOutline" onClick={() => setEditing(true)}>
        Not really
      </Button>
    </div>
  );
}

export function IdeaCard({ r, onFeedback }: { r: IdeaResult; onFeedback?: ((f: "yes" | "no", note?: string) => void) | undefined }) {
  const { idea, why, check, kit } = r;
  return (
    <article className="paper-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold">{idea.name}</h3>
          <p className="mt-1 text-sm text-paper-muted">
            {idea.droppedWhen ? `Dropped: ${idea.droppedWhen}` : "When you dropped it: not stated in your pile"}
          </p>
        </div>
        {check && (
          <div className="flex flex-col items-end gap-2">
            <span className={`eyebrow rounded-full px-3 py-1 font-semibold ${VERDICT_STYLE[check.verdict]}`}>{check.verdict}</span>
            {check.verdict === "REVIVE NOW" && <BrandImage slot="krowe-shipped" alt="KROWE celebrating a revival" label="KROWE shipped" className="h-32 w-28" />}
          </div>
        )}
      </div>
      <p className="mt-3">{idea.summary}</p>

      <section className="mt-6">
        <p className="eyebrow mb-2 text-amber-ink">Why you stopped</p>
        {!why && !r.error && <p className="text-sm text-paper-muted">KROWE is thinking...</p>}
        {why && why.reasons.length === 0 && (
          <p className="text-sm text-paper-muted">Your pile doesn't say why in words KROWE could quote, so it won't guess.</p>
        )}
        {why && why.reasons.length > 0 && (
          <ul className="space-y-3">
            {why.reasons.map((x, i) => (
              <li key={i}>
                <p className="font-semibold">{x.reason}</p>
                <p className="receipt mt-1 text-sm">“{x.quote}”</p>
              </li>
            ))}
          </ul>
        )}
        {why && why.reasons.length > 0 && onFeedback && (
          <div className="mt-3">
            <Feedback r={r} onFeedback={onFeedback} />
          </div>
        )}
      </section>

      {why?.trigger && (
        <section className="mt-6">
          <p className="eyebrow mb-2 text-amber-ink">What would have to change</p>
          <p>{why.trigger}</p>
        </section>
      )}

      <section className="mt-6">
        <p className="eyebrow mb-2 text-amber-ink">Live check</p>
        {why && !check && !r.error && <p className="text-sm text-paper-muted">Checking the web...</p>}
        {check && (
          <>
            {check.nothingFound && <BrandImage slot="krowe-sleeping" alt="KROWE asleep: nothing new found" label="KROWE sleeping" className="mb-3 h-28 w-24" />}
            <p>{check.summary}</p>
            <p className="mt-1 font-mono text-xs text-paper-muted">
              searched “{check.query}”{check.searchedSince ? ` since ${check.searchedSince}` : ""}, {check.resultsSeen} results read
            </p>
            {check.evidence.length > 0 && (
              <ul className="mt-3 space-y-3">
                {check.evidence.map((e, i) => (
                  <li key={i} className="rounded-lg border border-paper-line p-3">
                    <p className="font-semibold">{e.claim}</p>
                    <p className="receipt mt-2 text-sm">“{e.quote}”</p>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-amber-ink underline underline-offset-4"
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

      {check?.verdict === "REVIVE NOW" && (
        <section className="mt-6 rounded-lg bg-paper-deep p-5">
          <p className="eyebrow mb-3 text-amber-ink">Revival kit</p>
          {!kit && !r.error && <p className="text-sm text-paper-muted">KROWE is writing your kit...</p>}
          {kit && (
            <div className="space-y-4">
              <p className="font-display text-lg italic">{kit.pitch}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {kit.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <div className="rounded-md border border-paper-line bg-paper p-5 text-center">
                <p className="eyebrow mb-2 text-paper-muted">Landing page, ready to paste</p>
                <p className="font-display text-2xl font-extrabold">{kit.headline}</p>
                <p className="mt-2 text-paper-muted">{kit.subhead}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {r.error && <p className="mt-4 text-sm text-destructive">Couldn't finish this one: {r.error}</p>}
    </article>
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
      {result.thread && <ThreadCard thread={result.thread} />}
      {!result.thread && !threadPending && result.ideas.length > 1 && (
        <p className="text-sm text-muted-foreground">No recurring thread KROWE could back with your own words.</p>
      )}
      {result.ideas.map((r) => (
        <IdeaCard key={r.idea.id} r={r} onFeedback={onFeedback ? (f, n) => onFeedback(r.idea.id, f, n) : undefined} />
      ))}
    </div>
  );
}
