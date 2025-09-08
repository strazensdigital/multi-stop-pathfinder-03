import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const AppPage = () => {
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
};

export default AppPage;