import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Persist session in browser; auto refresh tokens
export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true }
});
