import { Link } from "@tanstack/react-router";
import krowe from "@/assets/krowe.png";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5">
      <Link to="/" className="flex items-center gap-3">
        <img src={krowe} alt="KROWE the crow" width={40} height={40} className="h-10 w-10 object-contain invert-[0.9] sepia" />
        <span className="font-display text-2xl font-extrabold tracking-tight">STASH</span>
      </Link>
      <nav className="flex gap-5 text-sm text-muted-foreground">
        <Link to="/how-it-checks" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>
          How it checks itself
        </Link>
      </nav>
    </header>
  );
}
