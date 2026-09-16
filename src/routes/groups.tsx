import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Groups — Acodes" },
      { name: "description", content: "Create and manage class groups inside Acodes." },
      { property: "og:title", content: "Groups — Acodes" },
      { property: "og:description", content: "Create and manage class groups inside Acodes." },
    ],
  }),
  component: GroupsPage,
});

type Group = { id: string; name: string | null; description: string | null; created_by: string | null };
type Person = { id: string; full_name: string };

function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: memberships }, { data: classmates }] = await Promise.all([
      supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id),
      supabase.from("profiles").select("id,full_name").neq("id", user.id).order("full_name"),
    ]);
    setPeople((classmates ?? []) as Person[]);
    const ids = (memberships ?? []).map((m) => m.conversation_id);
    if (!ids.length) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const [{ data: convos }, { data: allMembers }] = await Promise.all([
      supabase.from("conversations").select("id,name,description,created_by").in("id", ids).eq("type", "group"),
      supabase.from("conversation_members").select("conversation_id").in("conversation_id", ids),
    ]);
    setGroups((convos ?? []) as Group[]);
    const tally: Record<string, number> = {};
    for (const row of allMembers ?? []) tally[row.conversation_id] = (tally[row.conversation_id] ?? 0) + 1;
    setCounts(tally);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!name.trim() || picked.length === 0) {
      toast.error("Add a group name and at least one classmate");
      return;
    }
    const { error } = await supabase.rpc("create_group", { group_title: name.trim(), member_ids: picked });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Group created");
    setOpen(false);
    setName("");
    setPicked([]);
    await load();
  }

  return (
    <AppShell>
      <PageHeader
        title="Groups"
        description="Class groups you belong to. Open one to chat with everyone at once."
        action={
          <Button className="rounded-full" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New group
          </Button>
        }
      />

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="surface-panel mx-auto mt-10 max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UsersRound className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">No groups yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first group and add the classmates you want in it.
          </p>
          <Button className="mt-5 rounded-full" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Create a group
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} to="/chats" className="surface-panel block p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <UsersRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium">{g.name || "Group"}</div>
                  <div className="text-xs text-muted-foreground">{counts[g.id] ?? 1} members</div>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                {g.description || "Open in chats to send a message."}
              </p>
            </Link>
          ))}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Create group</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <Input
              className="mt-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
            />
            <p className="mt-4 text-sm font-medium">Choose classmates</p>
            <div className="scrollbar-slim mt-2 max-h-64 space-y-1 overflow-y-auto">
              {people.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={picked.includes(p.id)}
                    onChange={() =>
                      setPicked((v) => (v.includes(p.id) ? v.filter((x) => x !== p.id) : [...v, p.id]))
                    }
                  />
                  <span className="text-sm">{p.full_name}</span>
                </label>
              ))}
              {people.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No classmates have joined yet.</p>
              ) : null}
            </div>
            <Button className="mt-4 w-full rounded-xl" onClick={() => void create()}>
              Create group
            </Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
