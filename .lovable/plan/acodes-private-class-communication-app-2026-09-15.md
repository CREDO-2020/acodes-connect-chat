# Acodes — private class communication app

A full-stack, real-time app for classmates: accounts, chat, groups, calls, class resources and an admin area. Branding stays subtle: "Acodes" wordmark, About page and footer credit "Designed by Credo & Sugira", contact `sugira@Lovable`.

Given the size, I'll build it in phases and keep the app usable after each one. This plan covers Phase 1 in detail and lists the rest.

## Phase 1 (this round) — foundation you can actually use

1. **Design system**: original palette (deep ink + warm citrus accent), custom type pairing, light/dark themes, rounded card language. No WhatsApp look-alike.
2. **Backend enabled** (database, auth, storage, realtime).
3. **Accounts**: sign up with own email + Acodes password, email verification, login, logout, forgot/reset password, protected areas. Provider passwords are never requested.
4. **Profiles & directory**: photo, full name, username, class, bio, phone, online status, last seen. Classmates page with search; each classmate opens Message / Voice call / Video call actions.
5. **1-to-1 real-time chat**: live messages, timestamps, unread counts, typing indicator, presence, read receipts.
6. **Shell & pages**: landing, sign up, login, reset, verify, chats, chat view, classmates, groups (list), calls, notifications, profile/settings, announcements, resources, events, polls, admin, about. Pages not yet built show a polished "coming in the next phase" state rather than fake data.
7. **Layouts**: desktop sidebar + conversation + info panel; mobile bottom navigation.

## Later phases
- Groups: creation, photo/description, roles, invite codes, mentions incl. @everyone, pinned announcements, per-group mute.
- Media: images, video, documents, previews, drag-and-drop, voice notes — stored in secure cloud storage, never in table rows.
- Message actions: reply, edit, delete, forward, copy, pin, reactions, search, clear conversation.
- Notifications centre and mute controls.
- Voice/video calls over WebRTC: incoming/outgoing UI, accept/decline, mute, camera, hang up, missed calls, history; structured for group calls later.
- Class features: announcements, resources, events calendar, polls.
- Admin dashboard: users, approvals, suspensions, groups, reports, statistics.
- Final pass: accessibility, keyboard support, security review.

## Technical notes
- TanStack Start + React + TypeScript + Tailwind + shadcn/ui.
- Lovable Cloud for auth, Postgres, storage, realtime.
- Tables: profiles, user_roles, conversations, conversation_members, messages, message_receipts, typing/presence, with row-level security so a user only reads conversations they belong to. Later phases add reactions, attachments, groups metadata, calls, notifications, announcements, resources, events, polls, reports.
- Roles live in a separate `user_roles` table checked by a security-definer function — never on the profile row.
- Registration is written so an allowed-domain list or admin approval can be switched on later without schema changes.
- Realtime subscriptions for messages, typing and presence; WebRTC signalling over the same realtime channel when calls land.

## Assumption
Anyone with an email can register for now; domain restriction and admin approval are built in but left off until you ask.
