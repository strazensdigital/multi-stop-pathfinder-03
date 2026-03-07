import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap, Upload, MousePointerClick, ExternalLink, X, Check,
  ClipboardPaste, Lock, Clock, Move, Car, Mic, Bookmark,
  Save, Download, Eye, MapPin, Smartphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import zippyLogo from "@/assets/zippy-logo.png";
import heroPhoneBg from "@/assets/hero-phone-bg.png";
import GlobalModal from "@/components/modals/GlobalModal";
import PricingModal from "@/components/modals/PricingModal";
import FAQModal from "@/components/modals/FAQModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import TermsModal from "@/components/modals/TermsModal";
import ContactModal from "@/components/modals/ContactModal";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { user } = useAuth();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
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

  const featureCards = [
    {
      icon: Zap,
      title: "Works Instantly",
      description: "No sign up. No tutorial. No app to download. Open the link, add your stops, done. Save it to your phone home screen and it works like a native app.",
      pro: false,
    },
    {
      icon: ClipboardPaste,
      title: "AI Smart-Paste",
      description: "Paste a forwarded email, a text thread, or your own messy notes. Our AI reads the text and pulls out every address automatically.",
      pro: false,
    },
    {
      icon: Mic,
      title: "Speak Your Stops",
      description: "Don't want to type? Just talk. Use speech-to-text to say your addresses out loud — we handle the rest.",
      pro: false,
    },
    {
      icon: Bookmark,
      title: "Saved Address Bookmarks",
      description: 'Save frequent stops with a nickname like "Mike\'s Pool" or "Main Warehouse." Type the name next time and our AI adds the address automatically.',
      pro: false,
    },
    {
      icon: Save,
      title: "Save & Revisit Routes",
      description: "Save your routes and come back to them any time. Perfect for recurring weekly stops.",
      pro: false,
    },
    {
      icon: Download,
      title: "Export Anywhere",
      description: "Send to Google Maps or Apple Maps in one click. Or export your full route as a CSV for records, dispatching, or sharing with your team.",
      pro: false,
    },
    {
      icon: MapPin,
      title: "Beat the 10-Stop Limit",
      description: "Plan up to 25 stops at once. We auto-split into legs that work perfectly with Google and Apple Maps.",
      pro: true,
    },
    {
      icon: Car,
      title: "Live Traffic",
      description: "Real-time traffic data via Mapbox. Every route accounts for current road conditions.",
      pro: false,
    },
    {
      icon: Move,
      title: "Drag & Drop Override",
      description: "Don't like the suggested order? Drag any stop to reorder it. The map updates instantly.",
      pro: false,
    },
    {
      icon: Lock,
      title: "Stop Locking",
      description: "Need to hit a specific stop at a set time? Lock it in. We optimize everything else around it.",
      pro: true,
    },
    {
      icon: Clock,
      title: "Accurate ETAs",
      description: "Add service time per stop to see exactly when you'll arrive — and finish — your day.",
      pro: true,
    },
    {
      icon: Eye,
      title: "See Your Drive Time Instantly",
      description: "Every stop shows the distance and drive time to get there. See your total route time at a glance before you even leave.",
      pro: false,
    },
  ];

  const whoItsFor = [
    "Pool & spa technicians",
    "Flower & parcel delivery",
    "HVAC and home service",
    "Realtors on property tours",
    "Field sales reps",
    "Landscapers with weekly routes",
    "Anyone who sees it fits their needs",
  ];

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
                <span className="text-white">The Simplest Route Planner </span>
                <span className="text-accent">on the Web.</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/70 mb-4 max-w-xl leading-relaxed">
                Drop in your addresses, hit optimize, and drive. No account needed. No ads. No bloated app to install. Just your route, ready in seconds.
              </p>
              <p className="text-xs sm:text-sm text-white/50 mb-8">
                No login required · No credit card needed · Works on mobile
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button 
                  onClick={onGetStarted}
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold w-full sm:w-auto"
                >
                  Plan My Route — It's Free
                </Button>
                <Button 
                  onClick={() => openModal('how-it-works')}
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
                >
                  See How It Works
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 pt-8 sm:pt-16 pb-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Add Your Stops</h3>
            <p className="text-muted-foreground">Type your addresses, paste a messy email or text, or just speak them out loud. Our AI reads it and pulls out the addresses automatically.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MousePointerClick className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Optimize</h3>
            <p className="text-muted-foreground">One button. We calculate the fastest route through all your stops using real-time traffic data.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Export & Go</h3>
            <p className="text-muted-foreground">Send to Google Maps in one click, export as CSV, or save your route to revisit later. We auto-split legs so everything works perfectly.</p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-3">ZippyRouter vs Standard Map Apps</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Standard map apps are great for getting from A to B. But when you have 25 stops and a deadline, you need a tool built for the job.
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
                <td className="px-6 py-4 text-foreground">Address input</td>
                <td className="px-6 py-4 text-center text-muted-foreground">Manual, one by one</td>
                <td className="px-6 py-4 text-center font-semibold text-accent">Type, paste, or speak</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Extracts addresses from messy text</td>
                <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-destructive inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Save & reuse routes</td>
                <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-destructive inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Export to CSV</td>
                <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-destructive inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-foreground">Saved address bookmarks</td>
                <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-destructive inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /></td>
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
              <tr>
                <td className="px-6 py-4 text-foreground">No account needed</td>
                <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-destructive inline" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-accent inline" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-3">Everything You Need to Finish Your Route Faster</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Built for drivers, dispatchers, and field teams who need to get more done in less time.
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {featureCards.map((card) => (
            <Card
              key={card.title}
              className={`p-6 transition-colors hover:shadow-lg relative ${
                card.pro
                  ? "border-2 border-accent/30 hover:border-accent/60"
                  : "border hover:border-accent/50"
              }`}
            >
              {card.pro && (
                <Badge variant="outline" className="absolute top-3 right-3 text-[10px] border-accent/40 text-accent">PRO</Badge>
              )}
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <card.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{card.title}</h3>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold"
          >
            Plan My Route — It's Free
          </Button>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Built for Anyone With More Than 3 Stops</h2>
          <p className="text-muted-foreground mb-8 text-base sm:text-lg">
            If you're manually typing every stop into Google Maps, you're wasting time you don't have.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {whoItsFor.map((item) => (
              <Badge key={item} variant="secondary" className="text-sm px-4 py-2">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-accent mb-2">25 Stops</div>
              <p className="text-muted-foreground">Optimize a full day's worth of stops on Pro</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">1 Click</div>
              <p className="text-muted-foreground">From messy text to a ready-to-drive route</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">Zero Install</div>
              <p className="text-muted-foreground">Runs in your browser. No app store. No updates.</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">Mobile-Ready</div>
              <p className="text-muted-foreground">Works in any browser. Save to your home screen for instant access.</p>
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
        <PricingModal onClose={closeAllModals} onGetStarted={() => {
          if (user) {
            onGetStarted();
          } else {
            closeAllModals();
            setShowAuth(true);
          }
        }} />
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
    </div>
  );
};

export default LandingPage;
