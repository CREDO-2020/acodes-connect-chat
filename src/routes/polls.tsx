import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/polls")({
  head: () => ({
    meta: [
      { title: "Polls — Acodes" },
      { name: "description", content: "Ask your class a question and see the answers in real time." },
      { property: "og:title", content: "Polls — Acodes" },
      { property: "og:description", content: "Ask your class a question and see the answers in real time." },
    ],
  }),
  component: PollsPage,
});

function PollsPage() {
  return (
    <AppShell>
      <PageHeader title="Polls" description="Quick decisions, made together." />
      <ComingSoon
        icon={BarChart3}
        title="Polls are on the way"
        description="Ask a question in a group and watch the results come in."
        points={[
          "Single and multiple choice questions",
          "Live results as classmates vote",
          "Close a poll and keep the outcome pinned",
        ]}
      />
    </AppShell>
  );
}
