import { describe, expect, it, vi } from "vitest";
import { runError, withDeadline } from "../lib/run-safety";
describe("visible run failures", () => {
  it("rejects a stalled stage within its deadline", async () => {
    vi.useFakeTimers();
    const result = withDeadline(new Promise(() => {}), "Reading took too long. Please try again.", 15000);
    const assertion = expect(result).rejects.toThrow("Reading took too long");
    await vi.advanceTimersByTimeAsync(15000); await assertion; vi.useRealTimers();
  });
  it("preserves successful stage output", async () => { expect(await withDeadline(Promise.resolve("ready"), "timeout")).toBe("ready"); });
  it("turns an unknown rejection into a useful visible error", () => { expect(runError(undefined)).toBe("I couldn't finish this work. Your idea is still here; please try again."); });
});