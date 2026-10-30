import { describe, expect, it } from "vitest";
import { RADAR_QUERY_CAP, RADAR_KINDS, radarDue, radarQuery, verifyRadar } from "../lib/radar";

const now = "2026-10-30T00:00:00.000Z";
const idea = "A tiny tool that hosts my searchable voice notes.";
const source = { title: "Launch news", url: "https://example.com/launch", content: "Our API price dropped to $1 this month. Open hackathon deadline November 12, 2026. Prize $5000.", published_date: "2026-10-28" };
const signal = { type: "NOW FEASIBLE", headline: "Here's a useful API option for your idea.", idea_quote: idea, url: source.url, quote: "Our API price dropped to $1 this month.", move: "build", why: "The quoted API price supports a small prototype experiment.", confidence: "medium", would_change: "A deployment estimate above the prototype budget." };
describe("KROWE radar rules", () => {
  it("caps each round at three targeted query categories", () => { expect(RADAR_QUERY_CAP).toBe(3); expect(RADAR_KINDS).toEqual(["blocker", "competitors", "events"]); expect(radarQuery("blocker", "Host a tool", idea, now)).toContain(idea); });
  it("keeps only a source URL and a quote actually in its Tavily content", () => {
    const output = verifyRadar({ signals: [signal, { ...signal, quote: "Everything is now free." }, { ...signal, url: "https://invented.example" }] }, [source], idea, [idea], ["query"], now);
    expect(output.signals).toHaveLength(1); expect(output.webTally).toEqual({ checked: 3, dropped: 2 }); expect(output.signals[0]?.evidence.quote).toBe(signal.quote);
  });
  it("drops an idea quote that does not appear in the saved pile", () => { const output = verifyRadar({ signals: [{ ...signal, idea_quote: "A flying car for my commute." }] }, [source], idea, [idea], [], now); expect(output.signals).toHaveLength(0); expect(output.pileTally.dropped).toBe(1); });
  it("supports timing signals without any personal history", () => { expect(verifyRadar({ signals: [{ ...signal, type: "TIMING CHANGED", idea_quote: "" }] }, [source], "An API idea", [], [], now).signals[0]?.type).toBe("TIMING CHANGED"); });
  it("requires future event deadlines and prizes to be present in the same quote", () => {
    const event = { ...signal, type: "EVENT FIT", quote: source.content, deadline: "November 12, 2026", deadline_iso: "2026-11-12", prize: "$5000" };
    const output = verifyRadar({ signals: [event, { ...event, deadline: "November 20, 2026" }, { ...event, deadline_iso: "2026-11-20" }] }, [source], idea, [idea], [], now);
    expect(output.signals).toHaveLength(1); expect(output.signals[0]?.deadline).toBe("November 12, 2026"); expect(output.signals[0]?.prize).toBe("$5000");
    expect(verifyRadar({ signals: [{ ...event, prize: "$100000" }] }, [source], idea, [idea], [], now).signals[0]?.prize).toBeNull();
    expect(verifyRadar({ signals: [event] }, [source], idea, [idea], [], "2026-11-13T00:00:00Z").signals).toHaveLength(0);
  });
  it("preserves missing source dates rather than inventing one", () => { expect(verifyRadar({ signals: [signal] }, [{ ...source, published_date: undefined }], idea, [idea], [], now).signals[0]?.sourceDate).toBeNull(); });
  it("does not report timing changes using undated evidence", () => { expect(verifyRadar({ signals: [{ ...signal, type: "TIMING CHANGED" }] }, [{ ...source, published_date: undefined }], idea, [idea], [], now).signals).toHaveLength(0); });
  it("requires source-backed why, confidence and a change condition for every move", () => { for (const move of ["build", "pivot", "narrow", "park", "watch"]) { expect(verifyRadar({ signals: [{ ...signal, move }] }, [source], idea, [idea], [], now).signals[0]?.move).toBe(move); expect(verifyRadar({ signals: [{ ...signal, move, why: "" }] }, [source], idea, [idea], [], now).signals).toHaveLength(0); } });
  it("checks due exhibits again after a day, not on every render", () => { expect(radarDue(now, Date.parse(now) + 23 * 3600000)).toBe(false); expect(radarDue(now, Date.parse(now) + 24 * 3600000)).toBe(true); });
});