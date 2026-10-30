import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { beginRadar, searchRadar, finishRadar, draftRadarActions } from "@/lib/radar.functions";
import { RADAR_KINDS, radarDue } from "@/lib/radar";
import type { Exhibit } from "@/lib/museum";

export function useRadar(exhibits: Exhibit[], paused: boolean) {
  const begin = useServerFn(beginRadar), search = useServerFn(searchRadar), finish = useServerFn(finishRadar), draft = useServerFn(draftRadarActions);
  const cache = useQueryClient();
  const active = useRef(false), attempted = useRef(new Set<string>());
  const [checking, setChecking] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);
  const run = useCallback(async (exhibit: Exhibit, force = false) => {
    if (active.current) return;
    active.current = true; attempted.current.add(exhibit.key); setChecking(exhibit.key);
    setErrors((e) => ({ ...e, [exhibit.key]: "" }));
    const data = { sweepId: exhibit.sweepId, ideaId: exhibit.result.idea.id };
    try {
      const roundId = await begin({ data: { ...data, force } });
      if (roundId) {
        await Promise.all(RADAR_KINDS.map((kind) => search({ data: { ...data, roundId, kind } })));
        await finish({ data: { ...data, roundId } });
        await cache.invalidateQueries({ queryKey: ["museum"] });
        await draft({ data });
        await cache.invalidateQueries({ queryKey: ["museum"] });
      }
    } catch (e) { setErrors((old) => ({ ...old, [exhibit.key]: e instanceof Error ? e.message : "I couldn't finish this radar check." })); }
    finally { active.current = false; setChecking(null); setTick((n) => n + 1); }
  }, [begin, search, finish, draft, cache]);
  useEffect(() => {
    if (paused || active.current || document.visibilityState !== "visible") return;
    const next = exhibits.find((e) => e.result.check && radarDue(e.result.radar?.checkedAt) && !attempted.current.has(e.key));
    if (next) void run(next);
  }, [exhibits, paused, run, tick]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") { attempted.current.clear(); setTick((n) => n + 1); } }, 60 * 60 * 1000);
    const visible = () => { if (document.visibilityState === "visible") setTick((n) => n + 1); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);
  return { checking, errors, checkAgain: (exhibit: Exhibit) => run(exhibit, true) };
}