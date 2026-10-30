import type { IdeaResult, SweepResult } from "./types";

export interface MuseumSweep { id: string; createdAt: string; status: string; result: SweepResult }
export interface Exhibit { key: string; sweepId: string; result: IdeaResult }
export function exhibitStatus(r: IdeaResult) {
  if (r.kit) return "Ready for you";
  if (r.check && !r.error) return "KROWE is building";
  if (r.context) return "KROWE is mulling";
  return "Just stashed";
}
export function curatorPick(exhibits: Exhibit[]) {
  return exhibits.find((e) => e.result.check?.verdict === "BUILD NOW" && e.result.kit)
    ?? exhibits.find((e) => e.result.kit) ?? exhibits[0];
}
export function showPattern(count: number, quotes: number) { return count >= 3 && quotes >= 3; }
export function needsKit(verdict: string) { return ["BUILD NOW", "WATCH", "PARK"].includes(verdict); }