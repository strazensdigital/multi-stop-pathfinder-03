import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSheet() {
  const { email, plan, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'plan'|'billing'>('plan');

  useEffect(() => {
    const onOpen = (e: any) => { setView(e.detail?.view ?? 'plan'); setOpen(true); };
    window.addEventListener('open-account-drawer' as any, onOpen);
    return () => window.removeEventListener('open-account-drawer' as any, onOpen);
  }, []);

  const upgrade = async () => {
    const resp = await fetch('/api/checkout', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email })});
    const { url } = await resp.json();
    window.location.href = url;
  };
  const manageBilling = async () => {
    const resp = await fetch('/api/portal', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email })});
    const { url } = await resp.json();
    window.location.href = url;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[380px]">
        <SheetHeader>
          <SheetTitle>Account</SheetTitle>
          <SheetDescription>{email ?? "Guest"} · Plan: {plan}</SheetDescription>
        </SheetHeader>

        {plan === 'free' ? (
          <div className="space-y-3 mt-4">
            <button onClick={upgrade} className="w-full bg-black text-white rounded p-2">Upgrade to Pro</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-login'))} className="w-full border rounded p-2">Log in / Sign up</button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <button onClick={manageBilling} className="w-full border rounded p-2">Manage billing / Unsubscribe</button>
          </div>
        )}

        <div className="mt-6">
          <button onClick={() => signOut()} className="text-sm text-muted-foreground underline">Sign out</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
