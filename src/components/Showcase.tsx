const steps = [
  { pct: "Step 1", title: "You drop one line", body: "\u201cA book on baby-led weaning to sell online.\u201d That is all KROWE needs to get started." },
  { pct: "Step 2", title: "KROWE finds the thesis", body: "Nemotron Nano pulls out who it is for and what it promises, quoting your own words." },
  { pct: "Step 3", title: "Tavily checks the live web", body: "Fresh sources, competitors and Devpost or Product Hunt precedents, each one linked." },
  { pct: "Step 4", title: "First work is done", body: "Nemotron Ultra writes a pitch, three next steps and a verdict, then scores how ready it really is." },
];

const pillars = [
  { title: "Save without pressure", body: "Park a thought in one tap, with no research and no account needed." },
  { title: "Live research", body: "Every claim links back to a real source that the server has checked." },
  { title: "Honest readiness", body: "How far KROWE gets depends on the size of the idea. An ebook gets much closer than a factory, and the last mile stays yours." },
  { title: "Where to carry on", body: "Portals such as Lovable, Substack, Gumroad or GitHub, chosen to fit the idea." },
];

export function Showcase() {
  return (
    <section aria-labelledby="showcase" className="space-y-6 border-t border-foreground/20 pt-6">
      <div>
        <p className="eyebrow text-amber-ink">What one note becomes</p>
        <h2 id="showcase" className="text-2xl font-semibold text-primary">From a one-line spark to real first work, in about a minute</h2>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li key={s.pct} className="rounded-lg border border-foreground/20 bg-card p-4">
            <p className="font-serif text-3xl font-semibold text-primary">{s.pct}</p>
            <p className="font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="grid gap-3 sm:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.title} className="rounded-lg border-l-4 border-primary bg-card/60 p-4">
            <p className="font-semibold">{p.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
