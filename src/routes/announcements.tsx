import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Acodes" },
      { name: "description", content: "Class announcements shared with everyone on Acodes." },
      { property: "og:title", content: "Announcements — Acodes" },
      { property: "og:description", content: "Class announcements shared with everyone on Acodes." },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <AppShell>
      <PageHeader title="Announcements" description="Important notices for the whole class." />
      <ComingSoon
        icon={Megaphone}
        title="Announcements are on the way"
        description="A single place for notices everyone needs to read."
        points={[
          "Posts from class admins with pinning",
          "Read tracking so you know who has seen it",
          "Instant alerts in your notifications",
        ]}
      />
    </AppShell>
  );
}
