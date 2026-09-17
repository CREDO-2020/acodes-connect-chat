import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "Calls — Acodes" },
      { name: "description", content: "Voice and video calls with your classmates on Acodes." },
      { property: "og:title", content: "Calls — Acodes" },
      { property: "og:description", content: "Voice and video calls with your classmates on Acodes." },
    ],
  }),
  component: CallsPage,
});

function CallsPage() {
  return (
    <AppShell>
      <PageHeader title="Calls" description="Voice and video calling for your class." />
      <ComingSoon
        icon={Phone}
        title="Calls are on the way"
        description="One-to-one voice and video calls, built to grow into group calls."
        points={[
          "Incoming and outgoing call screens with accept and decline",
          "Mute, camera on/off and speaker controls",
          "Missed calls and full call history",
        ]}
      />
    </AppShell>
  );
}
