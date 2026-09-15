# Acodes: Class Connect

Build a modern, polished private class communication app called **Acodes**. This is a real full-stack application for classmates, not just a static mockup.

IMPORTANT BRANDING:
- App name everywhere: Acodes
- Include an About section/page in the app and footer where appropriate with this exact credit: **Designed by Credo & Sugira**.
- Also include the contact/creator email: **sugira@Lovable** exactly as provided by the user, without inventing or correcting it.
- Make the branding subtle and professional rather than dominating the UI.

AUTHENTICATION & SECURITY:
- Users must create/login to their own Acodes account using their own email and an Acodes password. NEVER ask users for or store their Gmail/Outlook/email-provider password.
- Email verification, secure login/logout, forgot/reset password, protected routes, secure password hashing, authorization, session/token security, input validation, rate limiting, and proper access controls.
- Design the architecture so registration can later be restricted to approved class/school email domains or admin approval.

CORE CHAT:
- Real-time 1-to-1 private messaging.
- Real-time group messaging.
- Typing indicators, online/offline presence, last seen, sent/delivered/read indicators.
- Reply, edit, delete, forward, copy, pin messages.
- Emoji reactions.
- Message search.
- Delete/clear conversation.
- @mentions including @everyone in groups.
- Unread counts and message timestamps.

MEDIA & FILES:
- Image/video/document sharing, PDFs, file downloads, previews, image previews, drag-and-drop uploads.
- Voice notes with record, preview, send, cancel, and playback controls.
- Use appropriate secure cloud storage and do not store large binary files directly in database rows.

VOICE & VIDEO CALLS:
- Real-time 1-to-1 voice calls and video calls using WebRTC.
- Incoming-call UI, outgoing-call UI, accept/decline, mute/unmute, camera on/off, speaker/device controls where supported, hang up, missed calls, call history.
- Build a clean architecture that can be extended to group calls later.
- Handle permissions and unsupported browser/device states gracefully.

GROUPS:
- Create groups, group name/photo/description.
- Add/remove members, admin/member roles, promote/demote admins.
- Group invite link/code.
- Leave group, group settings, pinned announcements.
- Group-specific notification mute.

PROFILES & CLASS DIRECTORY:
- Profile photo, full name, username, class, bio/about, online status, last seen, optional phone number.
- Dedicated Classmates/Directory page with search.
- Clicking a classmate opens profile actions: Message, Voice Call, Video Call.

NOTIFICATIONS:
- New message, mention, group, incoming call, missed call notifications.
- In-app notification center.
- Mute individual chats and groups.

CLASS-SPECIFIC FEATURES:
- Class Announcements area for important notices.
- Class Resources area for PDFs, notes, past exams, assignments and tutorials.
- Events/calendar area for exams, assignments, presentations and class events.
- Polls in groups/channels.

ADMIN DASHBOARD:
- Manage students/users, approve/reject accounts if approval mode is enabled, suspend users, manage groups, class information, announcements, reports, resources, and basic system statistics.
- Reporting/blocking tools for users and inappropriate messages/content.

UI/UX:
- Make Acodes feel modern, premium, youthful, fast and original—not a copy of WhatsApp.
- Responsive desktop/tablet/mobile design.
- Desktop layout: left navigation/chat list, central conversation area, optional right-side chat info/details panel.
- Mobile layout with bottom navigation and proper mobile chat screens.
- Beautiful dark/light theme support.
- Smooth but restrained animations, polished transitions, skeleton loaders, empty states, confirmation dialogs, toast notifications.
- Excellent typography, spacing, accessible contrast, keyboard-friendly interactions, responsive components.
- Modern landing/login/signup screens and a polished authenticated dashboard.
- Include an attractive Acodes logo/wordmark and consistent design system.

PAGES/AREAS:
1. Landing/welcome page
2. Sign up
3. Login
4. Forgot/reset password
5. Email verification
6. Main Chats
7. Individual chat
8. Group chat
9. Classmates directory
10. Groups
11. Calls/call history
12. Notifications
13. Profile/settings
14. Class announcements
15. Class resources
16. Class events/calendar
17. Polls
18. Admin dashboard
19. About Acodes

TECHNICAL DIRECTION:
- Use Lovable's supported full-stack architecture and backend/auth/database capabilities.
- Use TypeScript, React, Tailwind CSS and shadcn/ui where appropriate.
- Use a proper relational database schema with clear relationships for users, profiles, conversations, conversation_members, messages, message_reactions, attachments, voice_notes, groups, calls, notifications, announcements, resources, events, polls, reports and admin roles as appropriate.
- Use real-time subscriptions/WebSockets for chat and presence where supported.
- Use WebRTC for voice/video calls.
- Apply strong database authorization/RLS so users can only access conversations, groups, files and private data they are authorized to access.
- Do not fake core functionality with hardcoded demo data. Build real backend-connected flows.
- If an external service is needed for a production feature, structure the integration cleanly and use safe placeholders/configuration rather than exposing secrets.

MVP PRIORITY:
Build in a stable order: foundation/design system → authentication → profiles/class directory → 1-to-1 real-time chat → groups → media/files/voice notes → notifications → calls → class features → admin → final polish/security/accessibility. Keep the application usable after each phase.

Start by creating the full Acodes application foundation with the modern UI, database/auth architecture, navigation, core pages, and the first working authentication/chat foundation. Do not merely create screenshots; implement the actual application structure and functionality.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a92a2bfb-3254-44b7-8f1c-0c881cdff8e4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
