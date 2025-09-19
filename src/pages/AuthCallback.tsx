import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ====== 1) HASH TOKENS (your exact URL) ======
        if (window.location.hash.includes("access_token")) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const access_token = params.get("access_token") || "";
          const refresh_token = params.get("refresh_token") || "";
          if (access_token && refresh_token) {
            console.info("[AuthCallback] setSession from hash…");
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              console.error("[AuthCallback] setSession error:", error);
              setMsg(error.message || "Login failed.");
            } else {
              // Hard redirect to ensure all state/UI resets
              if (!cancelled) window.location.replace("/app");
              return;
            }
          }
        }

        // ====== 2) PKCE/CODE ======
        console.info("[AuthCallback] trying exchangeCodeForSession…");
        const ex = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (ex?.data?.session) {
          if (!cancelled) window.location.replace("/app");
          return;
        }

        // ====== 3) MAGICLINK/RECOVERY TOKEN_HASH ======
        const url = new URL(window.location.href);
        const token_hash = url.searchParams.get("token_hash");
        const type = (url.searchParams.get("type") || undefined) as
          | "magiclink" | "recovery" | "signup" | "email_change" | undefined;

        if (token_hash && type) {
          console.info("[AuthCallback] verifyOtp…");
          const v = await supabase.auth.verifyOtp({ type, token_hash });
          if (v?.data?.session) {
            if (!cancelled) window.location.replace("/app");
            return;
          } else if (v?.error) {
            console.error("[AuthCallback] verifyOtp error:", v.error);
            setMsg(v.error.message || "Login failed.");
            return;
          }
        }

        // ====== 4) Already signed-in? ======
        const s = await supabase.auth.getSession();
        if (s.data.session) {
          if (!cancelled) window.location.replace("/app");
          return;
        }

        setMsg("Login link invalid or expired. Try again.");
      } catch (e: any) {
        console.error("[AuthCallback] exception:", e);
        setMsg(e?.message || "Login failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="p-6 rounded-2xl border max-w-sm text-center">
        <div className="font-semibold mb-2">Auth</div>
        <div className="text-sm text-muted-foreground">{msg}</div>
      </div>
    </div>
  );
}
