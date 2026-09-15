import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isEmailAllowed } from "@/lib/registration-policy";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Acodes account" },
      { name: "description", content: "Join your class on Acodes with your own email and a private Acodes password." },
      { property: "og:title", content: "Create your Acodes account" },
      { property: "og:description", content: "Join your class on Acodes with your own email and a private Acodes password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  username: z
    .string()
    .trim()
    .min(3, "Username needs at least 3 characters")
    .max(24)
    .regex(/^[a-z0-9_.]+$/i, "Use letters, numbers, dots or underscores only"),
  className: z.string().trim().max(60).optional(),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[0-9]/, "Include a number"),
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    className: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (!isEmailAllowed(parsed.data.email)) {
      toast.error("That email isn't allowed for this class yet.");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/chats`,
        data: {
          full_name: parsed.data.fullName,
          username: parsed.data.username.toLowerCase(),
          class_name: parsed.data.className ?? "",
        },
      },
    });
    setBusy(false);

    if (error) {
      toast.error("Couldn't create your account", { description: error.message });
      return;
    }
    if (!data.session) {
      void navigate({ to: "/verify-email", search: { email: parsed.data.email }, replace: true });
      return;
    }
    void navigate({ to: "/chats", replace: true });
  }

  return (
    <AuthCard
      title="Create your Acodes account"
      subtitle="Use your own email and choose a password just for Acodes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={form.fullName} onChange={set("fullName")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={form.username} onChange={set("username")} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="className">Class</Label>
          <Input
            id="className"
            placeholder="e.g. Senior 6 MCB"
            value={form.className}
            onChange={set("className")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            value={form.email}
            onChange={set("email")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Acodes password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            required
          />
          <p className="text-xs text-muted-foreground">
            At least 8 characters with upper and lowercase letters and a number.
          </p>
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
    </AuthCard>
  );
}
