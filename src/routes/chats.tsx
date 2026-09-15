import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Users, Settings, LogOut, Send, Search, Phone, Video, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/chats")({ component: ChatsPage });

type Profile = { id: string; full_name: string; username: string | null; avatar_url: string | null; class_name: string | null; bio: string | null; is_online: boolean; last_seen: string | null };
type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; deleted_at: string | null };
type Conversation = { id: string; kind: string; title: string | null; created_at: string };

function ChatsPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [members, setMembers] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { if (!loading && !session) void navigate({ to: "/login", replace: true }); }, [loading, session, navigate]);

  async function load() {
    if (!user) return;
    const [{ data: me }, { data: p }, { data: cm }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("*").neq("id", user.id).order("full_name"),
      supabase.from("conversation_members").select("conversation_id,user_id").eq("user_id", user.id),
    ]);
    setProfile(me as Profile | null); setPeople((p ?? []) as Profile[]);
    const ids = (cm ?? []).map((x) => x.conversation_id);
    if (ids.length) {
      const { data: cs } = await supabase.from("conversations").select("*").in("id", ids).order("created_at", { ascending: false });
      setConversations((cs ?? []) as Conversation[]);
      const { data: all } = await supabase.from("conversation_members").select("conversation_id,user_id").in("conversation_id", ids);
      const grouped: Record<string, string[]> = {}; for (const row of all ?? []) (grouped[row.conversation_id] ??= []).push(row.user_id); setMembers(grouped);
    } else setConversations([]);
  }
  useEffect(() => { void load(); }, [user]);

  async function openChat(other: Profile) {
    const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { other_user: other.id });
    if (error) return toast.error(error.message);
    setSelected(data); await loadMessages(data as string); await load();
  }
  async function loadMessages(id: string) { const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }); setMessages((data ?? []) as Message[]); }
  useEffect(() => { if (!selected) return; void loadMessages(selected); const channel = supabase.channel(`chat-${selected}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected}` }, (payload) => setMessages((old) => [...old, payload.new as Message])).subscribe(); return () => { void supabase.removeChannel(channel); }; }, [selected]);

  async function send() { const text = draft.trim(); if (!text || !selected || !user) return; const { error } = await supabase.from("messages").insert({ conversation_id: selected, sender_id: user.id, body: text }); if (error) toast.error(error.message); else setDraft(""); }
  async function logout() { await supabase.auth.signOut(); void navigate({ to: "/login", replace: true }); }

  const filtered = useMemo(() => people.filter(p => `${p.full_name} ${p.username ?? ""}`.toLowerCase().includes(search.toLowerCase())), [people, search]);
  const selectedOther = selected ? people.find(p => members[selected]?.includes(p.id)) : null;

  if (loading || !session) return <div className="min-h-screen grid place-items-center">Loading Acodes…</div>;
  return <div className="min-h-screen bg-background text-foreground md:p-4"><div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl border bg-card shadow-sm">
    <aside className="hidden w-64 shrink-0 border-r p-4 md:flex md:flex-col"><Link to="/" className="mb-8 text-2xl font-bold">Acodes<span className="text-primary">.</span></Link><nav className="space-y-1 text-sm"><Link to="/chats" className="flex gap-3 rounded-xl bg-primary/10 px-3 py-2 font-medium"><MessageCircle size={18}/> Chats</Link><Link to="/classmates" className="flex gap-3 rounded-xl px-3 py-2 hover:bg-muted"><Users size={18}/> Classmates</Link><Link to="/about" className="flex gap-3 rounded-xl px-3 py-2 hover:bg-muted"><Settings size={18}/> About</Link></nav><div className="mt-auto rounded-2xl bg-muted p-3"><div className="font-medium">{profile?.full_name || user?.email}</div><div className="text-xs text-muted-foreground">{profile?.class_name || "Acodes member"}</div><button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut size={16}/> Sign out</button></div></aside>
    <section className="w-full border-r md:w-80"><div className="border-b p-4"><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold">Messages</h1><p className="text-xs text-muted-foreground">Private class communication</p></div><button onClick={() => toast.message("Choose a classmate to start a chat")} className="rounded-full p-2 hover:bg-muted"><Plus size={18}/></button></div><div className="relative mt-4"><Search size={16} className="absolute left-3 top-3 text-muted-foreground"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classmates" className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"/></div></div><div className="p-2">{filtered.slice(0, 20).map(p => <button key={p.id} onClick={() => void openChat(p)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold">{p.full_name?.slice(0,1)?.toUpperCase() || "A"}</div><div className="min-w-0 flex-1"><div className="truncate font-medium">{p.full_name || p.username || "Classmate"}</div><div className="truncate text-xs text-muted-foreground">{p.is_online ? "Online" : p.class_name || "Acodes member"}</div></div><span className={`h-2 w-2 rounded-full ${p.is_online ? "bg-green-500" : "bg-muted-foreground/30"}`}/></button>)}{filtered.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No classmates found.</p>}</div></section>
    <main className="hidden flex-1 flex-col md:flex">{selected && selectedOther ? <><header className="flex items-center justify-between border-b p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-semibold">{selectedOther.full_name?.slice(0,1)?.toUpperCase()}</div><div><div className="font-semibold">{selectedOther.full_name}</div><div className="text-xs text-muted-foreground">{selectedOther.is_online ? "Online now" : "Offline"}</div></div></div><div className="flex gap-1"><button onClick={() => toast.message("Voice calling is prepared for the next phase")} className="rounded-full p-2 hover:bg-muted"><Phone size={18}/></button><button onClick={() => toast.message("Video calling is prepared for the next phase")} className="rounded-full p-2 hover:bg-muted"><Video size={18}/></button></div></header><div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.map(m => <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.deleted_at ? "Message deleted" : m.body}<div className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</div></div></div>)}{messages.length === 0 && <div className="grid h-full place-items-center text-sm text-muted-foreground">Start the conversation.</div>}</div><form onSubmit={e => { e.preventDefault(); void send(); }} className="flex gap-2 border-t p-4"><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a message…" className="flex-1 rounded-full border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"/><button className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"><Send size={18}/></button></form></> : <div className="grid flex-1 place-items-center p-8 text-center"><div><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10"><MessageCircle/></div><h2 className="text-2xl font-semibold">Your class, connected.</h2><p className="mt-2 max-w-md text-muted-foreground">Choose a classmate to start a secure real-time conversation.</p></div></div>}</main>
    <div className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-card p-3 md:hidden"><Link to="/chats"><MessageCircle/></Link><Link to="/classmates"><Users/></Link><button onClick={logout}><LogOut/></button></div>
  </div></div>;
}
