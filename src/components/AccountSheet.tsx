import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react"; // Ensure you have this icon or remove the icon component below if not

export default function AccountSheet() {
  const { isLoggedIn, email, plan, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"plan" | "billing">("plan");

  useEffect(() => {
    const onOpen = (e: any) => {
      setView(e.detail?.view ?? "plan");
      setOpen(true);
    };
    window.addEventListener("open-account-drawer" as any, onOpen);
    return () => window.removeEventListener("open-account-drawer" as any, onOpen);
  }, []);

  // Defined here so 'upgrade' and 'manageBilling' can use it
  const openLogin = () =>
    window.dispatchEvent(new CustomEvent("open-login"));

  const upgrade = async () => {
    if (!isLoggedIn) {
      openLogin();
      return;
    }

    // Open window immediately to prevent popup blocker
    const newWindow = window.open('', '_blank');
    if (newWindow) newWindow.document.write('Loading checkout...');

    try {
      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { url } = await resp.json();
      
      if (url && newWindow) {
        newWindow.location.href = url;
      } else if (newWindow) {
        newWindow.close();
      }
    } catch (err) {
      console.error("[AccountSheet] upgrade failed:", err);
      newWindow?.close();
    }
  };

  const manageBilling = async () => {
    if (!isLoggedIn) {
      openLogin();
      return;
    }

    const newWindow = window.open('', '_blank');
    if (newWindow) newWindow.document.write('Loading portal...');

    try {
      const resp = await fetch("/api/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { url } = await resp.json();
      
      if (url && newWindow) {
        newWindow.location.href = url;
      } else if (newWindow) {
        newWindow.close();
      }
    } catch (err) {
      console.error("[AccountSheet] manageBilling failed:", err);
      newWindow?.close();
    }
  };

  const planLabel =
    plan === "pro" ? "Pro" : plan === "team" ? "Team" : "Free";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[380px]">
        <SheetHeader>
          <SheetTitle>Account</SheetTitle>
          <SheetDescription>
            {isLoggedIn ? (email ?? "Unknown") : "Guest"} · Plan: {planLabel}
          </SheetDescription>
        </SheetHeader>

        {/* Guest view */}
        {!isLoggedIn && (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              You’re browsing as a guest. Log in to save routes and upgrade to
              Pro.
            </p>
            <button
              onClick={openLogin}
              className="w-full border rounded p-2"
            >
              Log in / Sign up
            </button>
          </div>
        )}

        {/* Logged-in: Free */}
        {isLoggedIn && plan === "free" && (
          <div className="space-y-3 mt-4">
            <div className="text-sm text-muted-foreground">
              {email ?? ""}
            </div>
            <button
              onClick={upgrade}
              className="w-full bg-black text-white rounded p-2"
            >
              Upgrade to Pro
            </button>
              <button
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 z-50 pointer-events-auto border rounded p-2 flex items-center"
              onClick={async () => { 
                await signOut(); 
                setOpen(false); 
                window.location.href = '/'; 
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Logged-in: Pro/Team */}
        {isLoggedIn && (plan === "pro" || plan === "team") && (
          <div className="space-y-3 mt-4">
            <div className="text-sm text-muted-foreground">
              {email ?? ""}
            </div>
            <button
              onClick={manageBilling}
              className="w-full border rounded p-2"
            >
              Manage billing / Unsubscribe
            </button>
            <button
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 z-50 pointer-events-auto border rounded p-2 flex items-center"
              onClick={() => signOut()}
            >
               <LogOut className="mr-2 h-4 w-4" />
               Sign out
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
