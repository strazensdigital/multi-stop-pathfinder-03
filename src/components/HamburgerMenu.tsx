import { useState, useEffect } from "react";
import { Menu, X, MapPin, Trash2, Loader2, CreditCard, Crown, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRoutes, SavedRoute } from "@/hooks/useRoutes";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useSubscription } from "@/hooks/useSubscription";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { UsageDashboard } from "@/components/UsageDashboard";

interface HamburgerMenuProps {
  onLoadRoute?: (stops: any[]) => void;
}

export function HamburgerMenu({ onLoadRoute }: HamburgerMenuProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [addingBookmark, setAddingBookmark] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const { user, profile, signOut } = useAuth();
  const { savedRoutes, loadingRoutes, fetchRoutes, deleteRoute } = useRoutes();
  const { bookmarks, loadingBookmarks, fetchBookmarks, addBookmark, deleteBookmark } = useBookmarks();
  const { openPortal } = useSubscription();

  useEffect(() => {
    if (isSheetOpen && user) {
      fetchRoutes();
      fetchBookmarks();
    }
  }, [isSheetOpen, user, fetchRoutes, fetchBookmarks]);

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

  const isPro = profile?.plan === "pro";
  const planLabel = isPro ? "Pro" : "Free";
  const greeting = profile?.display_name || user?.email?.split("@")[0] || null;

  const handleUpgradeClick = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      setIsSheetOpen(false);
    } else {
      window.dispatchEvent(new CustomEvent('open-modal', { detail: 'pricing' }));
      setIsSheetOpen(false);
    }
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm border-border/40 hover:bg-muted min-h-[44px] min-w-[44px]"
          >
            {isSheetOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-[85vw] max-w-80 bg-background/95 backdrop-blur-sm border-border/40 flex flex-col p-0"
        >
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 pt-10 space-y-6">
            {/* Account Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Account</h2>
              {user ? (
                <div className="space-y-1">
                  {greeting && (
                    <p className="text-base font-semibold text-foreground">
                      Hi, {greeting}! 👋
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {user.email} · Plan: {planLabel}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Guest · Plan: Free</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You're browsing as a guest. Log in to save routes and upgrade to Pro.
                  </p>
                </>
              )}
            </div>

            {/* Usage Dashboard */}
            {user && <UsageDashboard />}

            {/* Manage Subscription — Pro only */}
            {user && isPro && (
              <Button
                variant="outline"
                onClick={() => openPortal()}
                className="w-full justify-center font-normal border-border/40 hover:bg-muted min-h-[44px]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            )}

            {/* Bookmarks Section — Pro only */}
            {user && (
              <>
                <Separator className="bg-border/40" />
                <div className={`space-y-3 ${!isPro ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-yellow-500" /> Bookmarks
                      {!isPro && <span className="ml-1.5 text-xs font-semibold bg-accent/20 text-accent px-1.5 py-0.5 rounded">PRO</span>}
                    </h3>
                    {isPro && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setAddingBookmark(!addingBookmark)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>

                  {!isPro ? (
                    <p className="text-sm text-muted-foreground">
                      Save frequently-used addresses for quick access. Upgrade to Pro to unlock bookmarks.
                    </p>
                  ) : (
                    <>
                      {addingBookmark && (
                        <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/30">
                          <Input
                            placeholder="Nickname (e.g. Office)"
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            className="min-h-[44px]"
                          />
                          <Input
                            placeholder="Full address"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className="min-h-[44px]"
                          />
                          <Button
                            className="w-full min-h-[44px] btn-hero"
                            disabled={!newNickname.trim() || !newAddress.trim()}
                            onClick={async () => {
                              const ok = await addBookmark(newNickname, newAddress);
                              if (ok) {
                                setNewNickname("");
                                setNewAddress("");
                                setAddingBookmark(false);
                              }
                            }}
                          >
                            Save Bookmark
                          </Button>
                        </div>
                      )}

                      {loadingBookmarks ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : bookmarks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No bookmarks yet. Save frequently-used addresses for quick access.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {bookmarks.map((bm) => (
                            <li
                              key={bm.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-border/40 p-2.5 hover:bg-muted/50 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate text-foreground flex items-center gap-1.5">
                                  <Star className="h-3 w-3 text-yellow-500 shrink-0" />
                                  {bm.nickname}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{bm.address}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteBookmark(bm.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

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
                            className="flex items-start gap-2 flex-1 text-left min-w-0 min-h-[44px]"
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
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
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

          {/* Sticky bottom buttons */}
          <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm p-4 space-y-2">
            {!isPro && (
              <Button
                onClick={handleUpgradeClick}
                className="w-full min-h-[44px] text-sm font-bold rounded-xl shadow-md"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))',
                  color: 'hsl(var(--accent-foreground))',
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro — $10/mo
              </Button>
            )}
            {user ? (
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-center font-normal border-border/40 hover:bg-muted min-h-[44px]"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setIsAuthDialogOpen(true);
                  setIsSheetOpen(false);
                }}
                className="w-full justify-center font-normal border-border/40 hover:bg-muted min-h-[44px]"
              >
                Log in / Sign up
              </Button>
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
