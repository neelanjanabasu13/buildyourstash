import { describe, expect, it } from "vitest";
import { activityDate, activityDay, workActivity } from "../lib/workshop";
import type { IdeaResult } from "../lib/types";
const idea: IdeaResult = { idea: { id: "one", name: "Voice tasks", summary: "Voice tasks", receipts: [{ quote: "Voice tasks for my team" }], droppedWhen: null, droppedDate: null } };
describe("workshop activity", () => {
  it("describes actual drafts rather than merely displaying the idea", () => { expect(workActivity({ ...idea, kit: { pitch: "A pitch", headline: "Headline", subhead: "Subhead", steps: [] } })).toBe("I sharpened the pitch and made your first drafts."); });
  it("uses the saved draft completion date", () => { expect(activityDate({ ...idea, kit: { pitch: "p", headline: "h", subhead: "s", steps: [], createdAt: "2026-10-30T00:00:00Z" } }, "2026-10-29")).toBe("2026-10-30T00:00:00Z"); });
  it("only calls work today when it was done today", () => { const now = new Date("2026-10-30T12:00:00Z"); expect(activityDay("2026-10-30T00:00:00Z", now)).toBe("KROWE did this today"); expect(activityDay("2026-10-28T00:00:00Z", now)).not.toBe("KROWE did this today"); });
});