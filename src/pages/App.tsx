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
      <header className="fixed top-0 right-0 z-50 p-4">
        <HamburgerMenu onLoadRoute={handleLoadRoute} />
      </header>
      <main className="flex-1 px-4 pt-4 pb-16 max-w-[1400px] mx-auto w-full">
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
