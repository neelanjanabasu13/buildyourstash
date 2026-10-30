import { describe, expect, it } from "vitest";
import { readiness, readinessSteps, toArchetype } from "@/lib/archetypes";
import type { RevivalKit } from "@/lib/types";

const full = (kit: Partial<RevivalKit>) => ({
  context: { receipts: [], focus: "f", searchQuery: "q", topic: "general" as const },
  check: { verdict: "WATCH" as const, summary: "", evidence: [{ claim: "c", url: "u", title: "t", quote: "q" }], nothingFound: false, query: "", searchedSince: null, resultsSeen: 1 },
  kit: { pitch: "p", headline: "h", subhead: "s", steps: ["a", "b", "c"], outreach: "o", ...kit },
});

describe("readiness", () => {
  it("starts at 2% for a just-captured idea", () => expect(readiness({})).toBe(2));
  it("a small idea like a newsletter reaches 45% after a full pass", () => expect(readiness(full({ archetype: "media", scope: "small" }))).toBe(45));
  it("a medium idea like an app reaches 35%", () => expect(readiness(full({ archetype: "micro-saas", scope: "medium" }))).toBe(35));
  it("a large idea like a factory reaches only 12%", () => expect(readiness(full({ archetype: "other", scope: "large" }))).toBe(12));
  it("without a scope, off-map ideas are treated as large", () => expect(readiness(full({ archetype: "other" }))).toBe(12));
  it("all steps always add up to 100", () => {
    for (const scope of ["small", "medium", "large"] as const) expect(readinessSteps(full({ scope })).reduce((n, s) => n + s.points, 0)).toBe(100);
  });
  it("falls back to other for unknown shapes", () => expect(toArchetype("gpu-factory")).toBe("other"));
});
