import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Signing you in…");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setMsg("Login link invalid or expired. Try again.");
    }, 6000);

    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) Try PKCE/code exchange
        const ex = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (ex?.data?.session) {
          clearTimeout(timeout);
          if (!cancelled) navigate("/app", { replace: true });
          return;
        }

        // 2) Try magiclink/recovery/signup email flow
        const token_hash = url.searchParams.get("token_hash");
        const type = (url.searchParams.get("type") || undefined) as
          | "magiclink" | "recovery" | "signup" | "email_change" | undefined;

        if (token_hash && type) {
          const v = await supabase.auth.verifyOtp({ type, token_hash });
          if (v?.data?.session) {
            clearTimeout(timeout);
            if (!cancelled) navigate("/app", { replace: true });
            return;
          }
        }

        // 3) Legacy hash tokens
        if (window.location.hash.includes("access_token")) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const access_token = params.get("access_token") || "";
          const refresh_token = params.get("refresh_token") || "";
          if (access_token && refresh_token) {
            const s = await supabase.auth.setSession({ access_token, refresh_token });
            if (!s.error) {
              clearTimeout(timeout);
              if (!cancelled) navigate("/app", { replace: true });
              return;
            }
          }
        }

        // 4) Already signed in? (mobile sometimes reuses a warm tab)
        const s = await supabase.auth.getSession();
        if (s.data.session) {
          clearTimeout(timeout);
          if (!cancelled) navigate("/app", { replace: true });
          return;
        }

        // Fallthrough
        setMsg("Login link invalid or expired. Try again.");
      } catch (e: any) {
        setMsg(e?.message || "Login failed.");
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="p-6 rounded-2xl border max-w-sm text-center">
        <div className="font-semibold mb-2">Auth</div>
        <div className="text-sm text-muted-foreground">{msg}</div>
      </div>
    </div>
  );
}
