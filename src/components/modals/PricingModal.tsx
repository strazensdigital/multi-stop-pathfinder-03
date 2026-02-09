import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, STRIPE_PRICES } from "@/hooks/useSubscription";

interface PricingModalProps {
  onClose: () => void;
  onGetStarted: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onGetStarted }) => {
  const { user, profile } = useAuth();
  const { startCheckout, openPortal } = useSubscription();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const isPro = profile?.plan === "pro";

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      onGetStarted(); // opens auth dialog
      return;
    }
    setCheckingOut(priceId);
    await startCheckout(priceId);
    setCheckingOut(null);
  };

  return (
    <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Simple pricing for growing teams</h2>
        <p className="text-muted-foreground">Start free. Upgrade when you're ready.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card className="relative p-6">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold">Free</h3>
              <Badge variant="secondary" className="text-xs">No credit card</Badge>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground"> / forever</span>
            </div>
            <ul className="space-y-3 mb-6">
              {["Up to 9 stops per route", "Fast route optimization (Mapbox)", "Export directions to your maps app", "Email verification required after 1–2 uses"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Button onClick={onGetStarted} className="w-full" variant="outline">
              {user ? (isPro ? "Current fallback" : "Your Plan") : "Start Free"}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative p-6 border-2 ${isPro ? "border-primary" : "border-accent"}`}>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-bold">Pro</h3>
              {isPro ? (
                <Badge className="bg-primary text-primary-foreground text-xs">Your Plan</Badge>
              ) : (
                <Badge className="bg-accent text-accent-foreground text-xs">Popular</Badge>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">$10</span>
              <span className="text-muted-foreground"> / month</span>
              <div className="text-sm text-muted-foreground">or $69 / year (save ~40%)</div>
            </div>
            <ul className="space-y-3 mb-6">
              {["Unlimited stops", "Lock a specific stop (e.g., fixed final destination)", "Priority email support", "Early access to AI address import (beta)"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button className="w-full" variant="outline" onClick={() => openPortal()}>
                Manage Subscription
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleCheckout(STRIPE_PRICES.pro_monthly)}
                  disabled={!!checkingOut}
                >
                  {checkingOut === STRIPE_PRICES.pro_monthly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  $10 / month
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleCheckout(STRIPE_PRICES.pro_yearly)}
                  disabled={!!checkingOut}
                >
                  {checkingOut === STRIPE_PRICES.pro_yearly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  $69 / year (save 40%)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ultimate Plan */}
        <Card className="relative p-6 opacity-75">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-xl font-bold text-muted-foreground">Ultimate</h3>
              <Badge variant="secondary" className="text-xs">Coming soon</Badge>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-muted-foreground">Custom</span>
            </div>
            <ul className="space-y-3 mb-6">
              {["Team seats & shared routes", "Bulk CSV import", "API & webhooks", "White-label options"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Join Waitlist
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-center text-muted-foreground border-t pt-4">
        <p>Prices in USD. Taxes may apply. Subscriptions renew automatically; you can cancel anytime in your account.</p>
      </div>
    </div>
  );
};

export default PricingModal;
