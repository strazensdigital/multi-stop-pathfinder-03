import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function useAuth() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null>(null);
  const welcomedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session ?? null);

      // Dedupe "welcome back" in StrictMode & multiple mounts
      if (event === "SIGNED_IN" && !welcomedRef.current) {
        welcomedRef.current = true;

        // Log a login usage event
        if (session?.user?.id) {
          await supabase.from("usage_events").insert({
            user_id: session.user.id,
            event_type: "login",
            meta: {}
          }).single().catch(() => {});
        }

        toast.success("Welcome back!");
      }
      if (event === "SIGNED_OUT") {
        welcomedRef.current = false;
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null };
}
