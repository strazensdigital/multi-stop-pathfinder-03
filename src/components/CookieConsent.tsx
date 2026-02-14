import { useState, useEffect } from "react";

const CONSENT_KEY = "zippyrouter_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-muted/80 backdrop-blur-sm border-t border-border px-4 py-2 flex items-center justify-between gap-4 text-xs text-muted-foreground z-50">
      <span>
        We use cookies to improve your experience.{" "}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("open-modal", { detail: "privacy" })); }}
          className="underline text-foreground hover:text-accent"
        >
          Privacy Policy
        </a>
      </span>
      <div className="flex gap-2 shrink-0">
        <button onClick={decline} className="text-muted-foreground hover:text-foreground transition-colors">Decline</button>
        <button onClick={accept} className="font-medium text-foreground hover:text-accent transition-colors">Accept</button>
      </div>
    </div>
  );
}
