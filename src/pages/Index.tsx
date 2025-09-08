import LandingPage from "@/components/LandingPage";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 right-0 z-50 p-4">
        <HamburgerMenu />
      </header>
      <LandingPage onGetStarted={() => navigate('/app')} />
    </div>
  );
};

export default Index;