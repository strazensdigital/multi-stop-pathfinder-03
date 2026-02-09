import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string | null;
  plan: string | null;
  display_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  refreshProfile: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback((userId: string) => {
    supabase
      .from("profiles")
      .select("id, email, plan, display_name")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, []);

  const refreshProfile = useCallback(() => {
    if (user) fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Check subscription status on login and periodically
  useEffect(() => {
    if (!user) return;

    const checkSub = async () => {
      try {
        const { data } = await supabase.functions.invoke("check-subscription");
        if (data?.plan) {
          // Profile will be updated server-side, just refetch
          fetchProfile(user.id);
        }
      } catch { /* silent */ }
    };

    // Check on login
    const timeout = setTimeout(checkSub, 1000);
    // Check every 60s
    const interval = setInterval(checkSub, 60000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    // Write display_name to profiles if provided
    if (!error && data?.user && displayName?.trim()) {
      await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", data.user.id);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, refreshProfile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
