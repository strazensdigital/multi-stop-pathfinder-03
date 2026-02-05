import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const AppPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 right-0 z-50 p-4">
        <HamburgerMenu />
      </header>
      <main className="px-4 pt-4 pb-16 max-w-[1400px] mx-auto">
        <MapboxRoutePlanner />
      </main>
    </div>
  );
};

export default AppPage;