import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), signInAnonymously: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
describe("guest readiness", () => {
  beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); });
  it("rechecks the current session after a previous successful call", async () => {
    auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: "old" } } } }).mockResolvedValueOnce({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({ data: { session: {}, user: { id: "new" } } });
    const { ensureGuestSession } = await import("../lib/session");
    expect(await ensureGuestSession()).toBe("old"); expect(await ensureGuestSession()).toBe("new"); expect(auth.getSession).toHaveBeenCalledTimes(2);
  });
  it("rejects a guest signup without a session instead of silently continuing", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } }); auth.signInAnonymously.mockResolvedValue({ data: { session: null, user: null } });
    const { ensureGuestSession } = await import("../lib/session");
    await expect(ensureGuestSession()).rejects.toThrow("guest session");
  });
  it("allows retry after session lookup fails", async () => {
    auth.getSession.mockRejectedValueOnce(new Error("connection failed")).mockResolvedValueOnce({ data: { session: { user: { id: "retry" } } } });
    const { ensureGuestSession } = await import("../lib/session");
    await expect(ensureGuestSession()).rejects.toThrow(); expect(await ensureGuestSession()).toBe("retry");
  });
});