import { supabase } from "@/integrations/supabase/client";

export const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export async function createGroup(name: string, memberIds: string[]) {
  return supabase.rpc("create_group", { group_name: name, member_ids: memberIds });
}

export async function toggleReaction(messageId: string, userId: string, reaction: string) {
  const { data: existing } = await supabase.from("message_reactions").select("message_id").eq("message_id", messageId).eq("user_id", userId).eq("reaction", reaction).maybeSingle();
  if (existing) return supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", userId).eq("reaction", reaction);
  return supabase.from("message_reactions").insert({ message_id: messageId, user_id: userId, reaction });
}

export async function editMessage(messageId: string, body: string) {
  return supabase.from("messages").update({ body: body.trim(), edited_at: new Date().toISOString() }).eq("id", messageId);
}

export async function deleteMessage(messageId: string) {
  return supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", messageId);
}

export async function replyToMessage(conversationId: string, senderId: string, body: string, replyToId: string) {
  return supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim(), reply_to_id: replyToId });
}

export async function uploadAttachment(file: File, userId: string, conversationId: string) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${conversationId}/${crypto.randomUUID()}-${safe}`;
  const upload = await supabase.storage.from("chat-media").upload(path, file, { upsert: false, contentType: file.type });
  if (upload.error) return upload;
  return { ...upload, path };
}
