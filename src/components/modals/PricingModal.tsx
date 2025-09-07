import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";

interface PricingModalProps {
  onClose: () => void;
  onGetStarted: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onGetStarted }) => {
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
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Up to 9 stops per route</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Fast route optimization (Mapbox)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Export directions to your maps app</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Email verification required after 1–2 uses</span>
              </li>
            </ul>
            <Button onClick={onGetStarted} className="w-full" variant="outline">
              Start Free
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative p-6 border-2 border-accent">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-bold">Pro</h3>
              <Badge className="bg-accent text-accent-foreground text-xs">Popular</Badge>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">$10</span>
              <span className="text-muted-foreground"> / month</span>
              <div className="text-sm text-muted-foreground">or $69 / year (save ~40%)</div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Unlimited stops</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Lock a specific stop (e.g., fixed final destination)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Priority email support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-sm">Early access to AI address import (beta)</span>
              </li>
            </ul>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Upgrade to Pro
            </Button>
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
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Team seats & shared routes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Bulk CSV import</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">API & webhooks</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">White-label options</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Join Waitlist
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-center text-muted-foreground border-t pt-4">
        <p>Prices in USD. Taxes may apply. Subscriptions renew automatically; you can cancel anytime in your account.</p>
        <div className="flex justify-center gap-4 mt-2">
          <button className="underline hover:text-accent transition-colors">Terms of Service</button>
          <button className="underline hover:text-accent transition-colors">Refunds</button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;