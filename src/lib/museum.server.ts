import type { Checked, Idea, IdeaResult, SweepResult, Thread, WhyStopped, LiveCheck, RevivalKit, Radar } from "./types";

/** Called only after the parent handler has checked the owned sweep. No browser writes. */
export async function storePart(sweepId: string, part: string, value: unknown) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("sweep_parts").upsert({ sweep_id: sweepId, part, value: JSON.parse(JSON.stringify(value)) });
  if (error) throw new Error("Couldn't save KROWE's work.");
}
export function assembleParts(parts: { part: string; value: unknown }[]): SweepResult {
  const result: SweepResult = { thread: null, ideas: [], pileTally: { checked: 0, dropped: 0 }, webTally: { checked: 0, dropped: 0 } };
  const values = new Map(parts.map((p) => [p.part, p.value]));
  const ex = values.get("extract") as Checked<Idea[]> | undefined;
  if (!ex) return result;
  result.pileTally = { ...ex.tally };
  const add = (t: { checked: number; dropped: number }) => { result.pileTally.checked += t.checked; result.pileTally.dropped += t.dropped; };
  const thread = values.get("thread") as Checked<Thread | null> | undefined;
  if (thread) { result.thread = thread.value; add(thread.tally); }
  result.ideas = ex.value.map((idea): IdeaResult => {
    const why = values.get(`why:${idea.id}`) as Checked<WhyStopped> | undefined;
    const check = values.get(`check:${idea.id}`) as Checked<LiveCheck> | undefined;
    const kit = values.get(`kit:${idea.id}`) as RevivalKit | undefined;
    const radar = values.get(`radar:${idea.id}`) as Radar | undefined;
    if (radar) { add(radar.pileTally); result.webTally.checked += radar.webTally.checked; result.webTally.dropped += radar.webTally.dropped; }
    if (why) add(why.tally);
    if (check) { result.webTally.checked += check.tally.checked; result.webTally.dropped += check.tally.dropped; }
    return { idea, ...(why ? { why: why.value } : {}), ...(check ? { check: check.value } : {}), ...(kit ? { kit } : {}), ...(radar ? { radar } : {}) };
  });
  return result;
}