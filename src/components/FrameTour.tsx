import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import p1 from "@/assets/krowe1-poster.jpg.asset.json";
import p2 from "@/assets/krowe2-poster.jpg.asset.json";
import p3 from "@/assets/krowe3-poster.jpg.asset.json";
import p4 from "@/assets/krowe4-poster.jpg.asset.json";
import p5 from "@/assets/krowe5-poster.jpg.asset.json";
import p6 from "@/assets/krowe6-poster.jpg.asset.json";
import p7 from "@/assets/krowe7-poster.jpg.asset.json";

const FRAMES = [
  { pic: p1.url, line: "Hi, I am KROWE, the keeper of STASH.", how: "You drop half-written notes, rough thoughts or links into one box. No account needed.", stack: null },
  { pic: p5.url, line: "Most ideas just sit in a pile, asleep.", how: "Not because they were bad, but because nobody gave them a first afternoon of work.", stack: null },
  { pic: p2.url, line: "I find the ones worth picking up.", how: "Nemotron Nano reads your pile and pulls out each idea, quoting your own words.", stack: "NVIDIA Nemotron Nano on Nebius Token Factory" },
  { pic: p3.url, line: "I think through what is missing.", how: "Nemotron Super writes searches made for your idea, so nothing generic gets looked up.", stack: "NVIDIA Nemotron Super on Nebius Token Factory" },
  { pic: p4.url, line: "I research what is happening around it today.", how: "Tavily brings back live sources, and every quote is checked word for word on the server.", stack: "Tavily live search" },
  { pic: p6.url, line: "I lift it closer to shippable.", how: "You get a verdict, BUILD NOW, WATCH or PARK, with the evidence behind it.", stack: "NVIDIA Nemotron Super on Nebius Token Factory" },
  { pic: p7.url, line: "You pick it up and keep going.", how: "Nemotron Ultra writes a pitch, first steps and drafts you can carry into Lovable, Substack or GitHub.", stack: "NVIDIA Nemotron Ultra on Nebius Token Factory" },
];

export function FrameTour({ onDone, autoStart = true }: { onDone?: () => void; autoStart?: boolean }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(autoStart);
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => { if (i < FRAMES.length - 1) setI(i + 1); else setPlaying(false); }, 3200);
    return () => window.clearTimeout(t);
  }, [i, playing]);
  const f = FRAMES[i];
  return (
    <section aria-label="How KROWE works, frame by frame" className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch">
        <img key={f.pic} src={f.pic} alt={f.line} className="workshop-unfold h-72 w-auto shrink-0 rounded-md object-contain" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="eyebrow text-muted-foreground">How it works · {i + 1} of {FRAMES.length}</p>
          <p className="mt-2 font-display text-3xl text-primary" aria-live="polite">{f.line}</p>
          <p className="mt-3 text-base leading-relaxed">{f.how}</p>
          {f.stack && <p className="mt-3 inline-flex w-fit rounded-sm bg-primary px-2 py-1 font-mono text-xs text-primary-foreground">{f.stack}</p>}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <Button variant="paperOutline" size="icon" aria-label="Previous frame" disabled={i === 0} onClick={() => { setPlaying(false); setI(i - 1); }}><ChevronLeft /></Button>
            <Button variant="paperOutline" size="icon" aria-label={playing ? "Pause tour" : "Play tour"} onClick={() => setPlaying(!playing)}>{playing ? <Pause /> : <Play />}</Button>
            <Button variant="paperOutline" size="icon" aria-label="Next frame" disabled={i === FRAMES.length - 1} onClick={() => { setPlaying(false); setI(i + 1); }}><ChevronRight /></Button>
            <div className="flex gap-1" aria-hidden>{FRAMES.map((_, n) => <span key={n} className={`h-1.5 w-4 rounded-full ${n === i ? "bg-primary" : "bg-border"}`} />)}</div>
            {onDone && <Button variant="ghost" className="ml-auto" onClick={onDone}>{i === FRAMES.length - 1 ? "Drop my first idea" : "Skip"}</Button>}
          </div>
        </div>
      </div>
    </section>
  );
}
