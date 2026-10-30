import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import { Button } from "./ui/button";
import { IdeaCard } from "./Results";
import { RadarCards } from "./RadarCards";
import type { SweepResult } from "@/lib/types";
import { KroweClip } from "./KroweClip";
export interface WorkshopExample { slug: string; title: string; generatedAt: string; result: SweepResult; timings?: { step: string; elapsedMs: number }[] }
export function ExampleIdeas({ examples, onDemo, cached = false }: { examples: WorkshopExample[]; onDemo: (example: WorkshopExample) => void; cached?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [replaying, setReplaying] = useState<WorkshopExample | null>(null), [position, setPosition] = useState(0);
  useEffect(() => {
    if (!replaying) return;
    const events = replaying.timings ?? [];
    const event = events[position];
    if (!event) { setSelected(replaying.slug); setReplaying(null); return; }
    const timer = window.setTimeout(() => setPosition((n) => n + 1), event.elapsedMs);
    return () => window.clearTimeout(timer);
  }, [replaying, position]);
  const chosen = examples.find((example) => example.slug === selected);
  const idea = chosen?.result.ideas[0];
  return <section aria-label="Example ideas" className="space-y-4 border-t border-border pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Example ideas</h2><Button variant="amberOnPaper" onClick={() => { const first = examples.find((e) => e.slug === "toastmasters") ?? examples[0]; if (first) { setPosition(0); if (first.timings?.length) setReplaying(first); else setSelected(first.slug); } }} disabled={!examples.length || Boolean(replaying)}><Play />Watch KROWE work · Nemotron on Nebius + Tavily</Button></div>
    <p className="text-xs text-muted-foreground">{cached ? "Saved example result: the live demo reached this visitor's daily cap. No new search ran." : "Previously generated with real model calls and live web searches, not your ideas."}</p>
    {replaying ? <div aria-live="polite" className="space-y-3 border-y border-border py-5"><p className="eyebrow text-amber-ink">Cached replay · recorded real run · no new searches</p><KroweClip slot={position === 0 ? "shard" : position === 1 ? "bulb" : "typing"} className="h-48 w-32" /><p>{replaying.timings?.[position]?.step.split(":")[0] === "search" ? "Scanning the web, recorded Tavily search" : `Recorded step: ${replaying.timings?.[position]?.step.split(":")[0]}`}</p><Button variant="ghost" onClick={() => { setSelected(replaying.slug); setReplaying(null); }}>Skip replay</Button></div> : chosen && idea ? <div className="space-y-4"><Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft />Back to examples</Button><p className="eyebrow text-amber-ink">Example · generated {new Date(chosen.generatedAt).toLocaleDateString()}</p><IdeaCard r={idea} /><RadarCards r={idea} /></div> : <div className="grid gap-4 sm:grid-cols-3">{examples.map((example) => {
      const r = example.result.ideas[0]; if (!r) return null;
      return <article key={example.slug} className="flex flex-col gap-3 rounded-md border border-border bg-card p-4"><p className="eyebrow text-amber-ink">Example</p><h3 className="text-lg font-semibold">{example.title}</h3><span className="font-mono text-xs text-teal">{r.check?.verdict} · Ready for you</span><p className="text-sm text-muted-foreground">{r.check?.summary}</p><Button variant="link" className="mt-auto justify-start px-0" onClick={() => setSelected(example.slug)}>Open example workbench <ArrowUpRight /></Button></article>;
    })}</div>}
  </section>;
}