import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function LoginModal() {
  const { signInWithMagicLink, isLoggedIn, email: currentEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  // open from anywhere
  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("open-login" as any, fn);
    return () => window.removeEventListener("open-login" as any, fn);
  }, []);

  // closed if already logged in
  useEffect(() => {
    if (isLoggedIn) setOpen(false);
  }, [isLoggedIn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirect =
        import.meta.env.VITE_AUTH_REDIRECT_URL || `${origin}/auth/callback`; // set this env in Vercel
      const { error } = await signInWithMagicLink(email, { emailRedirectTo: redirect });
      if (error) throw error;
      toast.success("Check your email for the magic link.");
    } catch (err: any) {
      console.error("[LoginModal] magic link error:", err);
      toast.error(err?.message || "Login failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLoggedIn ? `You’re signed in as ${currentEmail ?? ""}` : "Log in / Sign up"}</DialogTitle>
        </DialogHeader>
        {!isLoggedIn ? (
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">Send magic link</Button>
          </form>
        ) : (
          <div className="text-sm text-muted-foreground">Already logged in.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
