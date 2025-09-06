import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Plan = 'free'|'pro'|'team';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(await supabase.auth.getSession().then(r => r.data.session ?? null));
  const [plan, setPlan] = useState<Plan>('free');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      await refreshProfile();
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_ev, s) => {
      setSession(s);
      setEmail(s?.user?.email ?? null);
      await refreshProfile();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function refreshProfile() {
    const { data } = await supabase.from('profiles').select('plan').maybeSingle();
    setPlan((data?.plan as Plan) ?? 'free');
  }

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPlan('free');
  }

  return { loading, session, email, plan, signIn, signOut, refreshProfile };
}
