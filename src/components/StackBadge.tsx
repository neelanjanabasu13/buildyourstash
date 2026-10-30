import { MODELS } from "@/lib/models.config";

const short = (id: string) => id.split("/").pop()!.replace(/^NVIDIA-/, "");

/** Makes the hackathon stack obvious: NVIDIA Nemotron on Nebius Token Factory, plus Tavily search. */
export function StackBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Powered by NVIDIA Nemotron on Nebius Token Factory · Tavily live search</p>;
  }
  const rows = [
    { who: "Nemotron Nano", id: MODELS.extract.model, job: "pulls the ideas out of your notes" },
    { who: "Nemotron Super", id: MODELS.reason.model, job: "plans KROWE's web searches and weighs the evidence" },
    { who: "Nemotron Ultra", id: MODELS.write.model, job: "writes your pitch, first steps and handoff drafts" },
    { who: "Tavily", id: "Tavily Search API", job: "brings back live web sources, with quotes checked word for word" },
  ];
  return (
    <section aria-label="What powers KROWE" className="rounded-md border-2 border-primary/70 bg-card p-4">
      <p className="eyebrow text-primary">KROWE's engine</p>
      <h2 className="mt-1 text-lg font-semibold">Every step is a real call to NVIDIA Nemotron on Nebius Token Factory, and every source comes from Tavily.</h2>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {rows.map((r) => <li key={r.who} className="rounded-sm border border-border p-2"><span className="font-semibold text-primary">{r.who}</span> {r.job}<span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">{short(r.id)}</span></li>)}
      </ul>
    </section>
  );
}
