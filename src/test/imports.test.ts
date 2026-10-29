import { describe, expect, it } from "vitest";
import { conversationsToPile, parseConversations } from "@/lib/chatgpt-export";
import { parseRepoUrl } from "@/lib/github";

const conv = (i: number) => ({
  title: `App idea ${i}`,
  create_time: 1600000000,
  update_time: 1600100000,
  current_node: "b",
  mapping: {
    a: { id: "a", parent: null, message: { author: { role: "user" }, content: { parts: ["I want to build an app " + "x".repeat(400)] }, create_time: 1600000000 } },
    b: { id: "b", parent: "a", message: { author: { role: "assistant" }, content: { parts: ["Sure, here is a plan"] }, create_time: 1600000100 } },
  },
});

describe("ChatGPT export", () => {
  it("walks mapping in order and keeps user then assistant", () => {
    const [c] = parseConversations(JSON.stringify([conv(1)]));
    expect(c?.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });
  it("caps the compacted pile at 30,000 characters", () => {
    const convs = parseConversations(JSON.stringify(Array.from({ length: 200 }, (_, i) => conv(i))));
    expect(conversationsToPile(convs, 30000).text.length).toBeLessThanOrEqual(30000);
  });
});

describe("GitHub link", () => {
  it("parses owner and repo", () => {
    expect(parseRepoUrl("https://github.com/octo/hello.git")).toEqual({ owner: "octo", repo: "hello" });
    expect(parseRepoUrl("https://gitlab.com/a/b")).toBeNull();
  });
});
