import { Link } from "@tanstack/react-router";
import { BrandImage } from "@/components/BrandImage";
import { useFirstResult } from "@/components/FirstResultContext";

export function SiteHeader() {
  const { unlocked } = useFirstResult();
  return (
    <header className="mx-auto mb-4 flex w-full max-w-4xl items-center justify-between gap-4 border-b border-foreground/20 px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-3" aria-label="STASH home">
        <BrandImage slot="logo" alt="STASH" label="STASH logo" className="h-16 w-16" />
      </Link>
      {unlocked && <details className="relative text-right text-xs text-muted-foreground sm:text-sm">
        <summary className="cursor-pointer px-2 py-3">More about STASH</summary>
        <nav className="absolute right-0 top-full z-20 w-48 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-sm">
        <Link to="/how-it-checks" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>
          How it checks itself
        </Link>
        </nav>
      </details>}
    </header>
  );
}
