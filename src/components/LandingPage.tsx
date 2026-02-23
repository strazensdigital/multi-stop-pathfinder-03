import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, Route, Upload, MousePointerClick, ExternalLink, X, Check, ClipboardPaste, Link, Lock, Clock, Move, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import zippyLogo from "@/assets/zippy-logo.png";
import heroPhoneBg from "@/assets/hero-phone-bg.png";
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
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Spacer for fixed header */}
      <div className="pt-14" />

      {/* Three-Layer Hero Section */}
      <section ref={heroRef} className="relative min-h-[calc(100vh-56px)] overflow-hidden">
        {/* Layer 1: Background image with parallax */}
        <div 
          className="absolute inset-0 z-0"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <img
            src={heroPhoneBg}
            alt=""
            className="absolute top-0 right-0 h-full w-auto max-w-none object-cover object-right
              lg:w-[60%] lg:h-[120%] lg:-top-[10%]
              max-lg:w-full max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:object-center"
          />
          {/* Desktop: fade edges of the image into the background */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#1E293B] via-[#1E293B]/90 to-transparent" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-[#1E293B]/60" />
        </div>

        {/* Layer 2: Dark translucent overlay */}
        <div className="absolute inset-0 z-10 bg-[#1E293B]/80" />

        {/* Layer 3: Content on top */}
        <div className="relative z-20 flex items-center min-h-[calc(100vh-56px)]">
          <div className="container mx-auto px-5">
            <div className="max-w-2xl lg:max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                <span className="text-white">Paste Your List. </span>
                <span className="text-accent">Optimize Your Route.</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/70 mb-4 max-w-xl leading-relaxed">
                The AI-powered route planner that turns messy text into professional delivery routes. Break the 10-stop limit and optimize 25 addresses in one click.
              </p>
              <p className="text-xs sm:text-sm text-white/50 mb-8">
                No login required · No credit card needed
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
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
                  className="px-8 py-4 text-lg font-semibold w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
                >
                  See Pricing
                </Button>
              </div>
            </div>
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

      {/* Why Pros Switch — Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-3">Why Pros Switch from Standard Map Apps</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Standard map apps are great for getting from A to B. But when you have 30 stops and a deadline, you need a tool built for the job.
        </p>
        <div className="max-w-3xl mx-auto overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-6 py-4 font-semibold text-foreground">Feature</th>
                <th className="text-center px-6 py-4 font-semibold text-muted-foreground">Standard Map Apps</th>
                <th className="text-center px-6 py-4 font-semibold text-accent">ZippyRouter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-6 py-4 text-foreground">Max stops</td>
                <td className="px-6 py-4 text-center text-muted-foreground">10</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">25</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Route optimization</td>
                <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-destructive inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /> AI sequencing</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Address input</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Manual, one-by-one</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">Paste any text list</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Live traffic</td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-muted-foreground inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Export to Maps app</td>
                <td className="px-6 py-4 text-center text-muted-foreground">N/A</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">One-click</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How ZippyRouter Compares — Competitor Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-3">How ZippyRouter Compares</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          See how we stack up against the competition.
        </p>
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-6 py-4 font-semibold text-foreground">Feature</th>
                <th className="text-center px-6 py-4 font-semibold text-accent border-l-2 border-accent/30 bg-accent/5">ZippyRouter</th>
                <th className="text-center px-6 py-4 font-semibold text-muted-foreground">Competitor R</th>
                <th className="text-center px-6 py-4 font-semibold text-muted-foreground">Competitor C</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-6 py-4 text-foreground">Max Stops</td>
                <td className="px-6 py-4 text-center border-l-2 border-accent/30 bg-accent/5 font-semibold text-accent"><Check className="w-4 h-4 text-accent inline mr-1" />25 Stops</td>
                <td className="px-6 py-4 text-center text-muted-foreground">20 Stops</td>
                <td className="px-6 py-4 text-center text-muted-foreground">10 Stops</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Address Input</td>
                <td className="px-6 py-4 text-center border-l-2 border-accent/30 bg-accent/5 font-semibold text-accent"><Check className="w-4 h-4 text-accent inline mr-1" />AI Smart-Paste</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Upload/Manual</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Manual/Camera</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Optimization</td>
                <td className="px-6 py-4 text-center border-l-2 border-accent/30 bg-accent/5 font-semibold text-accent"><Check className="w-4 h-4 text-accent inline mr-1" />One-Click AI</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Basic</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Advanced</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Setup Time</td>
                <td className="px-6 py-4 text-center border-l-2 border-accent/30 bg-accent/5 font-semibold text-accent"><Check className="w-4 h-4 text-accent inline mr-1" />Instant</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Moderate</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Slow</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-3">Everything You Need to Finish Your Route Faster</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Built for drivers, dispatchers, and field teams who need to get more done in less time.
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 border hover:border-accent/50 transition-colors hover:shadow-lg">
            <CardContent className="pt-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <ClipboardPaste className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">AI Smart-Paste</h3>
              <p className="text-muted-foreground text-sm">Paste messy text from emails or notes. Our AI extracts addresses in seconds.</p>
            </CardContent>
          </Card>
          <Card className="p-6 border hover:border-accent/50 transition-colors hover:shadow-lg">
            <CardContent className="pt-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Link className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">The Google Bypass</h3>
              <p className="text-muted-foreground text-sm">Plan 25 stops at once. We auto-split your route into easy 9-stop legs for Google/Apple Maps.</p>
            </CardContent>
          </Card>
          <Card className="p-6 border-2 border-accent/30 hover:border-accent/60 transition-colors hover:shadow-lg relative">
            <Badge variant="outline" className="absolute top-3 right-3 text-[10px] border-accent/40 text-accent">PRO</Badge>
            <CardContent className="pt-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Stop Locking</h3>
              <p className="text-muted-foreground text-sm">Lock 'must-visit' stops at specific times. The AI optimizes the rest around your schedule.</p>
            </CardContent>
          </Card>
          <Card className="p-6 border-2 border-accent/30 hover:border-accent/60 transition-colors hover:shadow-lg relative">
            <Badge variant="outline" className="absolute top-3 right-3 text-[10px] border-accent/40 text-accent">PRO</Badge>
            <CardContent className="pt-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Accurate ETAs</h3>
              <p className="text-muted-foreground text-sm">Add service minutes for each stop to see exactly when you'll finish your day.</p>
            </CardContent>
          </Card>
          <Card className="p-6 border hover:border-accent/50 transition-colors hover:shadow-lg">
            <CardContent className="pt-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Move className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Manual Override</h3>
              <p className="text-muted-foreground text-sm">Don't like the AI path? Simply drag and drop stops to reorder. The map updates instantly.</p>
            </CardContent>
          </Card>
          <Card className="p-6 border hover:border-accent/50 transition-colors hover:shadow-lg">
            <CardContent className="pt-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Live Traffic</h3>
              <p className="text-muted-foreground text-sm">Powered by Mapbox real-time data to avoid congestion and save on fuel.</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-10">
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold"
          >
            Start Planning Your First Route (Free)
          </Button>
        </div>
      </section>

      {/* PAS Narrative */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-base sm:text-lg text-foreground leading-relaxed">
            Still manually typing every stop into your map app? One typo sends you 20 minutes across town. Wasted gas, late deliveries, and the stress of managing 30 stops in an app built for 10. <span className="font-semibold text-accent">ZippyRouter turns your messy text into a professional route in one click.</span>
          </p>
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
              <h3 className="text-xl font-bold mb-3">25 Stops</h3>
              <p className="text-muted-foreground">
                Pro users can optimize routes with up to 25 stops in seconds. Perfect for delivery fleets and field teams.
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
              <div className="text-3xl font-bold text-accent mb-2">25</div>
              <p className="text-muted-foreground">Stops (Pro)</p>
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
                src={zippyLogo} 
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
            © 2026 ZippyRouter. All rights reserved.
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
