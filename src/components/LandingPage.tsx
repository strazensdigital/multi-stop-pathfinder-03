import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Zap, MapPin, Route, Clock, Upload, MousePointerClick, ExternalLink } from "lucide-react";
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

    handleHashChange();
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
               alt="ZippyRouter logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold text-foreground">ZippyRouter</span>
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
                  <DialogTitle className="text-2xl font-bold">How ZippyRouter Works</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Enter Your Locations</h3>
                      <p className="text-muted-foreground">Add your starting point and destinations. You can enter addresses, business names, or even coordinates.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">AI Optimization</h3>
                      <p className="text-muted-foreground">Our optimizer analyzes traffic patterns, distances, and road conditions to find the most efficient route order.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Navigate with Ease</h3>
                      <p className="text-muted-foreground">Get your optimized route opened directly in Google Maps for turn-by-turn navigation. Save time, fuel, and reduce stress.</p>
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
      <section className="container mx-auto px-5 py-6 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold text-foreground mb-2 md:mb-4 leading-snug">
            Route 20+ Stops in Seconds.
          </h1>
          <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-accent mb-3 md:mb-6 leading-snug">
            Save 2 Hours of Driving — One Click.
          </p>
          <p className="text-sm sm:text-lg text-muted-foreground mb-4 md:mb-8 max-w-2xl mx-auto">
            Beat Google Maps' 10-stop limit. Optimize your entire day instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold w-full sm:w-auto"
            >
              Start Planning for Free
            </Button>
            <Button 
              onClick={() => openModal('pricing')}
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-lg font-semibold w-full sm:w-auto"
            >
              See Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Rule of 3 Section */}
      <section className="container mx-auto px-4 pt-8 sm:pt-16 pb-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Upload</h3>
            <p className="text-muted-foreground">Excel/CSV or type addresses.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MousePointerClick className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Optimize</h3>
            <p className="text-muted-foreground">One-click for shortest time.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Export</h3>
            <p className="text-muted-foreground">Send to Google/Apple Maps.</p>
          </div>
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
              <h3 className="text-xl font-bold mb-3">Beat the 10-Stop Limit</h3>
              <p className="text-muted-foreground">
                Plan your entire day without manual headache. No more splitting routes across multiple tabs.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Military-Grade Accuracy</h3>
              <p className="text-muted-foreground">
                Real-time traffic data from global logistics fleets powers every route calculation.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">50+ Stops</h3>
              <p className="text-muted-foreground">
                Pro users can optimize routes with 50+ stops in seconds. Perfect for delivery fleets and field teams.
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
              <div className="text-3xl font-bold text-accent mb-2">50+</div>
              <p className="text-muted-foreground">Stops (Pro)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ZipRoute vs Google Maps Comparison */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">ZippyRouter vs. Google Maps</h2>
        <div className="max-w-3xl mx-auto overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-6 py-4 font-semibold text-foreground">Feature</th>
                <th className="text-center px-6 py-4 font-semibold text-muted-foreground">Google Maps</th>
                <th className="text-center px-6 py-4 font-semibold text-accent">ZippyRouter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-6 py-4 text-foreground">Max stops</td>
                <td className="px-6 py-4 text-center text-muted-foreground">10</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">50+</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Route optimization</td>
                <td className="px-6 py-4 text-center text-muted-foreground">None</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">Mathematical shortest path</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Live traffic</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Yes</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">Yes</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Export to Maps</td>
                <td className="px-6 py-4 text-center text-muted-foreground">N/A</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">One-click</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img 
                src={roadLogo} 
                alt="ZippyRouter logo" 
                className="w-8 h-8 object-contain"
              />
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
            <a href="#" className="text-muted-foreground hover:text-accent transition-colors p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
          </div>
          
          <div className="text-center text-muted-foreground text-sm mt-8">
            © 2025 ZippyRouter. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <GlobalModal isOpen={showPricing} onClose={closeAllModals} title="Pricing">
        <PricingModal onClose={closeAllModals} onGetStarted={onGetStarted} />
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
    </div>
  );
};

export default LandingPage;
