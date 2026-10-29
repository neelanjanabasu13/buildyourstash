// Parses a ChatGPT export (conversations.json) in the browser and compacts it
// into a small pile. The raw file never leaves the browser.

export interface Conversation {
  title: string;
  created: number | null;
  updated: number | null;
  messages: { role: "user" | "assistant"; text: string; time: number | null }[];
}

const IDEA_WORDS = /\b(app|idea|project|build|side project|startup|mvp|launch|prototype|saas|product|website|tool|plugin|bot|business|landing page)\b/gi;

function textOf(msg: any): string {
  const parts = msg?.content?.parts;
  if (Array.isArray(parts)) return parts.filter((p) => typeof p === "string").join("\n").trim();
  if (typeof msg?.content?.text === "string") return msg.content.text.trim();
  return "";
}

function walk(conv: any): Conversation["messages"] {
  const mapping = conv?.mapping ?? {};
  const ordered: any[] = [];
  let id: string | undefined = conv?.current_node;
  const seen = new Set<string>();
  while (id && mapping[id] && !seen.has(id)) {
    seen.add(id);
    ordered.push(mapping[id]);
    id = mapping[id].parent;
  }
  ordered.reverse();
  if (!ordered.length) {
    // No current_node: fall back to all nodes sorted by time.
    ordered.push(...Object.values(mapping).sort((a: any, b: any) => (a?.message?.create_time ?? 0) - (b?.message?.create_time ?? 0)));
  }
  const out: Conversation["messages"] = [];
  for (const node of ordered) {
    const role = node?.message?.author?.role;
    if (role !== "user" && role !== "assistant") continue;
    const text = textOf(node.message);
    if (text) out.push({ role, text, time: node.message.create_time ?? null });
  }
  return out;
}

export function parseConversations(json: string): Conversation[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("That conversations.json couldn't be read.");
  }
  if (!Array.isArray(data)) throw new Error("That doesn't look like a ChatGPT export.");
  return data
    .map((c: any) => ({
      title: String(c?.title || "Untitled chat"),
      created: typeof c?.create_time === "number" ? c.create_time : null,
      updated: typeof c?.update_time === "number" ? c.update_time : null,
      messages: walk(c),
    }))
    .filter((c) => c.messages.some((m) => m.role === "user"));
}

const day = (t: number | null) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : "unknown");

/** Higher score = looks more like exploring an idea and then stopping. */
export function dropScore(c: Conversation, now = Date.now() / 1000): number {
  const user = c.messages.filter((m) => m.role === "user");
  const all = user.map((m) => m.text).join(" ") + " " + c.title;
  const ideaHits = Math.min(6, (all.match(IDEA_WORDS) ?? []).length);
  const staleDays = c.updated ? (now - c.updated) / 86400 : 0;
  const span = c.created && c.updated ? c.updated - c.created : 0;
  // Few messages in the last quarter of the conversation's life means it fizzled out.
  const lateCut = (c.created ?? 0) + span * 0.75;
  const late = span > 0 ? user.filter((m) => (m.time ?? 0) > lateCut).length : 0;
  return ideaHits * 2 + Math.min(12, staleDays / 30) + (user.length >= 2 && user.length <= 25 ? 2 : 0) - late;
}

function compact(c: Conversation): string {
  const user = c.messages.filter((m) => m.role === "user");
  const asst = c.messages.filter((m) => m.role === "assistant");
  return [
    `--- chatgpt: ${c.title} ---`,
    `Started ${day(c.created)}, last touched ${day(c.updated)}.`,
    ...user.slice(0, 12).map((m) => `Me: ${m.text.slice(0, 500)}`),
    ...asst.slice(0, 3).map((m) => `ChatGPT (excerpt): ${m.text.slice(0, 220)}`),
  ].join("\n");
}

export function conversationsToPile(convs: Conversation[], budget = 30000): { text: string; used: number } {
  const ranked = [...convs].filter((c) => dropScore(c) > 0).sort((a, b) => dropScore(b) - dropScore(a));
  const blocks: string[] = [];
  let size = 0;
  for (const c of ranked) {
    const b = compact(c);
    if (size + b.length + 2 > budget) continue;
    blocks.push(b);
    size += b.length + 2;
  }
  return { text: blocks.join("\n\n"), used: blocks.length };
}

export async function readExportFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(file);
    const entry = Object.values(zip.files).find((f) => !f.dir && f.name.toLowerCase().endsWith("conversations.json"));
    if (!entry) throw new Error(`No conversations.json inside ${file.name}.`);
    return entry.async("string");
  }
  return file.text();
}
