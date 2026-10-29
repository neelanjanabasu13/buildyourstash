import { Link } from "@tanstack/react-router";
import { BrandImage } from "@/components/BrandImage";

export function SiteHeader() {
  return (
    <header className="mx-auto mb-4 flex w-full max-w-4xl items-center justify-between gap-4 border-b border-foreground/20 px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-3" aria-label="STASH home">
        <BrandImage slot="logo" alt="STASH" label="STASH logo" className="h-16 w-16" />
        <div><span className="font-display text-2xl font-extrabold text-primary">STASH</span><p className="mt-0.5 text-xs font-semibold text-foreground">Save. Build. Ship.</p></div>
      </Link>
      <nav className="text-right text-xs text-muted-foreground sm:text-sm">
        <Link to="/how-it-checks" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>
          How it checks itself
        </Link>
      </nav>
    </header>
  );
}
