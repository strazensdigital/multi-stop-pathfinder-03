// src/components/AccountSheet.tsx
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSheet() {
  const { isLoggedIn, email, plan, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  // keeping view in case you open the drawer at a specific tab later
  const [view, setView] = useState<"plan" | "billing">("plan");

  useEffect(() => {
    const onOpen = (e: any) => {
      setView(e.detail?.view ?? "plan");
      setOpen(true);
    };
    window.addEventListener("open-account-drawer" as any, onOpen);
    return () => window.removeEventListener("open-account-drawer" as any, onOpen);
  }, []);

  const openLogin = () =>
    window.dispatchEvent(new CustomEvent("open-login"));

  const upgrade = async () => {
    if (!isLoggedIn) {
      openLogin();
      return;
    }
    try {
      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { url } = await resp.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("[AccountSheet] upgrade failed:", err);
    }
  };

  const manageBilling = async () => {
    if (!isLoggedIn) {
      openLogin();
      return;
    }
    try {
      const resp = await fetch("/api/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { url } = await resp.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("[AccountSheet] manageBilling failed:", err);
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
              <Button 
  variant="ghost" 
  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 z-50 pointer-events-auto" // Added z-50 and pointer-events-auto
  onClick={() => {
    signOut(); // Ensure this calls your useAuth signOut
    setOpen(false); // Close the sheet manually to prevent UI freezing
  }}
>
  <LogOut className="mr-2 h-4 w-4" />
  Sign Out
</Button>
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
            <Button 
  variant="ghost" 
  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 z-50 pointer-events-auto" // Added z-50 and pointer-events-auto
  onClick={() => {
    signOut(); // Ensure this calls your useAuth signOut
    setOpen(false); // Close the sheet manually to prevent UI freezing
  }}
>
  <LogOut className="mr-2 h-4 w-4" />
  Sign Out
</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
