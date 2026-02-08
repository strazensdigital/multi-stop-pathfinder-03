import { useState } from "react";
import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const AppPage = () => {
  const [routeToLoad, setRouteToLoad] = useState<any[] | null>(null);

  const handleLoadRoute = (stops: any[]) => {
    setRouteToLoad(stops);
  };

  const handleRouteLoaded = () => {
    setRouteToLoad(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 right-0 z-50 p-4">
        <HamburgerMenu onLoadRoute={handleLoadRoute} />
      </header>
      <main className="px-4 pt-4 pb-16 max-w-[1400px] mx-auto">
        <MapboxRoutePlanner routeToLoad={routeToLoad} onRouteLoaded={handleRouteLoaded} />
      </main>
    </div>
  );
};

export default AppPage;
