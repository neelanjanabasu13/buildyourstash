import { supabase } from "@/integrations/supabase/client";

let pending: Promise<string | null> | null = null;

/** Make sure this browser has a guest (anonymous) session. No login screen for judges. */
export function ensureGuestSession(): Promise<string | null> {
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: signed, error } = await supabase.auth.signInAnonymously();
    if (error) {
      pending = null;
      throw error;
    }
    return signed.user?.id ?? null;
  })();
  return pending;
}
