import { useState, useEffect } from "react";
import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import GlobalModal from "@/components/modals/GlobalModal";
import PricingModal from "@/components/modals/PricingModal";
import FAQModal from "@/components/modals/FAQModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import TermsModal from "@/components/modals/TermsModal";
import ContactModal from "@/components/modals/ContactModal";
import { AuthDialog } from "@/components/AuthDialog";
import { CookieConsent } from "@/components/CookieConsent";

const AppPage = () => {
  const [routeToLoad, setRouteToLoad] = useState<any[] | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const closeAllModals = () => {
    setShowPricing(false);
    setShowFAQ(false);
    setShowPrivacy(false);
    setShowTerms(false);
    setShowContact(false);
  };

  const openModal = (modal: string) => {
    closeAllModals();
    switch (modal) {
      case 'faq': setShowFAQ(true); break;
      case 'privacy': setShowPrivacy(true); break;
      case 'terms': setShowTerms(true); break;
      case 'contact': setShowContact(true); break;
      case 'pricing': setShowPricing(true); break;
    }
  };

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

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/zippy-logo.png" alt="ZippyRouter logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-foreground">ZippyRouter</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <button onClick={() => openModal('faq')} className="text-muted-foreground hover:text-accent transition-colors">FAQ</button>
              <button onClick={() => openModal('privacy')} className="text-muted-foreground hover:text-accent transition-colors">Privacy Policy</button>
              <button onClick={() => openModal('terms')} className="text-muted-foreground hover:text-accent transition-colors">Terms of Service</button>
              <button onClick={() => openModal('contact')} className="text-muted-foreground hover:text-accent transition-colors">Contact</button>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <a href="mailto:support@zippyrouter.com" className="text-muted-foreground hover:text-accent transition-colors p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </a>
          </div>
          <div className="text-center text-muted-foreground text-sm mt-8">
            © 2026 ZippyRouter. All rights reserved.
          </div>
        </div>
      </footer>

      <GlobalModal isOpen={showPricing} onClose={closeAllModals} title="Pricing">
        <PricingModal
          onClose={closeAllModals}
          onGetStarted={() => {
            closeAllModals();
            setShowAuth(true);
          }}
        />
      </GlobalModal>
      <GlobalModal isOpen={showFAQ} onClose={closeAllModals} title="FAQ">
        <FAQModal onClose={closeAllModals} />
      </GlobalModal>
      <GlobalModal isOpen={showPrivacy} onClose={closeAllModals} title="Privacy Policy">
        <PrivacyModal onClose={closeAllModals} />
      </GlobalModal>
      <GlobalModal isOpen={showTerms} onClose={closeAllModals} title="Terms of Service">
        <TermsModal onClose={closeAllModals} />
      </GlobalModal>
      <GlobalModal isOpen={showContact} onClose={closeAllModals} title="Contact Us">
        <ContactModal onClose={closeAllModals} />
      </GlobalModal>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      <CookieConsent />
    </div>
  );
};

export default AppPage;
