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

export type Scope = "small" | "medium" | "large";
export const toScope = (v: unknown): Scope | undefined => (v === "small" || v === "medium" || v === "large" ? v : undefined);

/** How far one KROWE pass can honestly take an idea depends on its scope: a newsletter gets much closer than a factory. */
export const SCOPE_CEILING: Record<Scope, number> = { small: 45, medium: 35, large: 12 };
const ARCHETYPE_SCOPE: Record<ArchetypeId, Scope> = { media: "small", "digital-product": "small", "creator-tool": "small", "micro-saas": "medium", "physical-business": "medium", other: "large" };
export const scopeOf = (r: Pick<IdeaResult, "kit">): Scope => r.kit?.scope ?? (r.kit?.archetype ? ARCHETYPE_SCOPE[r.kit.archetype] : "medium");

export interface ReadinessStep { label: string; done: boolean; points: number; yours?: boolean }

const KROWE_STEPS = (r: Pick<IdeaResult, "context" | "check" | "kit" | "radar">): [string, boolean, number][] => [
  ["Research focus", Boolean(r.context), 5],
  ["Checked the live web", Boolean(r.check), 8],
  ["Cited sources", (r.check?.evidence.length ?? 0) > 0, 6],
  ["Shape and scope identified", Boolean(r.kit?.archetype), 4],
  ["Pitch and landing copy", Boolean(r.kit?.pitch && r.kit?.headline), 7],
  ["Three first steps", (r.kit?.steps.length ?? 0) === 3, 4],
  ["Outreach draft", Boolean(r.kit?.outreach), 4],
];

/** Readiness rises only from work actually saved. 100% means seconds from hitting publish; KROWE's share is capped by the idea's scope. */
export function readinessSteps(r: Pick<IdeaResult, "context" | "check" | "kit" | "radar">): ReadinessStep[] {
  const ceiling = SCOPE_CEILING[scopeOf(r)];
  const steps = KROWE_STEPS(r);
  const raw = steps.reduce((n, [, , p]) => n + p, 0);
  const budget = ceiling - 2;
  let used = 0;
  const krowe = steps.map(([label, done, p], i) => {
    const points = i === steps.length - 1 ? budget - used : Math.max(1, Math.round((p / raw) * budget));
    used += points;
    return { label, done, points };
  });
  const rest = 100 - ceiling;
  const make = Math.round(rest * 0.5), audience = Math.round(rest * 0.25);
  return [
    { label: "Captured", done: true, points: 2 },
    ...krowe,
    { label: "Make the real thing (manuscript, build or product)", done: false, points: make, yours: true },
    { label: "Find your first audience or customers", done: false, points: audience, yours: true },
    { label: "Listing ready to submit", done: false, points: rest - make - audience, yours: true },
  ];
}

export const readiness = (r: Parameters<typeof readinessSteps>[0]) =>
  readinessSteps(r).reduce((n, s) => n + (s.done ? s.points : 0), 0);
