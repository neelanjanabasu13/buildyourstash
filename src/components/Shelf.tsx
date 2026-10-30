import { useEffect, useState } from "react";
import { Button } from "./ui/button";

interface Note { text: string; at: string }
const WORDS = /[a-z]{5,}/g;
const STOP = new Set(["about", "which", "their", "there", "would", "could", "these", "those", "where", "people", "thing", "things", "something"]);

/** Shared words across saved notes: a simple, honest hint at what keeps coming up. */
function commonThread(notes: Note[]) {
  const seen = new Map<string, number>();
  for (const n of notes) for (const w of new Set(n.text.toLowerCase().match(WORDS) ?? [])) if (!STOP.has(w)) seen.set(w, (seen.get(w) ?? 0) + 1);
  return [...seen].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w);
}

export function Shelf({ onWork, busy }: { onWork: (text: string) => void; busy: boolean }) {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    const load = () => { try { setNotes(JSON.parse(window.localStorage.getItem("stash-shelf") ?? "[]")); } catch { setNotes([]); } };
    load(); window.addEventListener("stash-shelf", load);
    return () => window.removeEventListener("stash-shelf", load);
  }, []);
  if (!notes.length) return null;
  const save = (next: Note[]) => { window.localStorage.setItem("stash-shelf", JSON.stringify(next)); setNotes(next); };
  const thread = notes.length >= 2 ? commonThread(notes) : [];
  return <section aria-label="Saved for later" className="space-y-3 border-t border-border pt-5">
    <h2 className="text-2xl">Saved for later</h2>
    <p className="text-xs text-muted-foreground">Kept on this device only. KROWE hasn't touched these until you ask.</p>
    {thread.length > 0 && <p className="rounded-md border border-border bg-card p-3 text-sm"><span className="eyebrow text-amber-ink">Keeps coming up</span><br />Your notes share these words: {thread.join(", ")}.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{notes.map((n, i) => <article key={n.at + i} className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
      <p className="line-clamp-4 whitespace-pre-wrap text-sm">{n.text}</p>
      <p className="font-mono text-[11px] text-muted-foreground">{new Date(n.at).toLocaleDateString()}</p>
      <div className="mt-auto flex gap-2"><Button size="sm" variant="amberOnPaper" disabled={busy || n.text.length < 8} onClick={() => onWork(n.text)}>Ask KROWE to work on it</Button><Button size="sm" variant="ghost" onClick={() => save(notes.filter((_, j) => j !== i))}>Remove</Button></div>
    </article>)}</div>
  </section>;
}
