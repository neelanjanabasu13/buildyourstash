import { describe, expect, it } from "vitest";
import { neutralExhibit, neutralVerdict, verdictForMove } from "../lib/idea-framing";
import { exhibitStatus } from "../lib/museum";
import type { IdeaResult } from "../lib/types";
const idea = { id: "one", name: "Voice notes", summary: "Searchable voice notes", droppedWhen: null, droppedDate: null, receipts: [{ quote: "Searchable voice notes for my team." }] };
describe("brainwave reframe", () => {
  it.each([["build", "BUILD NOW"], ["watch", "WATCH"], ["park", "PARK"], ["narrow", "WATCH"], ["pivot", "WATCH"]])("maps %s to %s", (move, verdict) => { expect(verdictForMove(move)).toBe(verdict); });
  it("uses WATCH without source-backed movement", () => { expect(verdictForMove(undefined)).toBe("WATCH"); });
  it.each([["REVIVE NOW", "BUILD NOW"], ["NOT YET", "WATCH"], ["STILL DEAD", "PARK"]])("normalizes a saved %s verdict", (old, label) => { expect(neutralVerdict(old)).toBe(label); });
  it("retains legacy source receipts without replaying old interpretations", () => {
    const legacy = { idea, check: { verdict: "STILL DEAD", summary: "An old interpretation", evidence: [{ claim: "An old interpretation", title: "Source", url: "https://example.com", quote: "A real source quote" }], nothingFound: false, query: "query", searchedSince: null, resultsSeen: 1 }, kit: { pitch: "Old draft", headline: "Old draft", subhead: "Old draft", steps: [] } } as unknown as IdeaResult;
    const result = neutralExhibit(legacy);
    expect(result.check?.verdict).toBe("PARK"); expect(result.check?.evidence[0]?.quote).toBe("A real source quote"); expect(result.kit).toBeUndefined();
  });
  it("uses the four neutral work statuses", () => {
    const r: IdeaResult = { idea };
    expect(exhibitStatus(r)).toBe("Just stashed");
    const context = { receipts: idea.receipts, focus: "Voice tools", searchQuery: "voice tools", topic: "general" as const };
    expect(exhibitStatus({ ...r, context })).toBe("KROWE is mulling");
    const check = { verdict: "WATCH" as const, summary: "Context", evidence: [], nothingFound: true, query: "q", searchedSince: null, resultsSeen: 0 };
    expect(exhibitStatus({ ...r, context, check })).toBe("KROWE is building");
    expect(exhibitStatus({ ...r, check, kit: { pitch: "Pitch", headline: "Headline", subhead: "Subhead", steps: ["Sketch"] } })).toBe("Ready for you");
  });
});