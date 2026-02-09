import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Stripe price IDs
export const STRIPE_PRICES = {
  pro_monthly: "price_1Sysra3EdvVx6r8ZNbS6mX0t",
  pro_yearly: "price_1Sysro3EdvVx6r8ZHYjmazba",
} as const;

export function useSubscription() {
  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as { subscribed: boolean; plan: string; subscription_end?: string };
    } catch (e) {
      console.error("Failed to check subscription:", e);
      return null;
    }
  }, []);

  const startCheckout = useCallback(async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
      toast.error(e?.message || "Failed to start checkout");
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      console.error("Portal error:", e);
      toast.error(e?.message || "Failed to open subscription management");
    }
  }, []);

  return { checkSubscription, startCheckout, openPortal };
}
