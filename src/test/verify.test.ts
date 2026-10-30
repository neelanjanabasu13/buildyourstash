import { describe, expect, it } from "vitest";
import { filterByQuote, quoteIsInSource, sameUrl, emptyTally } from "@/lib/verify";

const pile = `My “plant watering” bot could use   sensors that cost $40 each.\nA tiny Bluetooth helper for my plants.`;

describe("quote verification", () => {
  it("matches across curly quotes, case and whitespace", () => {
    expect(quoteIsInSource('"Plant watering" bot could use sensors that cost $40', pile)).toBe(true);
  });
  it("rejects a quote not in the pile", () => {
    expect(quoteIsInSource("the sensors were too expensive", pile)).toBe(false);
  });
  it("rejects very short quotes", () => {
    expect(quoteIsInSource("bot", pile)).toBe(false);
  });
  it("drops invented claims and counts them", () => {
    const t = emptyTally();
    const kept = filterByQuote(
      [{ q: "a tiny bluetooth helper for my plants" }, { q: "a giant robot that walks outside" }],
      (x) => x.q,
      pile,
      t,
    );
    expect(kept).toHaveLength(1);
    expect(t).toEqual({ checked: 2, dropped: 1 });
  });
  it("compares urls loosely", () => {
    expect(sameUrl("https://www.example.com/a/", "http://example.com/a")).toBe(true);
    expect(sameUrl("https://example.com/a", "https://example.com/b")).toBe(false);
  });
});
