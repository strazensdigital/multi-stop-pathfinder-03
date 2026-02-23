import LandingPage from "@/components/LandingPage";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { X } from "lucide-react";
import zippyLogo from "@/assets/zippy-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [showPHBadge, setShowPHBadge] = useState(true);

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-[#1E293B]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src={zippyLogo} alt="ZippyRouter logo" style={{ width: 60, height: 60 }} className="object-contain" />
          <span className="text-lg font-bold text-foreground">ZippyRouter</span>
        </div>
        <HamburgerMenu />
      </header>

      {showPHBadge && (
        <div className="fixed bottom-4 right-4 z-50 flex items-start gap-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <a
            href="https://www.producthunt.com/products/zippy-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-zippy-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              alt="Zippy on Product Hunt"
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1084051&theme=dark&t=1771818262080"
              className="w-[180px] sm:w-[250px] h-auto"
            />
          </a>
          <button
            onClick={() => setShowPHBadge(false)}
            className="p-0.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <LandingPage onGetStarted={() => navigate('/app')} />
    </div>
  );
};

export default Index;