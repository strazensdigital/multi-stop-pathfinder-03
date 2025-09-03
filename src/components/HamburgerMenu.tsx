import { useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
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
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                {user ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">Signed in</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Guest</p>
                    <p className="text-xs text-muted-foreground">Not signed in</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-start text-left font-normal border-border/40 hover:bg-muted"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAuthDialogOpen(true);
                    setIsSheetOpen(false);
                  }}
                  className="w-full justify-start text-left font-normal border-border/40 hover:bg-muted"
                >
                  <User className="mr-3 h-4 w-4" />
                  Sign In / Register
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