import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { neutralMuseum } from "./idea-framing";
import type { SweepResult } from "./types";
export const listExamples = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Example work isn't configured yet.");
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key); return fetch(input, { ...init, headers });
  } } });
  const { data, error } = await supabase.from("workshop_examples").select("slug,title,result,generated_at,timings").order("slug");
  if (error) throw new Error("I couldn't load the example work. Please try again.");
  return (data ?? []).map((row) => ({ slug: row.slug, title: row.title, generatedAt: row.generated_at, result: neutralMuseum(row.result as unknown as SweepResult), timings: row.timings as unknown as { step: string; elapsedMs: number }[] }));
});