import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getKeysStatus, runApiTest, whoAmI } from "@/lib/stash.functions";
import { ensureGuestSession } from "@/lib/session";

export const Route = createFileRoute("/api-test")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "API test | STASH admin" },
      { name: "description", content: "Admin-only check that the STASH model and search keys work." },
      { property: "og:title", content: "API test | STASH admin" },
      { property: "og:description", content: "Admin-only key check for STASH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApiTest,
});

function ApiTest() {
  const who = useServerFn(whoAmI);
  const test = useServerFn(runApiTest);
  const me = useQuery({ queryKey: ["whoami"], queryFn: async () => (await ensureGuestSession(), who()) });
  const keys = useQuery({ queryKey: ["keys-status"], queryFn: () => getKeysStatus() });
  const run = useMutation({ mutationFn: () => test() });

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-4xl font-extrabold">API test</h1>
      <div className="paper-card space-y-4 p-6">
        <p>
          Keys set: NEBIUS_API_KEY {keys.data?.nebius ? "yes" : "no"}, TAVILY_API_KEY {keys.data?.tavily ? "yes" : "no"}
        </p>
        {me.data && !me.data.isAdmin && (
          <p className="text-paper-muted">
            This page is admin-only. Your guest ID is <code className="font-mono text-sm">{me.data.userId}</code>. Ask the project owner to grant it
            the admin role.
          </p>
        )}
        {me.data?.isAdmin && (
          <Button variant="amberOnPaper" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? "Calling each model and Tavily..." : "Run API test"}
          </Button>
        )}
        {run.error && <p className="text-destructive">{run.error.message}</p>}
        {run.data && (
          <ul className="space-y-2 font-mono text-sm">
            {run.data.map((r) => (
              <li key={r.name} className="flex flex-wrap gap-2">
                <b className={r.ok ? "text-revive" : "text-destructive"}>{r.ok ? "PASS" : "FAIL"}</b>
                <span>{r.name}</span>
                <span className="text-paper-muted">
                  {r.ms}ms, {r.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
