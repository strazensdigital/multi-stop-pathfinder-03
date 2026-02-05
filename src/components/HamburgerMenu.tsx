import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

export function HamburgerMenu() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsSheetOpen(false);
  };

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
          className="w-80 bg-background/95 backdrop-blur-sm border-border/40"
        >
          <div className="flex flex-col space-y-6 mt-8">
            {/* Account Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Account</h2>
              {user ? (
                <p className="text-sm text-muted-foreground">
                  {user.email} · Plan: Free
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
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-center font-normal border-border/40 hover:bg-muted"
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
                  className="w-full justify-center font-normal border-border/40 hover:bg-muted"
                >
                  Log in / Sign up
                </Button>
              )}
            </div>
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
