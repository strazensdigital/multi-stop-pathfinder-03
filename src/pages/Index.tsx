import LandingPage from "@/components/LandingPage";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useNavigate } from "react-router-dom";
import roadLogo from "@/assets/road-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-[#1E293B]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src={roadLogo} alt="ZippyRouter logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-foreground">ZippyRouter</span>
        </div>
        <HamburgerMenu />
      </header>
      <LandingPage onGetStarted={() => navigate('/app')} />
    </div>
  );
};

export default Index;