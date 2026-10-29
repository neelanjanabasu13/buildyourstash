import { describe, expect, it } from "vitest";
import { hasFirstResult } from "@/lib/first-result";

describe("first-result navigation", () => {
  it("keeps advanced navigation hidden before the first result", () => {
    expect(hasFirstResult("idle", 0)).toBe(false);
    expect(hasFirstResult("reading", 0)).toBe(false);
    expect(hasFirstResult("checking", 3)).toBe(false);
    expect(hasFirstResult("error", 3)).toBe(false);
    expect(hasFirstResult("done", 0)).toBe(false);
  });
  it("unlocks advanced navigation after a completed result", () => {
    expect(hasFirstResult("done", 1)).toBe(true);
  });
});