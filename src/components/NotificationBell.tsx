import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function NotificationBell() {
  const { user } = useAuth(); const [count,setCount]=useState(0);
  useEffect(()=>{ if(!user)return; const load=async()=>{const {count}=await supabase.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null);setCount(count??0)}; void load(); const ch=supabase.channel(`notifications-${user.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},p=>{setCount(c=>c+1);toast.message(p.new.title as string,{description:(p.new.body as string)||undefined})}).subscribe(); return()=>{void supabase.removeChannel(ch)} },[user]);
  async function open(){if(!user)return;await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);setCount(0);toast.message("Notifications marked as read")}
  return <button onClick={open} className="relative rounded-full p-2 hover:bg-muted" aria-label="Notifications"><Bell size={19}/>{count>0&&<span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] text-primary-foreground">{count>99?"99+":count}</span>}</button>
}
