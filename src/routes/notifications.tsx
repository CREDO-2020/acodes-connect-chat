import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Acodes" },
      { name: "description", content: "Everything you missed in your Acodes chats and groups." },
      { property: "og:title", content: "Notifications — Acodes" },
      { property: "og:description", content: "Everything you missed in your Acodes chats and groups." },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
  conversation_id: string | null;
};

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,type,read_at,created_at,conversation_id")
      .order("created_at", { ascending: false })
      .limit(60);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    await load();
  }

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description="New messages, mentions and group activity from your class."
        action={
          <Button variant="outline" className="rounded-full" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        }
      />

      {loading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="surface-panel mx-auto mt-10 max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            New messages and group activity will show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                to="/chats"
                className={`flex items-start gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:bg-muted/60 ${
                  n.read_at ? "" : "bg-primary/5"
                }`}
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{n.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{n.body || "Open conversation"}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
