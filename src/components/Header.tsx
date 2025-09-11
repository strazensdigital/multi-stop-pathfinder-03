import { Menu } from "lucide-react";

export default function Header() {
  const openAccount = () =>
    window.dispatchEvent(new CustomEvent("open-account-drawer", { detail: { view: "plan" } }));

  return (
    <header className="py-4 border-b">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* lightweight logo text — replace with your SVG if you want */}
          <span className="font-bold text-lg">ZipRouter</span>
          <span className="text-xs text-muted-foreground">Free multi-stop optimizer</span>
        </div>
        <button
          onClick={openAccount}
          aria-label="Menu"
          className="p-2 rounded hover:bg-muted"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
