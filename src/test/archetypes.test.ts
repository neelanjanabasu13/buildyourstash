import { describe, expect, it } from "vitest";
import { readiness, toArchetype } from "@/lib/archetypes";
describe("readiness", () => {
  it("starts at 2% for a just-captured idea", () => expect(readiness({})).toBe(2));
  it("reaches 100% when every step is saved", () => expect(readiness({ context: { receipts: [], focus: "f", searchQuery: "q", topic: "general" }, check: { verdict: "WATCH", summary: "", evidence: [{ claim: "c", url: "u", title: "t", quote: "q" }], nothingFound: false, query: "", searchedSince: null, resultsSeen: 1 }, kit: { pitch: "p", headline: "h", subhead: "s", steps: ["a", "b", "c"], outreach: "o", archetype: "media" } })).toBe(100));
  it("falls back to other for unknown shapes", () => expect(toArchetype("gpu-factory")).toBe("other"));
});
