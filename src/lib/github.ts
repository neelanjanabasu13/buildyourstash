// Reads a public GitHub repo in the browser via the unauthenticated REST API.
// Uses 3 calls per repo (repo, commits, README) and caches results for an hour.

const CACHE_MS = 60 * 60 * 1000;
const LOVABLE_BOTS = ["lovable-dev[bot]", "gpt-engineer-app[bot]"];
const STALE_DAYS = 90;

export interface RepoInfo {
  fullName: string;
  createdAt: string;
  lastCommitAt: string | null;
  archived: boolean;
  builtWithLovable: boolean;
  readme: string;
  commits: { date: string; message: string }[];
  looksDropped: boolean;
  daysSinceCommit: number | null;
}

export class GitHubError extends Error {}

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const m = input.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function gh(path: string, accept = "application/vnd.github+json") {
  const res = await fetch(`https://api.github.com/${path}`, { headers: { Accept: accept } });
  if ((res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    const mins = reset ? Math.max(1, Math.ceil((reset - Date.now()) / 60000)) : 60;
    throw new GitHubError(`GitHub's free limit of 60 reads an hour is used up. Please try again in about ${mins} minutes.`);
  }
  return res;
}

export async function readRepo(url: string): Promise<RepoInfo> {
  const parsed = parseRepoUrl(url);
  if (!parsed) throw new GitHubError("That doesn't look like a GitHub repo link (github.com/owner/repo).");
  const key = `stash-gh:${parsed.owner}/${parsed.repo}`.toLowerCase();
  try {
    const hit = JSON.parse(localStorage.getItem(key) ?? "null");
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.info as RepoInfo;
  } catch {
    /* ignore cache errors */
  }

  const base = `repos/${parsed.owner}/${parsed.repo}`;
  const repoRes = await gh(base);
  if (repoRes.status === 404) throw new GitHubError("KROWE couldn't find that repo. Is it public?");
  if (!repoRes.ok) throw new GitHubError(`GitHub said no (${repoRes.status}).`);
  const repo = await repoRes.json();

  const [commitsRes, readmeRes] = await Promise.all([
    gh(`${base}/commits?per_page=30`),
    gh(`${base}/readme`, "application/vnd.github.raw"),
  ]);
  const rawCommits: any[] = commitsRes.ok ? await commitsRes.json() : [];
  const readme = readmeRes.ok ? await readmeRes.text() : "";

  const commits = rawCommits.map((c) => ({
    date: String(c?.commit?.author?.date ?? c?.commit?.committer?.date ?? "").slice(0, 10),
    message: String(c?.commit?.message ?? "").split("\n")[0].slice(0, 200),
  }));
  const builtWithLovable = rawCommits.some((c) => {
    const names = [c?.author?.login, c?.committer?.login, c?.commit?.author?.name, c?.commit?.author?.email]
      .filter(Boolean)
      .map((s: string) => s.toLowerCase());
    return LOVABLE_BOTS.some((b) => names.some((n) => n.includes(b)));
  });
  const lastCommitAt = commits[0]?.date || (repo.pushed_at ? String(repo.pushed_at).slice(0, 10) : null);
  const daysSinceCommit = lastCommitAt ? Math.floor((Date.now() - Date.parse(lastCommitAt)) / 86400000) : null;

  const info: RepoInfo = {
    fullName: repo.full_name,
    createdAt: String(repo.created_at).slice(0, 10),
    lastCommitAt,
    archived: Boolean(repo.archived),
    builtWithLovable,
    readme,
    commits,
    daysSinceCommit,
    looksDropped: Boolean(repo.archived) || (daysSinceCommit !== null && daysSinceCommit > STALE_DAYS),
  };
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), info }));
  } catch {
    /* storage full, skip cache */
  }
  return info;
}

export function repoToPile(r: RepoInfo): string {
  const lines = [
    `Repo ${r.fullName} was created on ${r.createdAt}.`,
    r.lastCommitAt ? `The last commit was on ${r.lastCommitAt} (${r.daysSinceCommit} days ago).` : "No commits found.",
    r.archived ? "The repo is archived." : "",
    r.builtWithLovable ? "This repo was built with Lovable." : "",
    r.looksDropped ? "There has been no recent activity, so this looks like a dropped project." : "The repo still has recent activity.",
    "",
    "Commit messages, newest first:",
    ...r.commits.map((c) => `${c.date}: ${c.message}`),
    "",
    "README:",
    r.readme.slice(0, 12000),
  ];
  return lines.filter((l, i) => l !== "" || i > 4).join("\n");
}
