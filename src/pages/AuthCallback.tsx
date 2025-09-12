import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const [status, setStatus] = useState<"working"|"ok"|"error">("working");
  const [msg, setMsg] = useState<string>("Signing you in…");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) Preferred path: exchange any `code`/PKCE param
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (!error && data?.session) {
          setStatus("ok");
          navigate("/app", { replace: true });
          return;
        }

        // 2) Magic link can come as token_hash&type=magiclink
        const token_hash = url.searchParams.get("token_hash");
        const type = (url.searchParams.get("type") || undefined) as
          | "magiclink"
          | "recovery"
          | "signup"
          | "email_change"
          | undefined;

        if (!data?.session && token_hash && type) {
          const { data: vData, error: vErr } = await supabase.auth.verifyOtp({
            type,
            token_hash
          });
          if (vErr) throw vErr;
          if (vData?.session) {
            setStatus("ok");
            navigate("/app", { replace: true });
            return;
          }
        }

        // 3) Older style hash tokens: #access_token=…&refresh_token=…
        if (window.location.hash.includes("access_token")) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const access_token = params.get("access_token") || "";
          const refresh_token = params.get("refresh_token") || "";
          if (access_token && refresh_token) {
            const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (sErr) throw sErr;
            setStatus("ok");
            navigate("/app", { replace: true });
            return;
          }
        }

        // 4) Fallback: maybe the session is already there (mobile deep link opened existing tab)
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          setStatus("ok");
          navigate("/app", { replace: true });
          return;
        }

        throw new Error("No auth parameters found in callback URL.");
      } catch (e: any) {
        setStatus("error");
        setMsg(e?.message || "Login link invalid or expired.");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="p-6 rounded-2xl border max-w-sm text-center">
        <div className="font-semibold mb-2">
          {status === "working" ? "Signing you in…" : status === "ok" ? "Signed in" : "Sign-in error"}
        </div>
        <div className="text-sm text-muted-foreground">{msg}</div>
      </div>
    </div>
  );
}
