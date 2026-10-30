import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { beginRadar, searchRadar, finishRadar, draftRadarActions } from "@/lib/radar.functions";
import { RADAR_KINDS } from "@/lib/radar";
import type { Exhibit } from "@/lib/museum";
import { withDeadline, runError } from "@/lib/run-safety";

export function useRadar(exhibits: Exhibit[], paused: boolean) {
  const begin = useServerFn(beginRadar), search = useServerFn(searchRadar), finish = useServerFn(finishRadar), draft = useServerFn(draftRadarActions);
  const cache = useQueryClient();
  const active = useRef(false), attempted = useRef(new Set<string>());
  const [checking, setChecking] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);
  const run = useCallback(async (exhibit: Exhibit, force = false, automatic = false) => {
    if (active.current) { if (force) setErrors((old) => ({ ...old, [exhibit.key]: "I'm already checking an idea. Please wait for it to finish." })); return; }
    active.current = true; attempted.current.add(exhibit.key); setChecking(exhibit.key);
    setErrors((e) => ({ ...e, [exhibit.key]: "" }));
    const data = { sweepId: exhibit.sweepId, ideaId: exhibit.result.idea.id };
    try {
      const roundId = await withDeadline(begin({ data: { ...data, force } }), "Planning this check took too long. Please check again.");
      if (roundId) {
        await withDeadline(Promise.all(RADAR_KINDS.map((kind) => search({ data: { ...data, roundId, kind } }))), "Web searches took too long. Please check again.");
        await withDeadline(finish({ data: { ...data, roundId } }), "Weighing the evidence took too long. Please check again.");
        await cache.invalidateQueries({ queryKey: ["museum"] });
        const kit = await withDeadline(draft({ data }), "Making your drafts took too long. Please check again.");
        if (!kit) throw new Error("I couldn't finish your drafts. Please check again.");
        await cache.invalidateQueries({ queryKey: ["museum"] });
      } else if (force && !automatic) throw new Error("This idea is already being checked. Please wait and try again.");
    } catch (e) { setErrors((old) => ({ ...old, [exhibit.key]: runError(e) })); }
    finally { active.current = false; setChecking(null); setTick((n) => n + 1); }
  }, [begin, search, finish, draft, cache]);
  useEffect(() => {
    if (paused || active.current || document.visibilityState !== "visible") return;
    const next = exhibits.find((e) => e.result.check && !attempted.current.has(e.key));
    if (next) void run(next, true, true);
  }, [exhibits, paused, run, tick]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") { attempted.current.clear(); setTick((n) => n + 1); } }, 60 * 60 * 1000);
    const visible = () => { if (document.visibilityState === "visible") setTick((n) => n + 1); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);
  return { checking, errors, checkAgain: (exhibit: Exhibit) => run(exhibit, true) };
}