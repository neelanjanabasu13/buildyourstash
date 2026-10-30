import type { IdeaResult, SweepResult, VerdictLabel } from "./types";

/** Retain saved receipts, but never replay older interpretations of a person's behaviour. */
export function neutralVerdict(value: string): VerdictLabel {
  if (value === "BUILD NOW" || value === "REVIVE NOW") return "BUILD NOW";
  if (value === "PARK" || value === "STILL DEAD") return "PARK";
  return "WATCH";
}
export function neutralExhibit(input: IdeaResult): IdeaResult {
  const legacy = input.check && !["BUILD NOW", "WATCH", "PARK"].includes(input.check.verdict);
  if (!legacy) return input;
  const evidence = input.check?.evidence.map((e) => ({ ...e, claim: e.title || "Source context" })) ?? [];
  return { idea: input.idea, ...(input.check ? { check: { ...input.check, verdict: neutralVerdict(input.check.verdict), summary: "I've kept the source receipts. Check again for fresh context and new work on this idea.", evidence } } : {}), ...(input.feedback ? { feedback: input.feedback } : {}) };
}
export function neutralMuseum(result: SweepResult): SweepResult {
  return { ...result, ideas: result.ideas.map(neutralExhibit) };
}
export function verdictForMove(move: string | undefined): VerdictLabel {
  return move === "build" ? "BUILD NOW" : move === "park" ? "PARK" : "WATCH";
}