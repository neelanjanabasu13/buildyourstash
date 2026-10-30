import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import type { IdeaResult } from "@/lib/types";
export function DraftsInbox({ ideas }: { ideas: IdeaResult[] }) {
  const [copied, setCopied] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  return <section aria-label="Drafts inbox" className="space-y-4"><h2 className="text-2xl">Drafts inbox</h2><p className="text-xs text-muted-foreground">Written for you, never sent.</p>
    {ideas.flatMap((r) => r.kit ? [{ key: `${r.idea.id}:pitch`, name: r.idea.name, title: "Pitch paragraph", text: r.kit.pitch }, ...(r.kit.outreach ? [{ key: `${r.idea.id}:outreach`, name: r.idea.name, title: "Outreach draft", text: r.kit.outreach }] : [])] : []).map((draft) => <article key={draft.key + draft.name} className="rounded-md border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow text-teal">{draft.name}</p><h3 className="mt-2 text-xl">{draft.title}</h3></div><Button variant="paperOutline" size="icon" aria-label={`Copy ${draft.title} for ${draft.name}`} title="Copy draft" onClick={async () => { try { await navigator.clipboard.writeText(draft.text); setCopied(draft.key); } catch { setError("Copy wasn't available. You can select the draft text."); } }}>{copied === draft.key ? <Check /> : <Copy />}</Button></div><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{draft.text}</p></article>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}