import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";
import Header from "@/components/Header";
import AccountSheet from "@/components/AccountSheet";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto pb-16 space-y-8">
        <AccountSheet />
        <MapboxRoutePlanner />
      </main>
    </div>
  );
};

export default Index;
