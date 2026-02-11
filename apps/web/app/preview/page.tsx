import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectDashboard } from "@/app/projects/[id]/project-dashboard";
import { ProjectSidebar } from "@/app/projects/[id]/project-sidebar";

/**
 * Preview the app UI with mock data. No Supabase or auth required.
 * Open http://localhost:3000/preview after running `pnpm dev`.
 */
export const dynamic = "force-dynamic";

const MOCK_PROJECT_ID = "00000000-0000-0000-0000-000000000001";
const MOCK_PROJECT_NAME = "Test Prod";

const now = new Date();
const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

export default function PreviewPage() {
  return (
    <AppShell sidebar={<ProjectSidebar projectId={MOCK_PROJECT_ID} projectName={MOCK_PROJECT_NAME} />}>
      <PageHeader
        title={MOCK_PROJECT_NAME}
        description="Overview of your workspace. Connect calendar, Figma, and tools in Settings—their output will show here."
      />
      <div
        style={{
          padding: "var(--space-8)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        <p
          style={{
            margin: 0,
            padding: "var(--space-2) var(--space-4)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            backgroundColor: "var(--color-bg-muted)",
            borderRadius: "var(--radius-md)",
          }}
        >
          Preview mode — mock data. Links to project pages will 404 unless Supabase is configured.
        </p>
        <ProjectDashboard
          projectId={MOCK_PROJECT_ID}
          projectName={MOCK_PROJECT_NAME}
          tasksCount={3}
          contactsCount={2}
          conversationsCount={2}
          artifactsCount={1}
          nextTasks={[
            { id: "t1", title: "Review design mockups", status: "in_progress" },
            { id: "t2", title: "Sync with client", status: "todo" },
            { id: "t3", title: "Ship v1 scope", status: "todo" },
          ]}
          recentThreads={[
            { id: "c1", title: "Sprint planning", updated_at: anHourAgo },
            { id: "c2", title: "Architecture decisions", updated_at: yesterday },
          ]}
          recentArtifacts={[
            { id: "a1", title: "Kickoff meeting notes", updated_at: yesterday },
          ]}
          upcomingEvents={[
            { id: "e1", title: "Client sync", start_at: tomorrow, end_at: tomorrow, link: null },
            { id: "e2", title: "Design review", start_at: nextWeek, end_at: nextWeek, link: null },
          ]}
          figmaLinks={[
            { id: "f1", url: "https://figma.com/file/example", name: "Home — wireframes" },
          ]}
        />
      </div>
    </AppShell>
  );
}
