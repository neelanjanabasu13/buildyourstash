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

export interface ReadinessStep { label: string; done: boolean; points: number; earned: number; yours?: boolean }

type Input = Pick<IdeaResult, "context" | "check" | "kit" | "radar">;
/** Each criterion has a weight and a quality score from 0 to 1 measured from the saved work, so two ideas rarely land on the same number. */
const KROWE_STEPS = (r: Input): [string, number, number][] => {
  const ev = r.check?.evidence.length ?? 0;
  const conf = r.check?.confidence === "high" ? 1 : r.check?.confidence === "medium" ? 0.7 : r.check ? 0.4 : 0;
  const prec = r.kit?.precedents?.length ?? 0;
  const steps = r.kit?.steps.length ?? 0;
  const signals = r.radar?.signals.length ?? 0;
  return [
    ["Research focus", r.context ? 1 : 0, 5],
    ["Checked the live web", conf, 8],
    ["Cited sources", Math.min(ev, 4) / 4, 7],
    ["Found what others built", Math.min(prec, 4) / 4, 5],
    ["Shape and scope identified", r.kit?.archetype ? 1 : 0, 3],
    ["Pitch and landing copy", (r.kit?.pitch ? 0.5 : 0) + (r.kit?.headline && r.kit?.subhead ? 0.5 : 0), 7],
    ["First steps planned", Math.min(steps, 3) / 3, 4],
    ["Outreach draft", r.kit?.outreach ? 1 : 0, 3],
    ["Fresh signals on the radar", Math.min(signals, 3) / 3, 4],
  ];
};

/** 100% means seconds from hitting publish. The idea's scope sets the most KROWE could ever add; the quality of saved work decides how much of that he actually earned. */
export function readinessSteps(r: Input): ReadinessStep[] {
  const ceiling = SCOPE_CEILING[scopeOf(r)];
  const steps = KROWE_STEPS(r);
  const raw = steps.reduce((n, [, , p]) => n + p, 0);
  const budget = ceiling - 2;
  let used = 0;
  const krowe = steps.map(([label, q, p], i) => {
    const points = i === steps.length - 1 ? budget - used : Math.max(1, Math.round((p / raw) * budget));
    used += points;
    return { label, done: q > 0, points, earned: Math.round(points * q) };
  });
  const rest = 100 - ceiling;
  const make = Math.round(rest * 0.5), audience = Math.round(rest * 0.25);
  return [
    { label: "Captured", done: true, points: 2, earned: 2 },
    ...krowe,
    { label: "Make the real thing (manuscript, build or product)", done: false, points: make, earned: 0, yours: true },
    { label: "Find your first audience or customers", done: false, points: audience, earned: 0, yours: true },
    { label: "Listing ready to submit", done: false, points: rest - make - audience, earned: 0, yours: true },
  ];
}

export const readiness = (r: Parameters<typeof readinessSteps>[0]) =>
  readinessSteps(r).reduce((n, s) => n + s.earned, 0);
