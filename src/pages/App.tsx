import { useState, useEffect } from "react";
import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import GlobalModal from "@/components/modals/GlobalModal";
import PricingModal from "@/components/modals/PricingModal";
import { AuthDialog } from "@/components/AuthDialog";
import { CookieConsent } from "@/components/CookieConsent";

const AppPage = () => {
  const [routeToLoad, setRouteToLoad] = useState<any[] | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleLoadRoute = (stops: any[]) => {
    setRouteToLoad(stops);
  };

  const handleRouteLoaded = () => {
    setRouteToLoad(null);
  };

  // Listen for open-modal events from child components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'pricing') setShowPricing(true);
    };
    window.addEventListener('open-modal', handler);
    return () => window.removeEventListener('open-modal', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center gap-2">
          <img src="/zippy-logo.png" alt="ZippyRouter logo" style={{ width: 60, height: 60 }} className="object-contain" />
          <span className="text-lg font-bold text-foreground">ZippyRouter</span>
        </div>
        <HamburgerMenu onLoadRoute={handleLoadRoute} />
      </header>
      <main className="flex-1 px-4 pt-16 pb-16 max-w-[1400px] mx-auto w-full">
        <MapboxRoutePlanner routeToLoad={routeToLoad} onRouteLoaded={handleRouteLoaded} />
      </main>

      <GlobalModal isOpen={showPricing} onClose={() => setShowPricing(false)} title="Pricing">
        <PricingModal
          onClose={() => setShowPricing(false)}
          onGetStarted={() => {
            setShowPricing(false);
            setShowAuth(true);
          }}
        />
      </GlobalModal>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      <CookieConsent />
    </div>
  );
};

export default AppPage;
