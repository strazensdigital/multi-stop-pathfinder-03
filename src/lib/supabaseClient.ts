import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  throw new Error(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Set them in Vercel → Project Settings → Environment Variables."
  );
}

// Fallback values are only to prevent hard crashes if envs are missing in previews.
// Replace ASAP with real envs in Vercel.
  export const supabase = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
