-- MESSAGE RECEIPTS
CREATE TABLE public.message_receipts (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_receipts TO authenticated;
GRANT ALL ON public.message_receipts TO service_role;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_select ON public.message_receipts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY receipts_insert ON public.message_receipts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY receipts_update ON public.message_receipts FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- TYPING STATUS
CREATE TABLE public.typing_status (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_status TO authenticated;
GRANT ALL ON public.typing_status TO service_role;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY typing_select ON public.typing_status FOR SELECT TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY typing_write ON public.typing_status FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY typing_update ON public.typing_status FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY typing_delete ON public.typing_status FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ATTACHMENTS
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY attachments_select ON public.attachments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY attachments_insert ON public.attachments FOR INSERT TO authenticated
WITH CHECK (uploader_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY attachments_delete ON public.attachments FOR DELETE TO authenticated
USING (uploader_id = auth.uid());

-- REACTIONS
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, reaction)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reactions_select ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY reactions_insert ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY reactions_delete ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_id UUID,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'message',
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- NOTIFY MEMBERS ON NEW MESSAGE
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, actor_id, conversation_id, message_id, type, title, body)
  SELECT cm.user_id, NEW.sender_id, NEW.conversation_id, NEW.id, 'message',
         COALESCE(sender_name, 'New message'), LEFT(COALESCE(NEW.body, 'Attachment'), 140)
  FROM public.conversation_members cm
  WHERE cm.conversation_id = NEW.conversation_id AND cm.user_id <> NEW.sender_id AND cm.muted = false;
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_members_on_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- GROUP FUNCTIONS
CREATE OR REPLACE FUNCTION public.create_group(group_title TEXT, member_ids UUID[])
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id UUID; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.conversations (type, name, created_by) VALUES ('group', group_title, uid) RETURNING id INTO new_id;
  INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES (new_id, uid, 'admin');
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  SELECT new_id, m, 'member' FROM unnest(member_ids) AS m WHERE m <> uid
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.manage_group_member(conversation_id_input UUID, target_user UUID, action TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF NOT public.is_conversation_admin(conversation_id_input, uid) THEN RAISE EXCEPTION 'Only group admins can manage members'; END IF;
  IF action = 'add' THEN
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (conversation_id_input, target_user, 'member') ON CONFLICT (conversation_id, user_id) DO NOTHING;
  ELSIF action = 'remove' THEN
    DELETE FROM public.conversation_members WHERE conversation_id = conversation_id_input AND user_id = target_user;
  ELSIF action = 'promote' THEN
    UPDATE public.conversation_members SET role = 'admin' WHERE conversation_id = conversation_id_input AND user_id = target_user;
  ELSIF action = 'demote' THEN
    UPDATE public.conversation_members SET role = 'member' WHERE conversation_id = conversation_id_input AND user_id = target_user;
  ELSE RAISE EXCEPTION 'Unknown action';
  END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.leave_group(conversation_id_input UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.conversation_members WHERE conversation_id = conversation_id_input AND user_id = auth.uid();
  RETURN true;
END; $$;

REVOKE EXECUTE ON FUNCTION public.create_group(TEXT, UUID[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.manage_group_member(UUID, UUID, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.leave_group(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_group(TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_group_member(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group(UUID) TO authenticated;

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.attachments REPLICA IDENTITY FULL;
ALTER TABLE public.typing_status REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions, public.attachments, public.typing_status, public.notifications;