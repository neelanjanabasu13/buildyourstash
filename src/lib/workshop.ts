import type { IdeaResult } from "./types";

export function workActivity(r: IdeaResult) {
  return r.kit ? "I sharpened the pitch and made your first drafts." : r.radar ? "I researched what's happening around your idea." : r.context ? "I'm finding the tools and context to start with." : "I've picked up your brainwave.";
}
export function activityDate(r: IdeaResult, fallback: string) { return r.kit?.createdAt ?? r.radar?.checkedAt ?? fallback; }
export function activityDay(date: string, now = new Date()) {
  const day = new Date(date);
  if (!Number.isFinite(day.getTime())) return "Work in motion";
  return day.toDateString() === now.toDateString() ? "KROWE did this today" : `KROWE worked on this ${day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}