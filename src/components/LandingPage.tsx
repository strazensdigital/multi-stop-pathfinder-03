import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Zap, Lock, MapPin, Route, Clock } from "lucide-react";
import roadLogo from "@/assets/road-logo.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
            <a href="#home" className="text-foreground hover:text-accent transition-colors">
              Home
            </a>
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
            <a href="#pricing" className="text-foreground hover:text-accent transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-foreground hover:text-accent transition-colors">
              FAQ
            </a>
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
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold"
          >
            Get Started
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
              <a href="#faq" className="text-muted-foreground hover:text-accent transition-colors">
                FAQ
              </a>
              <a href="#privacy" className="text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-accent transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="text-center text-muted-foreground text-sm mt-8">
            © 2024 ZipRoute. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;