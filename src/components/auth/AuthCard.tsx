import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AcodesWordmark } from "@/components/brand/AcodesLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-aurora flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" aria-label="Acodes home">
          <AcodesWordmark />
        </Link>
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center px-5 pb-12">
        <div className="w-full max-w-md">
          <div className="surface-panel p-7">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer ? (
            <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
          ) : null}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            {BRAND.credit} · {BRAND.contactEmail}
          </p>
        </div>
      </main>
    </div>
  );
}
