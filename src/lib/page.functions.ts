import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { assembleParts } from "./museum.server";
export const getIdeaPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().max(150) }).parse(d))
  .handler(async ({ context, data }) => {
    const [sweepId, ideaId] = data.id.split(":");
    if (!sweepId || !ideaId) throw new Error("That page link isn't complete.");
    z.string().uuid().parse(sweepId);
    const { data: row } = await context.supabase.from("sweeps").select("id").eq("id", sweepId).maybeSingle();
    if (!row) throw new Error("This page isn't in your guest workshop.");
    const { data: parts, error } = await context.supabase.from("sweep_parts").select("part,value").eq("sweep_id", sweepId);
    if (error) throw new Error("I couldn't open the page copy.");
    const idea = assembleParts(parts ?? []).ideas.find((r) => r.idea.id === ideaId);
    if (!idea?.kit || idea.check?.verdict !== "BUILD NOW") throw new Error("A page is available after KROWE finishes a BUILD NOW kit.");
    return idea;
  });