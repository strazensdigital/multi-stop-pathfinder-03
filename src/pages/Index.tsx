import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";

import AccountSheet from "@/components/AccountSheet";

const Index = () => {
  return (
    <div className="min-h-screen">
      <header className="py-8">
         <div className="container mx-auto flex justify-end">

          </div>
      </header>
      <main className="container mx-auto pb-16 space-y-8">
        <AccountSheet />
        <MapboxRoutePlanner />
      </main>
    </div>
  );
};

export default Index;
