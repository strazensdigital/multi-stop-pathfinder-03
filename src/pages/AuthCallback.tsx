import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) throw error;
          toast.success("Welcome back!");
          if (error) throw error;
        }
      } catch (e: any) {
        console.error("[AuthCallback] exchange failed", e);
        toast.error(e?.message || "Could not complete sign-in");
      } finally {
        navigate("/", { replace: true });
      }
    })();
  }, [navigate]);

  return <div className="p-4 text-sm text-muted-foreground">Signing you in…</div>;
}
