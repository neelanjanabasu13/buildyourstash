import { MODELS, NEBIUS_DEFAULT_BASE_URL, TAVILY_URL, type ModelRole } from "./models.config";

export class KeysMissingError extends Error {
  constructor(which: string) {
    super(`KEYS_NOT_SET:${which}`);
  }
}

function baseUrlFor(role: ModelRole): string {
  const cfg = MODELS[role];
  const url = cfg.baseUrl ?? process.env["NEBIUS_BASE_URL"] ?? NEBIUS_DEFAULT_BASE_URL;
  return url.endsWith("/") ? url : url + "/";
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export function parseJsonLoose<T>(text: string): T {
  const t = stripThinking(text).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(t) as T;
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1)) as T;
    throw new Error("Model did not return valid JSON");
  }
}

export async function chat(role: ModelRole, system: string, user: string, json: boolean): Promise<string> {
  const key = process.env["NEBIUS_API_KEY"];
  if (!key) throw new KeysMissingError("NEBIUS_API_KEY");
  const cfg = MODELS[role];
  const body: Record<string, unknown> = {
    model: cfg.model,
    temperature: cfg.temperature,
    max_tokens: cfg.maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (json) body["response_format"] = { type: "json_object" };
  const res = await fetch(baseUrlFor(role) + "chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error(`Nebius ${cfg.model} failed`, res.status, detail);
    throw new Error(`Model ${cfg.model} returned ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error(`Model ${cfg.model} returned an empty reply`);
  return stripThinking(content);
}

export async function chatJson<T>(role: ModelRole, system: string, user: string): Promise<T> {
  const text = await chat(role, system + "\nReply with a single JSON object only. No prose.", user, true);
  return parseJsonLoose<T>(text);
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

export async function tavilySearch(query: string, opts: { topic?: "news" | "general"; startDate?: string }) {
  const key = process.env["TAVILY_API_KEY"];
  if (!key) throw new KeysMissingError("TAVILY_API_KEY");
  const body: Record<string, unknown> = {
    query: query.slice(0, 380),
    search_depth: "basic",
    max_results: 6,
    include_answer: false,
    topic: opts.topic ?? "general",
  };
  if (opts.startDate) body["start_date"] = opts.startDate;
  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("Tavily failed", res.status, (await res.text()).slice(0, 300));
    throw new Error(`Web search returned ${res.status}`);
  }
  const data = (await res.json()) as { results?: TavilyResult[] };
  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content ?? "",
    published_date: r.published_date,
  }));
}
