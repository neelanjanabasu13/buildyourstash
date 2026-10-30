import { useEffect, useState } from "react";

interface MapIdea { key: string; name: string; text: string; saved?: boolean }

const STOP = new Set("a an the and or for of to in on with my your our app that this from into about at by is it be as are new own make build sell online local weekend idea ideas people who what more less like using use".split(" "));
const words = (t: string) => new Set(t.toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !STOP.has(w)).map((w) => w.replace(/s$/, "")) ?? []);

/** Connections are shared words in your own idea text, shown plainly; nothing is inferred beyond that. */
export function IdeaMap({ ideas, onOpen }: { ideas: MapIdea[]; onOpen: (key: string) => void }) {
  const [shelf, setShelf] = useState<MapIdea[]>([]);
  useEffect(() => {
    const load = () => { try { setShelf((JSON.parse(localStorage.getItem("stash-shelf") ?? "[]") as { text: string; at: string }[]).slice(0, 6).map((n) => ({ key: `shelf:${n.at}`, name: n.text.slice(0, 40), text: n.text, saved: true }))); } catch { setShelf([]); } };
    load(); window.addEventListener("stash-shelf", load); return () => window.removeEventListener("stash-shelf", load);
  }, []);
  const all = [...ideas, ...shelf].slice(0, 12);
  const sets = all.map((i) => words(i.text));
  const links: { a: number; b: number; shared: string[] }[] = [];
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
    const shared = [...sets[a]!].filter((w) => sets[b]!.has(w));
    if (shared.length) links.push({ a, b, shared });
  }
  const counts = new Map<string, number>();
  sets.forEach((s) => s.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1)));
  const top = [...counts].filter(([, n]) => n > 1).sort((x, y) => y[1] - x[1]).slice(0, 3);
  const W = 640, H = 340, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 50;
  const pos = all.map((_, i) => ({ x: cx + R * 1.4 * Math.cos((2 * Math.PI * i) / all.length - Math.PI / 2), y: cy + R * Math.sin((2 * Math.PI * i) / all.length - Math.PI / 2) }));
  return <section aria-label="Idea map" className="space-y-3 rounded-md border border-foreground/25 bg-card p-4">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-lg font-semibold text-primary">Your idea map</h3><p className="text-xs text-muted-foreground">Lines join ideas that share words you wrote. Dashed circles are notes saved for later.</p></div>
    {top.length > 0 ? <div className="border-l-2 border-accent pl-3 text-sm"><p className="eyebrow text-amber-ink">Special connection</p><p>You keep coming back to <strong>{top.map(([w]) => w).join(", ")}</strong>, which shows up across {top[0]![1]} of your ideas. That might be the thing you really want to make, so it could be worth stashing one idea that combines them.</p></div>
      : <p className="text-sm text-muted-foreground">No shared threads yet. Each new idea you stash or save gives KROWE more to connect.</p>}
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of your ideas and their shared words">
      {links.map((l) => <g key={`${l.a}-${l.b}`}><line x1={pos[l.a]!.x} y1={pos[l.a]!.y} x2={pos[l.b]!.x} y2={pos[l.b]!.y} className="stroke-accent" strokeWidth={1 + l.shared.length} /><text x={(pos[l.a]!.x + pos[l.b]!.x) / 2} y={(pos[l.a]!.y + pos[l.b]!.y) / 2 - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">{l.shared.slice(0, 2).join(", ")}</text></g>)}
      {all.map((i, n) => <g key={i.key} className={i.saved ? "" : "cursor-pointer"} onClick={() => { if (!i.saved) onOpen(i.key); }}>
        <circle cx={pos[n]!.x} cy={pos[n]!.y} r={10} className={i.saved ? "fill-background stroke-primary" : "fill-primary stroke-primary"} strokeDasharray={i.saved ? "3 3" : undefined} strokeWidth={2} />
        <text x={pos[n]!.x} y={pos[n]!.y + 26} textAnchor="middle" className="fill-foreground text-[12px]">{i.name.length > 28 ? `${i.name.slice(0, 27)}…` : i.name}</text>
      </g>)}
    </svg>
  </section>;
}
