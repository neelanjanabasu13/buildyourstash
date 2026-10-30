import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { neutralMuseum } from "./idea-framing";
import type { SweepResult } from "./types";
export const listExamples = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("workshop_examples").select("slug,title,result,generated_at,timings").order("slug");
  if (error) throw new Error("I couldn't load the example work. Please try again.");
  return (data ?? []).map((row) => ({ slug: row.slug, title: row.title, generatedAt: row.generated_at, result: neutralMuseum(row.result as unknown as SweepResult), timings: row.timings as unknown as { step: string; elapsedMs: number }[] }));
});