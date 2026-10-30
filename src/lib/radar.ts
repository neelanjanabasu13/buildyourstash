import type { Evidence, Radar, Signal, SignalType } from "./types";
import { emptyTally, quoteIsInSource } from "./verify";

export const RADAR_QUERY_CAP = 3;
export const RADAR_REFRESH_MS = 24 * 60 * 60 * 1000;
export const RADAR_KINDS = ["blocker", "competitors", "events"] as const;
export type RadarKind = typeof RADAR_KINDS[number];
export interface RadarSource { title: string; url: string; content: string; published_date?: string | undefined }
export function safeSourceUrl(url: string) {
  try { return new URL(url).protocol === "https:" || new URL(url).protocol === "http:"; } catch { return false; }
}
export function radarDue(checkedAt: string | undefined, now = Date.now()) {
  return !checkedAt || !Number.isFinite(Date.parse(checkedAt)) || now - Date.parse(checkedAt) >= RADAR_REFRESH_MS;
}
export function radarQuery(kind: RadarKind, name: string, blocker: string, date: string) {
  const base = name.slice(0, 140);
  return (kind === "blocker" ? `${base} ${blocker.slice(0, 150)} new model API tool price drop` : kind === "competitors" ? `${base} competitors launched funded` : `${base} open hackathon competition grant deadline prize after ${date}`).slice(0, 380);
}
const text = (v: unknown, max = 600) => typeof v === "string" ? v.trim().slice(0, max).replace(/\u2014/g, ", ") : "";
export function verifyRadar(raw: unknown, sources: RadarSource[], pile: string, reasonQuotes: string[], queries: string[], now = new Date().toISOString()): Radar {
  const webTally = emptyTally(), pileTally = emptyTally();
  const signals: Signal[] = [];
  const entries = raw && typeof raw === "object" && "signals" in raw && Array.isArray(raw.signals) ? raw.signals : [];
  for (const entry of entries.slice(0, 8)) {
    if (!entry || typeof entry !== "object") continue;
    webTally.checked++;
    const source = sources.find((s) => s.url === text(entry.url, 2000) && safeSourceUrl(s.url));
    const quote = text(entry.quote, 1200);
    if (!source || !quoteIsInSource(quote, source.content)) { webTally.dropped++; continue; }
    const type = (["NOW FEASIBLE", "CROWDED / COMPETITOR", "EVENT FIT", "REASON EXPIRED"] as SignalType[]).find((t) => t === entry.type);
    const reasonQuote = text(entry.reason_quote, 600);
    if (reasonQuote) {
      pileTally.checked++;
      if (!reasonQuotes.includes(reasonQuote) || !quoteIsInSource(reasonQuote, pile)) { pileTally.dropped++; continue; }
    }
    if ((type === "REASON EXPIRED" || type === "NOW FEASIBLE") && reasonQuotes.length > 0 && !reasonQuote) continue;
    if (type === "REASON EXPIRED" && !reasonQuote) continue;
    const move = (["revive", "pivot", "narrow", "kill", "wait"] as const).find((v) => v === entry.move);
    const confidence = (["low", "medium", "high"] as const).find((v) => v === entry.confidence);
    const headline = text(entry.headline, 240), why = text(entry.why, 600), wouldChange = text(entry.would_change, 400);
    if (!type || !move || !confidence || !headline || !why || !wouldChange) continue;
    // Deadline and prize must occur in this same verified quote, not merely in model prose.
    const deadline = text(entry.deadline, 100), prize = text(entry.prize, 100);
    if (type === "EVENT FIT") {
      const iso = text(entry.deadline_iso, 10);
      if (!deadline || !quote.includes(deadline) || !/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso < now.slice(0, 10)) continue;
      // The year must appear too: a model may not silently roll an old event forward.
      if (!quote.includes(iso.slice(0, 4))) continue;
      const parsedDeadline = Date.parse(deadline);
      if (!Number.isFinite(parsedDeadline) || new Date(parsedDeadline).toISOString().slice(0, 10) !== iso) continue;
    }
    const evidence: Evidence = { claim: headline, url: source.url, title: source.title, quote };
    signals.push({ type, headline, reasonQuote: reasonQuote || null, evidence, sourceDate: source.published_date || null, move, why, confidence, wouldChange, deadline: type === "EVENT FIT" ? deadline : null, prize: prize && quote.includes(prize) ? prize : null, fit: type === "EVENT FIT" ? text(entry.fit, 300) || null : null });
  }
  return { signals, checkedAt: now, queries: queries.slice(0, RADAR_QUERY_CAP), webTally, pileTally };
}
export function strongestSignal(radars: { key: string; radar?: Radar | undefined }[]) {
  const weight = { high: 3, medium: 2, low: 1 };
  return radars.flatMap((r) => (r.radar?.signals ?? []).map((signal) => ({ key: r.key, signal, checkedAt: r.radar?.checkedAt ?? "" }))).sort((a, b) => weight[b.signal.confidence] - weight[a.signal.confidence] || b.checkedAt.localeCompare(a.checkedAt))[0];
}