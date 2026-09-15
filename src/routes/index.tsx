import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, MessageCircle, Users } from "lucide-react";

import { AcodesMark } from "@/components/brand/AcodesLogo";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acodes — The private home for your class" },
      {
        name: "description",
        content: "Private class communication with real-time chats, groups and file sharing.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-aurora border-b border-border/70">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <AcodesMark className="mx-auto size-16 rounded-2xl" />
              <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Your class. Your space.
              </p>
              <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-7xl">
                Welcome to <span className="text-gradient-brand">Acodes</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                A private place for your class to chat, create groups, share files and stay connected.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/signup">
                    Get started <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
              <Feature icon={MessageCircle} title="Real-time chat" text="Talk privately with classmates and groups." />
              <Feature icon={Users} title="Class groups" text="Create groups and manage your members." />
              <Feature icon={Lock} title="Private sharing" text="Share messages, reactions and files securely." />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MessageCircle;
  title: string;
  text: string;
}) {
  return (
    <article className="surface-panel p-6 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-4 font-display font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </article>
  );
}
