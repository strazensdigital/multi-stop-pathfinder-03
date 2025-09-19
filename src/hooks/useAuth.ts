import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthState = {
  loading: boolean;
  session: Session | null;
  email: string | null;
  plan: "free" | "pro";
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    email: null,
    plan: "free",
  });
  const welcomedRef = useRef(false);

  const refreshPlan = async (userId?: string, email?: string | null) => {
    if (!userId) return;
    try {
      const { data: row } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();
      const plan = (row?.plan as "free" | "pro") || "free";
      // Ensure row exists & mirror metadata (ignore if RLS blocks)
      await supabase.from("profiles").upsert(
        { id: userId, email: email ?? undefined, plan },
        { onConflict: "id" }
      );
      try { await supabase.auth.updateUser({ data: { plan } }); } catch {}
      setState(prev => ({ ...prev, plan }));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      // Optimistic set for UI
      setState({
        loading: false,
        session,
        email: session?.user?.email ?? null,
        plan: "free",
      });
      // Background plan fetch
      await refreshPlan(session?.user?.id, session?.user?.email ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      // Update UI first
      setState(prev => ({
        ...prev,
        loading: false,
        session: s ?? null,
        email: s?.user?.email ?? null,
      }));
      // Fetch plan in background
      if (s?.user?.id) {
        refreshPlan(s.user.id, s.user.email ?? null);
      } else {
        setState(prev => ({ ...prev, plan: "free" }));
      }

      if (event === "SIGNED_IN" && !welcomedRef.current) {
        welcomedRef.current = true;
        try {
          if (s?.user?.id) {
            await supabase.from("usage_events").insert({
              user_id: s.user.id,
              event_type: "login",
              meta: {},
            });
          }
        } catch {}
        toast.success("Welcome back!");
      }

      if (event === "SIGNED_OUT") {
        welcomedRef.current = false;
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

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
