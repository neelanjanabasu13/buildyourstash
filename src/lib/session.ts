import { supabase } from "@/integrations/supabase/client";
import { withDeadline } from "./run-safety";

let pending: Promise<string | null> | null = null;

/** Make sure this browser has a guest (anonymous) session. No login screen for judges. */
export function ensureGuestSession(): Promise<string | null> {
  if (pending) return pending;
  pending = withDeadline((async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error("I couldn't open your guest session. Please reload and try again.");
    if (data.session) return data.session.user.id;
    const { data: signed, error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw error;
    }
    if (!signed.session || !signed.user) throw new Error("I couldn't open your guest session. Please reload and try again.");
    return signed.user.id;
  })(), "Opening your guest session took too long. Please try again.", 15000).finally(() => { pending = null; });
  return pending;
}
