import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  Phone,
  PieChart,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

import { AcodesMark } from "@/components/brand/AcodesLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const primaryNav = [
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/groups", label: "Groups", icon: UsersRound },
  { to: "/classmates", label: "Classmates", icon: Users },
  { to: "/calls", label: "Calls", icon: Phone },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

const classNav = [
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/resources", label: "Resources", icon: FolderOpen },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/polls", label: "Polls", icon: PieChart },
] as const;

const mobileNav = [
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/groups", label: "Groups", icon: UsersRound },
  { to: "/classmates", label: "Class", icon: Users },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "You", icon: Settings },
] as const;

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/70 p-4 md:flex">
          <Link to="/chats" className="mb-6 flex items-center gap-2">
            <AcodesMark className="size-9 rounded-xl" />
            <span className="font-display text-lg font-semibold">Acodes</span>
          </Link>

          <nav className="scrollbar-slim flex-1 space-y-1 overflow-y-auto">
            {primaryNav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkBase} activeProps={{ className: "bg-primary/10 text-foreground font-medium" }}>
                <Icon className="size-[18px]" />
                {label}
              </Link>
            ))}

            <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Class
            </p>
            {classNav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkBase} activeProps={{ className: "bg-primary/10 text-foreground font-medium" }}>
                <Icon className="size-[18px]" />
                {label}
              </Link>
            ))}

            <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Account
            </p>
            <Link to="/profile" className={linkBase} activeProps={{ className: "bg-primary/10 text-foreground font-medium" }}>
              <Settings className="size-[18px]" />
              Profile &amp; settings
            </Link>
            {isAdmin ? (
              <Link to="/admin" className={linkBase} activeProps={{ className: "bg-primary/10 text-foreground font-medium" }}>
                <LayoutDashboard className="size-[18px]" />
                Admin
              </Link>
            ) : null}
          </nav>

          <div className="mt-4 rounded-2xl bg-muted/70 p-3">
            <div className="truncate text-sm font-medium">{profile?.full_name || user?.email}</div>
            <div className="truncate text-xs text-muted-foreground">{profile?.class_name || "Acodes member"}</div>
            <button
              onClick={() => void handleSignOut()}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <header className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3 md:justify-end">
            <Link to="/chats" className="flex items-center gap-2 md:hidden">
              <AcodesMark className="size-8 rounded-lg" />
              <span className="font-display font-semibold">Acodes</span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="px-5 py-6">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border/70 bg-card/95 py-2 backdrop-blur md:hidden">
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
