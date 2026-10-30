import { describe, it, expect } from "vitest";
import { voiceError } from "@/hooks/use-voice";
describe("voice capture failures", () => {
  it("microphone denial directs to the typing fallback", () => { expect(voiceError("not-allowed").includes("type your idea")).toBe(true); });
});