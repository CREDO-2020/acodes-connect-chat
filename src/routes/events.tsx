import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Acodes" },
      { name: "description", content: "Exams, assignments and presentations on your class calendar." },
      { property: "og:title", content: "Events — Acodes" },
      { property: "og:description", content: "Exams, assignments and presentations on your class calendar." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <AppShell>
      <PageHeader title="Events" description="Your class calendar of deadlines and dates." />
      <ComingSoon
        icon={CalendarDays}
        title="The calendar is on the way"
        description="Everything with a date, in one shared view."
        points={[
          "Exams, assignments and presentations",
          "Month and list views",
          "Reminders before a deadline arrives",
        ]}
      />
    </AppShell>
  );
}
