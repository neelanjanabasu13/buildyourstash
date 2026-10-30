import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { LIMITS } from "@/lib/models.config";
describe("Scope B safety rules", () => {
  it("preserves the existing per-visitor limits", () => {
    expect(LIMITS).toEqual({ sweepsPerDay: 20, maxPileChars: 30000, maxIdeas: 8 });
  });
  it("limits persisted step retries to three attempts", () => {
    const sql = readFileSync("drizzle/migrations/0004_durable_workshop_jobs.sql", "utf8");
    expect(sql).toContain("job.attempts >= 3");
  });
  it("applies aggregate call caps before provider work", () => {
    const sql = readFileSync("drizzle/migrations/0004_durable_workshop_jobs.sql", "utf8");
    expect(sql).toContain("THEN 500 ELSE 500");
    expect(sql).toContain("calls < cap");
  });
});