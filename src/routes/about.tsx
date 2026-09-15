import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, MessagesSquare, Sparkles, Users } from "lucide-react";

import { AcodesMark } from "@/components/brand/AcodesLogo";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Acodes — built for one class" },
      {
        name: "description",
        content:
          "Acodes is a private class communication app with real-time chat, groups, calls, resources and announcements. Designed by Credo & Sugira.",
      },
      { property: "og:title", content: "About Acodes — built for one class" },
      {
        property: "og:description",
        content:
          "Acodes is a private class communication app with real-time chat, groups, calls, resources and announcements.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Lock,
    title: "Private by default",
    body: "Every conversation is locked to its members by database-level access rules, not just hidden in the interface.",
  },
  {
    icon: MessagesSquare,
    title: "Built for class life",
    body: "Chats and groups sit next to announcements, resources, events and polls, so nothing important gets lost.",
  },
  {
    icon: Users,
    title: "Everyone accounted for",
    body: "A class directory keeps classmates one tap away for a message, a voice call or a video call.",
  },
  {
    icon: Sparkles,
    title: "Deliberately its own thing",
    body: "Acodes is not a clone of a commercial messenger. It has its own look, pace and priorities.",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-aurora border-b border-border/70">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <AcodesMark className="mx-auto size-12 rounded-2xl" />
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              About <span className="text-gradient-brand">Acodes</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
              Acodes is a private communication space made for a single class — somewhere to talk,
              organise, share study material and keep track of what matters, without the noise of a
              public social network.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-5 py-14 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, body }) => (
            <article key={title} className="surface-panel p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-16">
          <div className="surface-panel p-8 text-center">
            <h2 className="font-display text-xl font-semibold">Credits & contact</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{BRAND.credit}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Questions, ideas or issues? Reach us at{" "}
              <span className="font-medium text-foreground">{BRAND.contactEmail}</span>
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/signup">Join your class on Acodes</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
