import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getIdeaPage } from "@/lib/page.functions";
import { ensureGuestSession } from "@/lib/session";
import { KroweClip } from "@/components/KroweClip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { runError } from "@/lib/run-safety";
export const Route = createFileRoute("/p/$id")({
  head: ({ params }) => ({ meta: [{ title: `STASH | KROWE's idea page ${params.id.split(":")[1] ?? "draft"}` }, { name: "description", content: "A proposed landing page built from your idea's generated starter kit." }, { property: "og:title", content: "STASH | KROWE's idea page" }, { property: "og:description", content: "Generated landing-page copy in your guest workshop, not a launched product." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: IdeaPage,
});
function IdeaPage() {
  const { id } = Route.useParams(), get = useServerFn(getIdeaPage);
  const page = useQuery({ queryKey: ["idea-page", id], queryFn: async () => { await ensureGuestSession(); return get({ data: { id } }); } });
  return <section className="space-y-8 py-8"><Link to="/" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Back to STASH</Link>
    {page.isPending && <p role="status">I'm opening the page I made.</p>}
    {page.error && <div role="alert"><p>{runError(page.error)}</p><Button variant="paperOutline" onClick={() => void page.refetch()}><RefreshCw />Retry</Button></div>}
    {page.data?.kit && <><p className="eyebrow text-teal">Proposed page · {page.data.idea.name}</p><div className="border-y border-border py-12"><KroweClip slot="shipped" className="mb-6 h-40 w-28" /><h1 className="max-w-2xl text-4xl font-semibold">{page.data.kit.headline}</h1><p className="mt-6 max-w-xl text-lg leading-relaxed">{page.data.kit.subhead}</p></div><h2 className="text-2xl">The idea</h2><p className="max-w-xl leading-relaxed">{page.data.kit.pitch}</p><p className="text-xs text-muted-foreground">KROWE generated this copy and STASH rendered the page. No product, signup or message has been launched.</p></>}
  </section>;
}