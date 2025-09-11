import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Common consumer domains for suggestion
const COMMON_DOMAINS = ["gmail.com","hotmail.com","outlook.com","yahoo.com","icloud.com","proton.me","aol.com","live.com","msn.com","me.com"];

function isEmailSyntaxValid(email: string) {
  // RFC5322-lite; HTML5 will also do basic validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function suggestDomain(inputDomain: string) {
  let best = { dom: "", dist: Infinity };
  for (const d of COMMON_DOMAINS) {
    const dist = levenshtein(inputDomain, d);
    if (dist < best.dist) best = { dom: d, dist };
  }
  return best.dist <= 2 ? best.dom : ""; // only suggest if close
}

export default function LoginModal() {
  const { signInWithMagicLink, isLoggedIn, email: currentEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [mxOk, setMxOk] = useState<boolean | null>(null);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false);

  // open from anywhere
  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("open-login" as any, fn);
    return () => window.removeEventListener("open-login" as any, fn);
  }, []);

  useEffect(() => {
    if (isLoggedIn) setOpen(false);
  }, [isLoggedIn]);

  const [localPart, domain] = useMemo(() => {
    const parts = email.split("@");
    return parts.length === 2 ? [parts[0], parts[1].toLowerCase()] : [email, ""];
  }, [email]);

  const suggestion = useMemo(() => (domain ? suggestDomain(domain) : ""), [domain]);

  // Optional MX check (serverless)
  const checkMx = async () => {
    if (!domain) return;
    try {
      setChecking(true);
      setMxOk(null);
      const resp = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      setMxOk(!!data.ok);
      if (!data.ok) toast.warning(data.reason || "Email domain may not receive mail.");
    } catch (e) {
      console.warn("[LoginModal] MX check failed", e);
      setMxOk(null); // don’t block on network issues
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailSyntaxValid(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (suggestion && !acceptedSuggestion && domain !== suggestion) {
      toast("Did you mean " + `${localPart}@${suggestion}` + " ?");
      return; // force user to accept/correct before sending
    }
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirect = import.meta.env.VITE_AUTH_REDIRECT_URL || `${origin}/auth/callback`;
      const { error } = await signInWithMagicLink(email, { emailRedirectTo: redirect });
      if (error) throw error;
      toast.success("Check your email for the magic link.");
    } catch (err: any) {
      console.error("[LoginModal] magic link error:", err);
      toast.error(err?.message || "Login failed");
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setEmail(`${localPart}@${suggestion}`);
    setAcceptedSuggestion(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLoggedIn ? `You’re signed in as ${currentEmail ?? ""}` : "Log in / Sign up"}</DialogTitle>
        </DialogHeader>

        {!isLoggedIn ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMxOk(null);
                  setAcceptedSuggestion(false);
                }}
                onBlur={() => {
                  if (isEmailSyntaxValid(email)) checkMx(); // optional
                }}
                required
              />
              {suggestion && domain && domain !== suggestion && (
                <div className="text-xs text-muted-foreground">
                  Did you mean{" "}
                  <button type="button" className="underline" onClick={applySuggestion}>
                    {localPart}@{suggestion}
                  </button>
                  ?
                </div>
              )}
              {mxOk === false && (
                <div className="text-xs text-destructive">This domain may not receive emails.</div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={checking || !isEmailSyntaxValid(email)}>
              {checking ? "Checking…" : "Send magic link"}
            </Button>
          </form>
        ) : (
          <div className="text-sm text-muted-foreground">Already logged in.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
