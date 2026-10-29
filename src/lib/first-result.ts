/** Navigation unlocks only after a completed sweep actually produces ideas. */
export function hasFirstResult(phase: string, ideaCount: number) {
  return phase === "done" && ideaCount > 0;
}