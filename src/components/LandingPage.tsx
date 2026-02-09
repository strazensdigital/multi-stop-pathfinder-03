import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Zap, Lock, MapPin, Route, Clock } from "lucide-react";
import roadLogo from "@/assets/road-logo.png";
import GlobalModal from "@/components/modals/GlobalModal";
import PricingModal from "@/components/modals/PricingModal";
import FAQModal from "@/components/modals/FAQModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import TermsModal from "@/components/modals/TermsModal";
import ContactModal from "@/components/modals/ContactModal";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Handle deep linking from URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      switch (hash) {
        case 'pricing':
          setShowPricing(true);
          break;
        case 'faq':
          setShowFAQ(true);
          break;
        case 'privacy':
          setShowPrivacy(true);
          break;
        case 'tos':
          setShowTerms(true);
          break;
        case 'contact':
          setShowContact(true);
          break;
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const closeAllModals = () => {
    setShowHowItWorks(false);
    setShowPricing(false);
    setShowFAQ(false);
    setShowPrivacy(false);
    setShowTerms(false);
    setShowContact(false);
    // Clear hash when closing modals
    if (window.location.hash) {
      window.history.pushState("", document.title, window.location.pathname);
    }
  };

  const openModal = (modalType: string) => {
    closeAllModals();
    switch (modalType) {
      case 'pricing':
        setShowPricing(true);
        break;
      case 'faq':
        setShowFAQ(true);
        break;
      case 'privacy':
        setShowPrivacy(true);
        break;
      case 'terms':
        setShowTerms(true);
        break;
      case 'contact':
        setShowContact(true);
        break;
      case 'how-it-works':
        setShowHowItWorks(true);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={roadLogo} 
              alt="ZipRoute logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold text-foreground">ZipRoute</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => openModal('home')} className="text-foreground hover:text-accent transition-colors">
              Home
            </button>
            <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
              <DialogTrigger asChild>
                <button className="text-foreground hover:text-accent transition-colors">
                  How It Works
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">How ZipRoute Works</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Enter Your Locations</h3>
                      <p className="text-muted-foreground">
                        Add your starting point and up to 9 destinations. You can enter addresses, 
                        business names, or even coordinates.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">AI Optimization</h3>
                      <p className="text-muted-foreground">
                        Our AI powered by Mapbox analyzes traffic patterns, distances, and road conditions 
                        to find the most efficient route order.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Navigate with Ease</h3>
                      <p className="text-muted-foreground">
                        Get your optimized route opened directly in Google Maps for turn-by-turn navigation. 
                        Save time, fuel, and reduce stress.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <button onClick={() => openModal('pricing')} className="text-foreground hover:text-accent transition-colors">
              Pricing
            </button>
            <button onClick={() => openModal('faq')} className="text-foreground hover:text-accent transition-colors">
              FAQ
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Optimize Your Routes in 
            <span className="block text-accent mt-2">Minutes—for Free</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get up to 9 stops optimized at no cost. Perfect for small businesses starting out. 
            Upgrade anytime for just $10/month.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold mr-4"
          >
            Get Started
          </Button>
          <Button 
            onClick={() => openModal('pricing')}
            size="lg" 
            variant="outline"
            className="px-8 py-4 text-lg font-semibold"
          >
            See Pricing
          </Button>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center p-6 border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Free Tier</h3>
              <p className="text-muted-foreground">
                Optimize up to 9 stops for free, no strings attached. Perfect for getting started.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Upgrade</h3>
              <p className="text-muted-foreground">
                Unlock unlimited stops and advanced features for just $10/month when you're ready to scale.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lock Destinations</h3>
              <p className="text-muted-foreground">
                Pro users can lock their final stop for more control over route planning and scheduling.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-accent mb-2">30%</div>
              <p className="text-muted-foreground">Average Time Saved</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">25%</div>
              <p className="text-muted-foreground">Fuel Cost Reduction</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">9</div>
              <p className="text-muted-foreground">Stops in Free Tier</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img 
                src={roadLogo} 
                alt="ZipRoute logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">ZipRoute</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <button onClick={() => openModal('faq')} className="text-muted-foreground hover:text-accent transition-colors">
                FAQ
              </button>
              <button onClick={() => openModal('privacy')} className="text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => openModal('terms')} className="text-muted-foreground hover:text-accent transition-colors">
                Terms of Service
              </button>
              <button onClick={() => openModal('contact')} className="text-muted-foreground hover:text-accent transition-colors">
                Contact
              </button>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="flex justify-center gap-4 mt-6">
            <a href="mailto:support@ziproute.app" className="text-muted-foreground hover:text-accent transition-colors p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-accent transition-colors p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
          </div>
          
          <div className="text-center text-muted-foreground text-sm mt-8">
            © 2025 ZipRoute. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <GlobalModal 
        isOpen={showPricing} 
        onClose={closeAllModals} 
        title="Pricing"
      >
        <PricingModal onClose={closeAllModals} onGetStarted={onGetStarted} />
      </GlobalModal>

      <GlobalModal 
        isOpen={showFAQ} 
        onClose={closeAllModals} 
        title="FAQ"
      >
        <FAQModal onClose={closeAllModals} />
      </GlobalModal>

      <GlobalModal 
        isOpen={showPrivacy} 
        onClose={closeAllModals} 
        title="Privacy Policy"
      >
        <PrivacyModal onClose={closeAllModals} />
      </GlobalModal>

      <GlobalModal 
        isOpen={showTerms} 
        onClose={closeAllModals} 
        title="Terms of Service"
      >
        <TermsModal onClose={closeAllModals} />
      </GlobalModal>

      <GlobalModal 
        isOpen={showContact} 
        onClose={closeAllModals} 
        title="Contact Us"
      >
        <ContactModal onClose={closeAllModals} />
      </GlobalModal>
    </div>
  );
};

export default LandingPage;