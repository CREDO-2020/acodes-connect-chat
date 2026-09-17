import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Acodes" },
      { name: "description", content: "Notes, past exams and study material shared with your class." },
      { property: "og:title", content: "Resources — Acodes" },
      { property: "og:description", content: "Notes, past exams and study material shared with your class." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <AppShell>
      <PageHeader title="Resources" description="Notes, past papers and study material in one place." />
      <ComingSoon
        icon={FolderOpen}
        title="Resources are on the way"
        description="A shared library your class can search and download from."
        points={[
          "PDFs, notes, past exams, assignments and tutorials",
          "Drag-and-drop uploads with previews",
          "Stored securely, visible only to your class",
        ]}
      />
    </AppShell>
  );
}
