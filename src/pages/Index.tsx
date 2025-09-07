import { useState } from "react";
import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import LandingPage from "@/components/LandingPage";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const Index = () => {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return (
      <div className="min-h-screen">
        <header className="fixed top-0 right-0 z-50 p-4">
          <HamburgerMenu />
        </header>
        <main className="container mx-auto pb-16 space-y-8">
          <MapboxRoutePlanner />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 right-0 z-50 p-4">
        <HamburgerMenu />
      </header>
      <LandingPage onGetStarted={() => setShowApp(true)} />
    </div>
  );
};

export default Index;