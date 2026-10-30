import { describe, expect, it } from "vitest";
import { curatorPick, exhibitStatus, needsKit, showPattern, type Exhibit } from "@/lib/museum";
import { assembleParts } from "@/lib/museum.server";
import type { IdeaResult } from "@/lib/types";
const one: IdeaResult = { idea: { id: "one", name: "My idea", summary: "", droppedWhen: null, droppedDate: null, receipts: [{ quote: "private notes search" }] } };
describe("museum rules", () => {
  it("works with one exhibit and no required pattern", () => {
    const exhibit: Exhibit = { key: "a", sweepId: "s", result: one };
    expect(curatorPick([exhibit])).toBe(exhibit);
    expect(showPattern(1, 3)).toBe(false);
    expect(exhibitStatus(one)).toBe("Just stashed");
  });
  it("only shows a pattern with three exhibits and three receipts", () => {
    expect(showPattern(2, 3)).toBe(false); expect(showPattern(3, 2)).toBe(false); expect(showPattern(3, 3)).toBe(true);
  });
  it.each(["BUILD NOW", "WATCH", "PARK"])("does first work for %s", (v) => { expect(needsKit(v)).toBe(true); });
  it("assembles persisted work from authoritative server parts", () => {
    const result = assembleParts([{ part: "extract", value: { value: [one.idea], tally: { checked: 1, dropped: 0 } } }]);
    expect(result.ideas[0]?.idea.name).toBe("My idea"); expect(result.pileTally.checked).toBe(1); expect(result.thread).toBeNull();
  });
  it("persists radar tally and ignores an unfinished replacement draft", () => {
    const result = assembleParts([{ part: "extract", value: { value: [one.idea], tally: { checked: 1, dropped: 0 } } }, { part: "radar:one", value: { signals: [], queries: ["query"], checkedAt: "2026-10-30", pileTally: { checked: 2, dropped: 1 }, webTally: { checked: 4, dropped: 2 } } }, { part: "kit:one", value: { pending: true } }]);
    expect(result.ideas[0]?.kit).toBeUndefined(); expect(result.ideas[0]?.radar?.queries).toEqual(["query"]); expect(result.pileTally).toEqual({ checked: 3, dropped: 1 }); expect(result.webTally).toEqual({ checked: 4, dropped: 2 });
  });
});