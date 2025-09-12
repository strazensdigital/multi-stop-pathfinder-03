// src/hooks/useAuth.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthState = {
  loading: boolean;
  session: Session | null;
  email: string | null;
  plan: string; // "free" | "pro"
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    email: null,
    plan: "free",
  });
  const welcomedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Initial load
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      let plan = "free";
      const email = session?.user?.email ?? null;

      if (session?.user?.id) {
        // read plan from profiles (id = auth.users.id)
        const { data: row } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .single();

        plan = (row?.plan as string) || "free";

        // ensure profile exists & mirror plan to auth metadata
        await supabase
          .from("profiles")
          .upsert(
            { id: session.user.id, email: session.user.email, plan },
            { onConflict: "id" }
          );
        try {
          await supabase.auth.updateUser({ data: { plan } });
        } catch {
          /* ignore */
        }
      }

      if (!mounted) return;
      setState({ loading: false, session, email, plan });
    })();

    // Auth change subscription
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, ns) => {
      const session = ns ?? null;
      const email = session?.user?.email ?? null;
      let plan = "free";

      if (session?.user?.id) {
        const { data: row } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .single();

        plan = (row?.plan as string) || "free";

        await supabase
          .from("profiles")
          .upsert(
            { id: session.user.id, email: session.user.email, plan },
            { onConflict: "id" }
          );
        try {
          await supabase.auth.updateUser({ data: { plan } });
        } catch {
          /* ignore */
        }
      }

      setState({ loading: false, session, email, plan });

      if (event === "SIGNED_IN" && !welcomedRef.current) {
        welcomedRef.current = true;
        // optional usage event
        try {
          if (session?.user?.id) {
            await supabase
              .from("usage_events")
              .insert({ user_id: session.user.id, event_type: "login", meta: {} });
          }
        } catch {/* ignore */}
        toast.success("Welcome back!");
      }

      if (event === "SIGNED_OUT") {
        welcomedRef.current = false;
        setState({ loading: false, session: null, email: null, plan: "free" });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Exposed API
  const signInWithMagicLink = async (
    email: string,
    options?: { emailRedirectTo?: string }
  ) => {
    return await supabase.auth.signInWithOtp({ email, options });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    isLoggedIn: !!state.session,
    signInWithMagicLink,
    signOut,
  };
}
