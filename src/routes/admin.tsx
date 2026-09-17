import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Acodes" },
      { name: "description", content: "Manage members, groups and class content on Acodes." },
      { property: "og:title", content: "Admin — Acodes" },
      { property: "og:description", content: "Manage members, groups and class content on Acodes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppShell>
      <PageHeader title="Admin" description="Tools for whoever looks after the class." />
      <ComingSoon
        icon={ShieldCheck}
        title="The admin area is on the way"
        description="Everything needed to keep the class space safe and tidy."
        points={[
          "Approve, suspend and manage members",
          "Manage groups, announcements and resources",
          "Review reports and see basic statistics",
        ]}
      />
    </AppShell>
  );
}
