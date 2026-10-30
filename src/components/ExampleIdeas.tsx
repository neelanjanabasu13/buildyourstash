import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import { Button } from "./ui/button";
import { IdeaCard } from "./Results";
import { RadarCards } from "./RadarCards";
import type { SweepResult } from "@/lib/types";
export interface WorkshopExample { slug: string; title: string; generatedAt: string; result: SweepResult }
export function ExampleIdeas({ examples, onDemo, cached = false }: { examples: WorkshopExample[]; onDemo: (example: WorkshopExample) => void; cached?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = examples.find((example) => example.slug === selected);
  const idea = chosen?.result.ideas[0];
  return <section aria-label="Example ideas" className="space-y-4 border-t border-border pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Example ideas</h2><Button variant="amberOnPaper" onClick={() => { const first = examples.find((e) => e.slug === "toastmasters") ?? examples[0]; if (first) onDemo(first); }} disabled={!examples.length}><Play />Watch KROWE work on an idea</Button></div>
    <p className="text-xs text-muted-foreground">{cached ? "Saved example result: the live demo reached this visitor's daily cap. No new search ran." : "Previously generated with real model calls and live web searches, not your ideas."}</p>
    {chosen && idea ? <div className="space-y-4"><Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft />Back to examples</Button><p className="eyebrow text-amber-ink">Example · generated {new Date(chosen.generatedAt).toLocaleDateString()}</p><IdeaCard r={idea} /><RadarCards r={idea} /></div> : <div className="grid gap-4 sm:grid-cols-3">{examples.map((example) => {
      const r = example.result.ideas[0]; if (!r) return null;
      return <article key={example.slug} className="flex flex-col gap-3 rounded-md border border-border bg-card p-4"><p className="eyebrow text-amber-ink">Example</p><h3 className="text-lg font-semibold">{example.title}</h3><span className="font-mono text-xs text-teal">{r.check?.verdict} · Ready for you</span><p className="text-sm text-muted-foreground">{r.check?.summary}</p><Button variant="link" className="mt-auto justify-start px-0" onClick={() => setSelected(example.slug)}>Open example workbench <ArrowUpRight /></Button></article>;
    })}</div>}
  </section>;
}