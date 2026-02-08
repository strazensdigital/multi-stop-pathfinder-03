import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
});

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
    setRegistrationSuccess(false);
  };

  const validateInputs = (): boolean => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return false;
    }
    return true;
  };

  const friendlyError = (msg: string): string => {
    if (msg.includes("email_address_invalid") || msg.includes("invalid_email")) {
      return "That email address doesn't appear to be valid. Please use a real email.";
    }
    if (msg.includes("Invalid login credentials")) {
      return "Invalid username or password. Please try again.";
    }
    if (msg.includes("User already registered")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (msg.includes("Email rate limit exceeded")) {
      return "Too many attempts. Please wait a few minutes and try again.";
    }
    return msg;
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(friendlyError(signInError.message || "Sign in failed"));
      } else {
        onOpenChange(false);
        resetForm();
      }
    } catch (err: any) {
      setError(friendlyError(err?.message || "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError("");

    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(friendlyError(signUpError.message || "Registration failed"));
      } else {
        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      setError(friendlyError(err?.message || "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !loading) action();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border-border/40">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Welcome to ZipRoute
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign in with your username and password to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="signin" onClick={resetForm}>Sign In</TabsTrigger>
            <TabsTrigger value="signup" onClick={resetForm}>Register</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Username</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="Enter your username (email)"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => handleKeyDown(e, handleSignIn)}
                className="border-border/40"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => handleKeyDown(e, handleSignIn)}
                  className="border-border/40 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}

            <Button 
              onClick={handleSignIn} 
              disabled={loading}
              className="w-full btn-hero"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            {registrationSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <p className="text-center font-medium text-foreground">Account created!</p>
                <p className="text-center text-sm text-muted-foreground">
                  Check your email to confirm your account, then come back and sign in.
                </p>
                <Button
                  variant="outline"
                  onClick={() => { resetForm(); }}
                  className="mt-2"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Username</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your username (email)"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => handleKeyDown(e, handleSignUp)}
                    className="border-border/40"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={(e) => handleKeyDown(e, handleSignUp)}
                      className="border-border/40 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleSignUp} 
                  disabled={loading}
                  className="w-full btn-hero"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
