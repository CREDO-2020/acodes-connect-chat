import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Edit3, FileUp, Flame, Forward, LogOut, MessageCircle, MoreVertical, Paperclip, Phone, Plus, Reply, Search, Send, Trash2, Users, Video, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/chats")({ component: ChatsPage });

type Profile = { id:string; full_name:string; username:string|null; avatar_url:string|null; class_name:string|null; bio:string|null; is_online:boolean; last_seen:string|null };
type Conversation = { id:string; kind:string; title:string|null; created_by:string|null; created_at:string };
type Message = { id:string; conversation_id:string; sender_id:string; body:string; created_at:string; edited_at:string|null; deleted_at:string|null; reply_to_id:string|null };
type Attachment = { id:string; message_id:string; uploader_id:string; storage_path:string; file_name:string; mime_type:string; file_size:number; created_at:string };
type Reaction = { id:string; message_id:string; user_id:string; reaction:string; created_at:string };
type Notification = { id:string; user_id:string; actor_id:string|null; conversation_id:string|null; message_id:string|null; type:string; title:string; body:string|null; read_at:string|null; created_at:string };

const emojis = ["👍","❤️","😂","😮","😢","🔥"];
const maxFileSize = 10 * 1024 * 1024;

function ChatsPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [profile,setProfile] = useState<Profile|null>(null);
  const [people,setPeople] = useState<Profile[]>([]);
  const [conversations,setConversations] = useState<Conversation[]>([]);
  const [members,setMembers] = useState<Record<string,string[]>>({});
  const [selected,setSelected] = useState<string|null>(null);
  const [messages,setMessages] = useState<Message[]>([]);
  const [attachments,setAttachments] = useState<Record<string,Attachment[]>>({});
  const [reactions,setReactions] = useState<Reaction[]>([]);
  const [draft,setDraft] = useState("");
  const [search,setSearch] = useState("");
  const [editing,setEditing] = useState<string|null>(null);
  const [replying,setReplying] = useState<Message|null>(null);
  const [file,setFile] = useState<File|null>(null);
  const [showEmoji,setShowEmoji] = useState<string|null>(null);
  const [showGroup,setShowGroup] = useState(false);
  const [groupName,setGroupName] = useState("");
  const [groupMembers,setGroupMembers] = useState<string[]>([]);
  const [showMembers,setShowMembers] = useState(false);
  const [showNotifications,setShowNotifications] = useState(false);
  const [notifications,setNotifications] = useState<Notification[]>([]);
  const [typingNames,setTypingNames] = useState<string[]>([]);
  const [lastSent,setLastSent] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!loading && !session) void navigate({to:"/login",replace:true}); }, [loading,session,navigate]);

  async function load() {
    if (!user) return;
    const [{data:me},{data:p},{data:cm},{data:n}] = await Promise.all([
      supabase.from("profiles").select("*").eq("id",user.id).maybeSingle(),
      supabase.from("profiles").select("*").neq("id",user.id).order("full_name"),
      supabase.from("conversation_members").select("conversation_id,user_id").eq("user_id",user.id),
      supabase.from("notifications").select("*").order("created_at",{ascending:false}).limit(40)
    ]);
    setProfile(me as Profile|null); setPeople((p??[]) as Profile[]); setNotifications((n??[]) as Notification[]);
    const ids=(cm??[]).map(x=>x.conversation_id);
    if (!ids.length) { setConversations([]); setMembers({}); return; }
    const [{data:cs},{data:all}] = await Promise.all([
      supabase.from("conversations").select("*").in("id",ids).order("created_at",{ascending:false}),
      supabase.from("conversation_members").select("conversation_id,user_id").in("conversation_id",ids)
    ]);
    setConversations((cs??[]) as Conversation[]);
    const grouped:Record<string,string[]>={}; for(const row of all??[]) (grouped[row.conversation_id]??=[]).push(row.user_id); setMembers(grouped);
  }
  useEffect(()=>{void load();},[user]);

  async function openChatById(id:string) {
    setSelected(id); setEditing(null); setReplying(null); setShowMembers(false);
    await Promise.all([loadMessages(id),loadReactions(id),markRead(id)]);
  }
  async function openChat(other:Profile) {
    if(!user) return;
    const {data,error}=await supabase.rpc("get_or_create_direct_conversation",{other_user:other.id});
    if(error) return toast.error(error.message);
    await load(); await openChatById(data as string);
  }
  async function loadMessages(id:string) {
    const [{data:ms},{data:as}] = await Promise.all([
      supabase.from("messages").select("*").eq("conversation_id",id).order("created_at",{ascending:true}),
      supabase.from("attachments").select("*").in("message_id",(await supabase.from("messages").select("id").eq("conversation_id",id)).data?.map(x=>x.id)??[])
    ]);
    setMessages((ms??[]) as Message[]);
    const grouped:Record<string,Attachment[]>={}; for(const a of as??[]) (grouped[a.message_id]??=[]).push(a as Attachment); setAttachments(grouped);
  }
  async function loadReactions(id:string){ const {data:ms}=await supabase.from("messages").select("id").eq("conversation_id",id); const ids=(ms??[]).map(x=>x.id); if(!ids.length){setReactions([]);return;} const {data}=await supabase.from("message_reactions").select("*").in("message_id",ids); setReactions((data??[]) as Reaction[]); }
  async function markRead(id:string){ if(!user) return; await supabase.from("conversation_members").update({last_read_at:new Date().toISOString()}).eq("conversation_id",id).eq("user_id",user.id); const ids=messages.filter(m=>m.sender_id!==user.id).map(m=>m.id); if(ids.length) await supabase.from("message_receipts").upsert(ids.map(message_id=>({message_id,user_id:user.id,read_at:new Date().toISOString()}))); }

  useEffect(()=>{
    if(!selected) return;
    void loadMessages(selected); void loadReactions(selected); void markRead(selected);
    const channel=supabase.channel(`acodes-chat-${selected}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"messages",filter:`conversation_id=eq.${selected}`},p=>{ if(p.eventType==="INSERT") setMessages(old=>old.some(x=>x.id===p.new.id)?old:[...old,p.new as Message]); else if(p.eventType==="UPDATE") setMessages(old=>old.map(x=>x.id===p.new.id?p.new as Message:x)); })
      .on("postgres_changes",{event:"*",schema:"public",table:"message_reactions"},()=>void loadReactions(selected))
      .on("postgres_changes",{event:"*",schema:"public",table:"attachments"},()=>void loadMessages(selected))
      .on("postgres_changes",{event:"*",schema:"public",table:"typing_status",filter:`conversation_id=eq.${selected}`},async()=>{ const {data}=await supabase.from("typing_status").select("user_id,is_typing").eq("conversation_id",selected).eq("is_typing",true).neq("user_id",user?.id??""); setTypingNames((data??[]).map(x=>people.find(p=>p.id===x.user_id)?.full_name||"Someone")); })
      .subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[selected,user?.id]);

  useEffect(()=>{
    if(!user) return;
    const channel=supabase.channel("acodes-notifications")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},p=>setNotifications(old=>[p.new as Notification,...old]))
      .subscribe(); return ()=>{void supabase.removeChannel(channel);};
  },[user?.id]);

  async function setTyping(value:boolean){ if(!selected||!user)return; await supabase.from("typing_status").upsert({conversation_id:selected,user_id:user.id,is_typing:value,updated_at:new Date().toISOString()}); }
  async function send(){
    const text=draft.trim(); if((!text&&!file)||!selected||!user)return;
    if(editing){ const {error}=await supabase.from("messages").update({body:text,edited_at:new Date().toISOString()}).eq("id",editing).eq("sender_id",user.id); if(error)toast.error(error.message); else {setEditing(null);setDraft("");} return; }
    const {data:m,error}=await supabase.from("messages").insert({conversation_id:selected,sender_id:user.id,body:text||"📎 Attachment",reply_to_id:replying?.id??null}).select().single();
    if(error||!m){toast.error(error?.message||"Could not send message");return;}
    if(file){
      if(file.size>maxFileSize){toast.error("File must be 10 MB or smaller");await supabase.from("messages").delete().eq("id",m.id);return;}
      const path=`${selected}/${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
      const up=await supabase.storage.from("chat-media").upload(path,file,{upsert:false});
      if(up.error){toast.error(up.error.message);await supabase.from("messages").delete().eq("id",m.id);return;}
      const ar=await supabase.from("attachments").insert({message_id:m.id,uploader_id:user.id,storage_path:path,file_name:file.name,mime_type:file.type||"application/octet-stream",file_size:file.size});
      if(ar.error)toast.error(ar.error.message);
    }
    setDraft("");setFile(null);setReplying(null);setLastSent(Date.now());await setTyping(false);await loadMessages(selected);await load();
  }
  async function editMessage(m:Message){if(m.sender_id!==user?.id||m.deleted_at)return;setEditing(m.id);setReplying(null);setDraft(m.body);}
  async function deleteMessage(m:Message){if(m.sender_id!==user?.id)return; if(!confirm("Delete this message?"))return; const {error}=await supabase.from("messages").update({body:"",deleted_at:new Date().toISOString()}).eq("id",m.id).eq("sender_id",user.id); if(error)toast.error(error.message);}
  async function react(m:Message,r:string){if(!user||m.deleted_at)return; const existing=reactions.find(x=>x.message_id===m.id&&x.user_id===user.id&&x.reaction===r); if(existing) await supabase.from("message_reactions").delete().eq("id",existing.id); else await supabase.from("message_reactions").insert({message_id:m.id,user_id:user.id,reaction:r}); setShowEmoji(null); await loadReactions(m.conversation_id);}
  async function openAttachment(a:Attachment){const {data,error}=await supabase.storage.from("chat-media").createSignedUrl(a.storage_path,300); if(error)toast.error(error.message); else window.open(data.signedUrl,"_blank","noopener,noreferrer");}

  async function createGroup(){if(!user||!groupName.trim()||groupMembers.length===0){toast.error("Enter a name and choose at least one classmate");return;} const {data,error}=await supabase.rpc("create_group",{group_title:groupName.trim(),member_ids:groupMembers}); if(error)return toast.error(error.message); setShowGroup(false);setGroupName("");setGroupMembers([]);await load();await openChatById(data as string);toast.success("Group created");}
  async function manageMember(id:string,action:"add"|"remove"){if(!selected)return;const {error}=await supabase.rpc("manage_group_member",{conversation_id_input:selected,target_user:id,action});if(error)toast.error(error.message);else{await load();toast.success(action==="add"?"Member added":"Member removed");}}
  async function leaveGroup(){if(!selected||!confirm("Leave this group?"))return;const {error}=await supabase.rpc("leave_group",{conversation_id_input:selected});if(error)toast.error(error.message);else{setSelected(null);await load();}}
  async function markNotificationRead(n:Notification){if(!n.read_at)await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",n.id); if(n.conversation_id){setShowNotifications(false);await openChatById(n.conversation_id);} }
  async function markAllRead(){if(!user)return;await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);setNotifications(n=>n.map(x=>({...x,read_at:x.read_at||new Date().toISOString()})));}
  async function logout(){await supabase.auth.signOut();void navigate({to:"/login",replace:true});}

  const filtered=useMemo(()=>people.filter(p=>`${p.full_name} ${p.username??""}`.toLowerCase().includes(search.toLowerCase())),[people,search]);
  const selectedConversation=conversations.find(c=>c.id===selected);
  const selectedPeople=selected?people.filter(p=>members[selected]?.includes(p.id)):[];
  const selectedOther=selectedPeople.find(p=>p.id!==user?.id);
  const unread=notifications.filter(n=>!n.read_at).length;
  const group=selectedConversation?.kind==="group";
  const conversationName=group?(selectedConversation?.title||"Group chat"):(selectedOther?.full_name||"Chat");

  if(loading||!session)return <div className="min-h-screen grid place-items-center">Loading Acodes…</div>;
  return <div className="min-h-screen bg-background text-foreground md:p-4"><div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl border bg-card shadow-sm">
    <aside className="hidden w-64 shrink-0 border-r p-4 md:flex md:flex-col"><Link to="/" className="mb-8 text-2xl font-bold">Acodes<span className="text-primary">.</span></Link><nav className="space-y-1 text-sm"><Link to="/chats" className="flex gap-3 rounded-xl bg-primary/10 px-3 py-2 font-medium"><MessageCircle size={18}/>Chats</Link><Link to="/classmates" className="flex gap-3 rounded-xl px-3 py-2 hover:bg-muted"><Users size={18}/>Classmates</Link><Link to="/about" className="flex gap-3 rounded-xl px-3 py-2 hover:bg-muted">About</Link></nav><div className="mt-auto rounded-2xl bg-muted p-3"><div className="font-medium">{profile?.full_name||user?.email}</div><div className="text-xs text-muted-foreground">{profile?.class_name||"Acodes member"}</div><button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut size={16}/>Sign out</button></div></aside>

    <section className="w-full border-r md:w-80"><div className="border-b p-4"><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold">Messages</h1><p className="text-xs text-muted-foreground">Private class communication</p></div><div className="flex items-center gap-1"><div className="relative"><button onClick={()=>setShowNotifications(v=>!v)} className="relative rounded-full p-2 hover:bg-muted"><Bell size={18}/>{unread>0&&<span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{unread>9?"9+":unread}</span>}</button>{showNotifications&&<div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border bg-card p-2 shadow-xl"><div className="flex items-center justify-between px-2 py-2"><b>Notifications</b><button onClick={()=>void markAllRead()} className="text-xs text-primary">Mark all read</button></div>{notifications.length===0?<p className="p-4 text-sm text-muted-foreground">No notifications.</p>:notifications.slice(0,10).map(n=><button key={n.id} onClick={()=>void markNotificationRead(n)} className={`w-full rounded-xl p-3 text-left hover:bg-muted ${!n.read_at?"bg-primary/5":""}`}><div className="flex gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"/><div><div className="text-sm font-medium">{n.title}</div><div className="text-xs text-muted-foreground">{n.body||"Open conversation"}</div><div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div></div></div></button>)}</div>}</div><button onClick={()=>setShowGroup(true)} className="rounded-full p-2 hover:bg-muted" title="New group"><Plus size={18}/></button></div></div><div className="relative mt-4"><Search size={16} className="absolute left-3 top-3 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search classmates" className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"/></div></div>
      <div className="border-b p-2">{conversations.map(c=>{const ids=members[c.id]??[];const other=people.find(p=>ids.includes(p.id));return <button key={c.id} onClick={()=>void openChatById(c.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted ${selected===c.id?"bg-muted":""}`}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold">{c.kind==="group"?<Users size={18}/>:other?.full_name?.slice(0,1)?.toUpperCase()||"A"}</div><div className="min-w-0 flex-1"><div className="truncate font-medium">{c.kind==="group"?c.title||"Group":other?.full_name||"Chat"}</div><div className="truncate text-xs text-muted-foreground">{c.kind==="group"?`${ids.length} members`:other?.is_online?"Online":"Offline"}</div></div></button>})}</div>
      <div className="p-2">{filtered.slice(0,12).map(p=><button key={p.id} onClick={()=>void openChat(p)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold">{p.full_name?.slice(0,1)?.toUpperCase()||"A"}</div><div className="min-w-0 flex-1"><div className="truncate font-medium">{p.full_name||p.username||"Classmate"}</div><div className="truncate text-xs text-muted-foreground">{p.is_online?"Online":p.class_name||"Acodes member"}</div></div><span className={`h-2 w-2 rounded-full ${p.is_online?"bg-green-500":"bg-muted-foreground/30"}`}/></button>)}{filtered.length===0&&<p className="p-5 text-center text-sm text-muted-foreground">No classmates found.</p>}</div></section>

    <main className="hidden flex-1 flex-col md:flex">{selected?<><header className="flex items-center justify-between border-b p-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold">{group?<Users size={18}/>:selectedOther?.full_name?.slice(0,1)?.toUpperCase()}</div><div className="min-w-0"><div className="truncate font-semibold">{conversationName}</div><div className="text-xs text-muted-foreground">{group?`${(members[selected]??[]).length} members`:selectedOther?.is_online?"Online now":"Offline"}{typingNames.length?` · ${typingNames.join(", ")} typing…`:""}</div></div></div><div className="flex gap-1">{group&&<button onClick={()=>setShowMembers(v=>!v)} className="rounded-full p-2 hover:bg-muted" title="Members"><Users size={18}/></button>}{!group&&<><button onClick={()=>toast.message("Voice calling is ready for a future release")} className="rounded-full p-2 hover:bg-muted"><Phone size={18}/></button><button onClick={()=>toast.message("Video calling is ready for a future release")} className="rounded-full p-2 hover:bg-muted"><Video size={18}/></button></>}</div></header>
      {showMembers&&group&&<div className="border-b bg-muted/30 p-3"><div className="mb-2 flex items-center justify-between"><b>Group members</b>{selectedConversation?.created_by===user?.id&&<span className="text-xs text-muted-foreground">Creator</span>}</div><div className="flex flex-wrap gap-2">{(members[selected]??[]).map(id=>{const p=id===user?.id?profile:people.find(x=>x.id===id);return <div key={id} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs"><span>{p?.full_name||"Member"}</span>{selectedConversation?.created_by===user?.id&&id!==user?.id&&<button onClick={()=>void manageMember(id,"remove")} className="text-muted-foreground hover:text-destructive"><X size={13}/></button>}</div>})}</div><div className="mt-3 flex flex-wrap gap-2">{selectedConversation?.created_by===user?.id&&people.filter(p=>!(members[selected]??[]).includes(p.id)).slice(0,12).map(p=><button key={p.id} onClick={()=>void manageMember(p.id,"add")} className="rounded-full border px-3 py-1 text-xs hover:bg-card">+ {p.full_name}</button>)}</div>{selectedConversation?.created_by!==user?.id&&<button onClick={()=>void leaveGroup()} className="mt-3 text-xs text-destructive">Leave group</button>}</div>}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.map(m=>{const mine=m.sender_id===user?.id;const rr=reactions.filter(r=>r.message_id===m.id);const groupedR=emojis.map(e=>({e,n:rr.filter(r=>r.reaction===e).length})).filter(x=>x.n);const reply=messages.find(x=>x.id===m.reply_to_id);return <div key={m.id} className={`group flex ${mine?"justify-end":"justify-start"}`}><div className="relative max-w-[78%]"><div className={`rounded-2xl px-4 py-2 text-sm ${mine?"bg-primary text-primary-foreground":"bg-muted"}`}>{reply&&!m.deleted_at&&<div className="mb-2 border-l-2 border-current/40 pl-2 text-xs opacity-70">Replying to: {reply.body||"Attachment"}</div>}{m.deleted_at?<span className="italic opacity-60">Message deleted</span>:<>{m.body&&<div className="whitespace-pre-wrap break-words">{m.body}</div>}{attachments[m.id]?.map(a=><button key={a.id} onClick={()=>void openAttachment(a)} className="mt-2 flex max-w-full items-center gap-2 rounded-xl border border-current/20 px-3 py-2 text-left text-xs"><FileUp size={16}/><span className="truncate">{a.file_name}</span></button>)}</>}<div className="mt-1 flex items-center gap-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}{m.edited_at&&!m.deleted_at&&" · edited"}{mine&&<CheckCheck size={12}/>}</div></div>{groupedR.length>0&&<div className="mt-1 flex flex-wrap gap-1">{groupedR.map(x=><button key={x.e} onClick={()=>void react(m,x.e)} className="rounded-full border bg-card px-2 py-0.5 text-xs shadow-sm">{x.e} {x.n}</button>)}</div>}<div className="invisible absolute -top-9 right-0 flex items-center gap-1 rounded-xl border bg-card p-1 shadow-lg group-hover:visible"><button onClick={()=>setReplying(m)} className="rounded-lg p-1.5 hover:bg-muted" title="Reply"><Reply size={14}/></button><button onClick={()=>setShowEmoji(showEmoji===m.id?null:m.id)} className="rounded-lg p-1.5 hover:bg-muted" title="React">☺</button>{mine&&!m.deleted_at&&<><button onClick={()=>void editMessage(m)} className="rounded-lg p-1.5 hover:bg-muted" title="Edit"><Edit3 size={14}/></button><button onClick={()=>void deleteMessage(m)} className="rounded-lg p-1.5 text-destructive hover:bg-muted" title="Delete"><Trash2 size={14}/></button></>}{showEmoji===m.id&&<div className="absolute right-0 top-9 flex gap-1 rounded-xl border bg-card p-2 shadow-xl">{emojis.map(e=><button key={e} onClick={()=>void react(m,e)} className="text-lg hover:scale-125">{e}</button>)}</div>}</div></div></div>})}{messages.length===0&&<div className="grid h-full place-items-center text-sm text-muted-foreground">Start the conversation.</div>}</div>
      {(replying||editing)&&<div className="mx-4 rounded-xl border bg-muted/40 p-3 text-xs"><div className="flex items-center justify-between"><b>{editing?"Editing message":"Replying to message"}</b><button onClick={()=>{setReplying(null);setEditing(null);setDraft("")}}><X size={14}/></button></div><p className="mt-1 truncate text-muted-foreground">{editing?draft:replying?.body||"Attachment"}</p></div>}
      {file&&<div className="mx-4 mt-2 flex items-center gap-2 rounded-xl border bg-muted/30 p-2 text-xs"><Paperclip size={14}/><span className="min-w-0 flex-1 truncate">{file.name}</span><button onClick={()=>setFile(null)}><X size={14}/></button></div>}
      <form onSubmit={e=>{e.preventDefault();void send()}} className="flex gap-2 border-t p-4"><input ref={fileRef} type="file" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){if(f.size>maxFileSize)toast.error("File must be 10 MB or smaller");else setFile(f)}}}/><button type="button" onClick={()=>fileRef.current?.click()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border hover:bg-muted" title="Attach file"><Paperclip size={18}/></button><input value={draft} onChange={e=>{setDraft(e.target.value);if(Date.now()-lastSent>400)void setTyping(true)}} onBlur={()=>void setTyping(false)} placeholder="Write a message…" className="flex-1 rounded-full border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"/><button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Send size={18}/></button></form>
    </>:<div className="grid flex-1 place-items-center p-8 text-center"><div><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10"><MessageCircle/></div><h2 className="text-2xl font-semibold">Your class, connected.</h2><p className="mt-2 max-w-md text-muted-foreground">Choose a classmate, create a group, and start a secure real-time conversation.</p></div></div>}</main>

    {showGroup&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-3xl border bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Create group</h2><button onClick={()=>setShowGroup(false)}><X/></button></div><input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Group name" className="mt-4 w-full rounded-xl border bg-background px-4 py-3 outline-none"/><p className="mt-4 text-sm font-medium">Choose classmates</p><div className="mt-2 max-h-72 space-y-1 overflow-y-auto">{people.map(p=><label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-muted"><input type="checkbox" checked={groupMembers.includes(p.id)} onChange={()=>setGroupMembers(v=>v.includes(p.id)?v.filter(x=>x!==p.id):[...v,p.id])}/><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold">{p.full_name?.slice(0,1)?.toUpperCase()}</span><span>{p.full_name}</span></label>)}</div><button onClick={()=>void createGroup()} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground">Create group</button></div></div>}
    <div className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-card p-3 md:hidden"><Link to="/chats"><MessageCircle/></Link><Link to="/classmates"><Users/></Link><button onClick={logout}><LogOut/></button></div>
  </div></div>;
}
