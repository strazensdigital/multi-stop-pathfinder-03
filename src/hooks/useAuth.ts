import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // <-- update if your path differs

export type Plan = "free" | "pro" | "team";

type AuthState = {
  loading: boolean;
  session: any | null;
  email: string | null;
  plan: Plan;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    email: null,
    plan: "free",
  });

  // Optional: local fallback if you stored plan client-side during tests
  const localPlan = useMemo<Plan>(() => {
    const p = localStorage.getItem("plan");
    return (p === "pro" || p === "team") ? p : "free";
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    async function bootstrap() {
      // 1) Get current session
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      const email = session?.user?.email ?? null;

      // 2) Fetch plan for logged-in users (profiles table or user metadata)
      let plan: Plan = localPlan;
      if (session?.user) {
        // Try user metadata first
        const metaPlan = session.user.user_metadata?.plan as Plan | undefined;
        if (metaPlan) plan = metaPlan;
        else {
          // Or read from profiles table if you store it there
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", session.user.id)
            .single();
          if (profile?.plan === "pro" || profile?.plan === "team") {
            plan = profile.plan;
          }
        }
      }

      setState({ loading: false, session, email, plan });

      // 3) Subscribe to auth changes
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        const ns = newSession ?? null;
        const nEmail = ns?.user?.email ?? null;

        // Re-evaluate plan on change
        let nPlan: Plan = "free";
        const metaPlan = ns?.user?.user_metadata?.plan as Plan | undefined;
        if (metaPlan) {
          nPlan = metaPlan;
        } else if (ns?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", ns.user.id)
            .single();
          if (profile?.plan === "pro" || profile?.plan === "team") nPlan = profile.plan;
        }

        setState({ loading: false, session: ns, email: nEmail, plan: nPlan });
      });

      unsub = () => sub?.subscription.unsubscribe();
    }

    bootstrap();
    return () => { unsub?.(); };
  }, [localPlan]);

  const signInWithMagicLink = async (email: string) => {
    await supabase.auth.signInWithOtp({ email });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setState(s => ({ ...s, session: null, email: null, plan: "free" }));
  };

  return {
    ...state,
    isLoggedIn: !!state.session,
    signInWithMagicLink,
    signOut,
  };
}
