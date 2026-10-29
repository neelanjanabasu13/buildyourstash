import { Link } from "@tanstack/react-router";
import { BrandImage } from "@/components/BrandImage";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5">
      <Link to="/" className="flex items-center gap-3" aria-label="STASH home">
        <BrandImage slot="logo" alt="STASH" label="STASH logo" className="h-10 w-36" />
      </Link>
      <nav className="flex gap-5 text-sm text-muted-foreground">
        <Link to="/how-it-checks" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>
          How it checks itself
        </Link>
      </nav>
    </header>
  );
}
