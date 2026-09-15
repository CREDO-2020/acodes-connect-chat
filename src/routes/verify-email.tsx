import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search['email'] === "string" ? search['email'] : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirm your email — Acodes" },
      { name: "description", content: "Confirm your email address to activate your Acodes account." },
      { property: "og:title", content: "Confirm your email — Acodes" },
      { property: "og:description", content: "Confirm your email address to activate your Acodes account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const [busy, setBusy] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("We don't know which address to resend to — sign up again.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/chats` },
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't resend the email", { description: error.message });
      return;
    }
    toast.success("Confirmation email sent again");
  }

  return (
    <AuthCard
      title="Confirm your email"
      subtitle="One quick step before your class can reach you."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            We sent a confirmation link{email ? <> to <span className="text-foreground">{email}</span></> : null}.
            Open it to activate your Acodes account, then sign in.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={resend}
          disabled={busy}
        >
          {busy ? "Sending…" : "Resend confirmation email"}
        </Button>
      </div>
    </AuthCard>
  );
}
