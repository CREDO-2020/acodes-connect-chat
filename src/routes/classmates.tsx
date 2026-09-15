import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/classmates")({ component: ClassmatesPage });
type Profile = { id: string; full_name: string; username: string | null; avatar_url: string | null; class_name: string | null; bio: string | null; is_online: boolean; last_seen: string | null };
function ClassmatesPage() {
  const { user } = useAuth(); const [people, setPeople] = useState<Profile[]>([]); const [q, setQ] = useState("");
  useEffect(() => { if (!user) return; void supabase.from("profiles").select("*").neq("id", user.id).order("full_name").then(({ data }) => setPeople((data ?? []) as Profile[])); }, [user]);
  const filtered = people.filter(p => `${p.full_name} ${p.username ?? ""} ${p.class_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="min-h-screen bg-background p-5 md:p-10"><div className="mx-auto max-w-5xl"><a href="/chats" className="font-bold text-2xl">Acodes<span className="text-primary">.</span></a><div className="mt-10 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Classmates</h1><p className="mt-1 text-muted-foreground">Find people in your Acodes community.</p></div><div className="relative w-64"><Search size={16} className="absolute left-3 top-3 text-muted-foreground"/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="w-full rounded-xl border bg-background py-2 pl-9 pr-3"/></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p => <div key={p.id} className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-lg font-bold">{p.full_name?.slice(0,1)?.toUpperCase() || "A"}</div><div className="min-w-0"><div className="truncate font-semibold">{p.full_name || "Classmate"}</div><div className="text-xs text-muted-foreground">@{p.username || "member"}</div></div></div><p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{p.bio || p.class_name || "Acodes member"}</p><a href={`/chats?user=${p.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><MessageCircle size={16}/> Message</a></div>)}</div>{filtered.length === 0 && <div className="mt-10 text-center text-muted-foreground">No classmates found.</div>}</div></div>;
}
