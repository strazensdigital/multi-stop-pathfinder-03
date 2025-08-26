import MapboxRoutePlanner from "@/components/MapboxRoutePlanner";

const Index = () => {
  return (
    <div className="min-h-screen">
      <header className="py-8">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">ZipRoute</h1>
          <p className="text-muted-foreground max-w-2xl">
            Enter a start and 2–9 stops. We'll order and open in Google Maps.
          </p>
        </div>
      </header>
      <main className="container mx-auto pb-16 space-y-8">
        <MapboxRoutePlanner />
      </main>
    </div>
  );
};

export default Index;
