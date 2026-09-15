import { Link } from "@tanstack/react-router";

import { BRAND } from "@/lib/brand";
import { AcodesWordmark } from "@/components/brand/AcodesLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <AcodesWordmark />
          <p className="max-w-sm text-sm text-muted-foreground">{BRAND.tagline}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <nav className="flex gap-4 text-muted-foreground">
            <Link to="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link to="/signup" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </nav>
          <p className="text-muted-foreground">
            {BRAND.credit} ·{" "}
            <span className="text-foreground/80">{BRAND.contactEmail}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
