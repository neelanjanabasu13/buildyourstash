import type { IdeaResult } from "./types";

// Fast-path playbooks for common idea shapes. Anything else falls back to a live web template.
export type ArchetypeId = "micro-saas" | "media" | "digital-product" | "physical-business" | "creator-tool" | "other";

export interface Portal { label: string; url: string }
export interface Archetype { id: ArchetypeId; label: string; portals: Portal[] }

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  "micro-saas": { id: "micro-saas", label: "Micro SaaS or web app", portals: [{ label: "Keep building on Lovable", url: "https://lovable.dev" }, { label: "Start a repo on GitHub", url: "https://github.com/new" }] },
  media: { id: "media", label: "Publication or newsletter", portals: [{ label: "Keep writing on Substack", url: "https://substack.com" }, { label: "Try Beehiiv", url: "https://www.beehiiv.com" }] },
  "digital-product": { id: "digital-product", label: "Digital product to sell", portals: [{ label: "Sell it on Gumroad", url: "https://gumroad.com" }, { label: "Publish on Amazon KDP", url: "https://kdp.amazon.com" }] },
  "physical-business": { id: "physical-business", label: "Physical product or local business", portals: [{ label: "Open a Shopify store", url: "https://www.shopify.com" }, { label: "Make a landing page on Lovable", url: "https://lovable.dev" }] },
  "creator-tool": { id: "creator-tool", label: "Creator tool or template", portals: [{ label: "Build it on Lovable", url: "https://lovable.dev" }, { label: "Sell templates on Gumroad", url: "https://gumroad.com" }] },
  other: { id: "other", label: "Off the usual map", portals: [{ label: "Write the dossier in Notion", url: "https://www.notion.so" }, { label: "Draft a page on Lovable", url: "https://lovable.dev" }] },
};

export const toArchetype = (v: unknown): ArchetypeId => (typeof v === "string" && v in ARCHETYPES ? (v as ArchetypeId) : "other");

export interface ReadinessStep { label: string; done: boolean; points: number }

/** Readiness rises only from work actually saved for the idea. */
export function readinessSteps(r: Pick<IdeaResult, "context" | "check" | "kit" | "radar">): ReadinessStep[] {
  return [
    { label: "Captured", done: true, points: 2 },
    { label: "Research focus", done: Boolean(r.context), points: 13 },
    { label: "Checked the live web", done: Boolean(r.check), points: 20 },
    { label: "Cited sources", done: (r.check?.evidence.length ?? 0) > 0, points: 15 },
    { label: "Shape identified", done: Boolean(r.kit?.archetype), points: 10 },
    { label: "Pitch and landing copy", done: Boolean(r.kit?.pitch && r.kit?.headline), points: 20 },
    { label: "Three first steps", done: (r.kit?.steps.length ?? 0) === 3, points: 10 },
    { label: "Outreach draft", done: Boolean(r.kit?.outreach), points: 10 },
  ];
}

export const readiness = (r: Parameters<typeof readinessSteps>[0]) =>
  readinessSteps(r).reduce((n, s) => n + (s.done ? s.points : 0), 0);
