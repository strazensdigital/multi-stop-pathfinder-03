import { useState, useEffect } from "react";
import { Menu, X, MapPin, Trash2, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRoutes, SavedRoute } from "@/hooks/useRoutes";
import { useSubscription } from "@/hooks/useSubscription";
import { Separator } from "@/components/ui/separator";

interface HamburgerMenuProps {
  onLoadRoute?: (stops: any[]) => void;
}

export function HamburgerMenu({ onLoadRoute }: HamburgerMenuProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { savedRoutes, loadingRoutes, fetchRoutes, deleteRoute } = useRoutes();
  const { openPortal } = useSubscription();

  useEffect(() => {
    if (isSheetOpen && user) {
      fetchRoutes();
    }
  }, [isSheetOpen, user, fetchRoutes]);

  const handleSignOut = async () => {
    await signOut();
    setIsSheetOpen(false);
  };

  const handleLoadRoute = (route: SavedRoute) => {
    if (onLoadRoute && route.stops?.length) {
      onLoadRoute(route.stops);
      setIsSheetOpen(false);
    }
  };

  const planLabel = profile?.plan === "pro" ? "Pro" : "Free";

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm border-border/40 hover:bg-muted"
          >
            {isSheetOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-80 bg-background/95 backdrop-blur-sm border-border/40 overflow-y-auto"
        >
          <div className="flex flex-col space-y-6 mt-8">
            {/* Account Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Account</h2>
              {user ? (
                <p className="text-sm text-muted-foreground">
                  {user.email} · Plan: {planLabel}
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Guest · Plan: Free</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You're browsing as a guest. Log in to save routes and upgrade to Pro.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-3">
              {user ? (
                <>
                  {profile?.plan === "pro" && (
                    <Button
                      variant="outline"
                      onClick={() => openPortal()}
                      className="w-full justify-center font-normal border-border/40 hover:bg-muted"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full justify-center font-normal border-border/40 hover:bg-muted"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAuthDialogOpen(true);
                    setIsSheetOpen(false);
                  }}
                  className="w-full justify-center font-normal border-border/40 hover:bg-muted"
                >
                  Log in / Sign up
                </Button>
              )}
            </div>

            {/* My Routes Section */}
            {user && (
              <>
                <Separator className="bg-border/40" />
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">My Routes</h3>
                  {loadingRoutes ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : savedRoutes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No saved routes yet. Optimize a route and tap "Save Route" to keep it.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {savedRoutes.map((route) => (
                        <li
                          key={route.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border/40 p-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <button
                            className="flex items-start gap-2 flex-1 text-left min-w-0"
                            onClick={() => handleLoadRoute(route)}
                          >
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">
                                {route.name || "Untitled Route"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {route.stops?.length || 0} stops ·{" "}
                                {new Date(route.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteRoute(route.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
      />
    </>
  );
}
