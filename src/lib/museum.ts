import type { IdeaResult, SweepResult } from "./types";

export interface MuseumSweep { id: string; createdAt: string; status: string; result: SweepResult }
export interface Exhibit { key: string; sweepId: string; result: IdeaResult }
export function exhibitStatus(r: IdeaResult) {
  if (r.kit && r.check?.verdict === "REVIVE NOW") return "Ready to pick up";
  if (r.check || r.error) return "Waiting";
  return "KROWE is mulling";
}
export function curatorPick(exhibits: Exhibit[]) {
  return exhibits.find((e) => e.result.check?.verdict === "REVIVE NOW" && e.result.kit)
    ?? exhibits.find((e) => e.result.kit) ?? exhibits[0];
}
export function showPattern(count: number, quotes: number) { return count >= 3 && quotes >= 3; }
export function needsKit(verdict: string) { return ["REVIVE NOW", "NOT YET", "STILL DEAD"].includes(verdict); }