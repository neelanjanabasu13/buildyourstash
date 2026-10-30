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
  it("a basic full pass on a small idea earns some but not all of its 45% ceiling", () => { const v = readiness(full({ archetype: "media", scope: "small" })); expect(v).toBeGreaterThan(20); expect(v).toBeLessThan(45); });
  it("stronger evidence earns a higher score than weaker evidence on the same idea", () => {
    const weak = full({ scope: "medium" }); const strong = full({ scope: "medium", precedents: [1, 2, 3, 4].map((n) => ({ title: "t", url: `u${n}`, snippet: "" })) });
    expect(readiness({ ...strong, check: { ...strong.check, confidence: "high" as const } })).toBeGreaterThan(readiness(weak));
  });
  it("a large idea never exceeds 12% from KROWE", () => expect(readiness(full({ archetype: "other", scope: "large", precedents: [] }))).toBeLessThanOrEqual(12));
  it("all steps always add up to 100", () => {
    for (const scope of ["small", "medium", "large"] as const) expect(readinessSteps(full({ scope })).reduce((n, s) => n + s.points, 0)).toBe(100);
  });
  it("falls back to other for unknown shapes", () => expect(toArchetype("gpu-factory")).toBe("other"));
});
