create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key(message_id,user_id,reaction)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('message','reaction','mention','group_invite','group_update')),
  message_id uuid references public.messages(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);

alter table public.attachments enable row level security;
alter table public.message_reactions enable row level security;
alter table public.notifications enable row level security;

create policy attachments_select_member on public.attachments for select to authenticated using (exists(select 1 from public.messages m join public.conversation_members cm on cm.conversation_id=m.conversation_id where m.id=message_id and cm.user_id=auth.uid()));
create policy attachments_insert_sender on public.attachments for insert to authenticated with check (exists(select 1 from public.messages m where m.id=message_id and m.sender_id=auth.uid()));
create policy reactions_select_member on public.message_reactions for select to authenticated using (exists(select 1 from public.messages m join public.conversation_members cm on cm.conversation_id=m.conversation_id where m.id=message_id and cm.user_id=auth.uid()));
create policy reactions_insert_self on public.message_reactions for insert to authenticated with check (user_id=auth.uid());
create policy reactions_delete_self on public.message_reactions for delete to authenticated using (user_id=auth.uid());
create policy notifications_select_own on public.notifications for select to authenticated using (user_id=auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.create_group(group_name text, member_ids uuid[] default '{}') returns uuid language plpgsql security invoker set search_path=public as $$ declare me uuid:=auth.uid(); cid uuid; uid uuid; begin if me is null then raise exception 'Not authenticated'; end if; insert into conversations(kind,title,created_by) values('group',nullif(trim(group_name),''),me) returning id into cid; insert into conversation_members(conversation_id,user_id) values(cid,me); foreach uid in array member_ids loop if uid<>me then insert into conversation_members(conversation_id,user_id) values(cid,uid) on conflict do nothing; end if; end loop; return cid; end; $$;
grant execute on function public.create_group(text,uuid[]) to authenticated;

create or replace function public.notify_message() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into notifications(user_id,actor_id,type,message_id,conversation_id,title,body) select cm.user_id,new.sender_id,'message',new.id,new.conversation_id,'New message',left(new.body,120) from conversation_members cm where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id; return new; end; $$;
drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages for each row execute function public.notify_message();

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.attachments;
