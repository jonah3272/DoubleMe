"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  Button,
  Input,
  Card,
  CardContent,
  Dialog,
  EmptyState,
  useToast,
} from "@/components/ui";
import { createProject } from "./actions";

export type ProjectRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export function ProjectsPageClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
    );
  }, [projects, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;
    setCreateSubmitting(true);
    setCreateOpen(false);
    setCreateName("");
    setCreateDescription("");

    const result = await createProject(name, createDescription.trim() || null);
    setCreateSubmitting(false);

    if (result.ok) {
      setProjects((prev) => [
        {
          id: result.id,
          owner_id: "",
          name: result.name,
          description: result.description,
          created_at: result.created_at,
          updated_at: result.updated_at,
        },
        ...prev,
      ]);
      router.refresh();
      addToast("Project created.", "success");
    } else {
      addToast(result.error, "error");
    }
  };

  const projectsSidebar = (
    <nav style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
      <Link
        href="/dashboard"
        style={{
          display: "block",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          marginBottom: "var(--space-4)",
        }}
      >
        Dashboard
      </Link>
      <span style={{ fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
        Projects
      </span>
    </nav>
  );

  return (
    <AppShell sidebar={projectsSidebar}>
      <PageHeader
        title="Projects"
        description="Your projects. Create one to start."
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={createSubmitting}>
            New project
          </Button>
        }
      />
      <div style={{ padding: "var(--space-6) var(--space-8)" }}>
        {projects.length > 0 && (
          <div style={{ marginBottom: "var(--space-4)", maxWidth: 320 }}>
            <Input
              type="search"
              placeholder="Search projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>
        )}

        {projects.length === 0 && (
          <Card variant="outlined">
            <EmptyState
              title="No projects yet"
              description="Create a project to start planning and capturing decisions."
              action={
                <Button onClick={() => setCreateOpen(true)}>New project</Button>
              }
            />
          </Card>
        )}

        {projects.length > 0 && filtered.length === 0 && (
          <Card variant="outlined">
            <EmptyState
              title="No matches"
              description="Try a different search."
              action={
                <Button variant="secondary" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          </Card>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="project-card-link"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card
                  variant="outlined"
                  className="project-card"
                  style={{
                    transition:
                      "box-shadow var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)",
                  }}
                >
                  <CardContent>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "var(--space-4)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: "var(--font-semibold)",
                            fontSize: "var(--text-base)",
                          }}
                        >
                          {project.name}
                        </p>
                        {project.description && (
                          <p
                            style={{
                              margin: "var(--space-1) 0 0 0",
                              fontSize: "var(--text-sm)",
                              color: "var(--color-text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.description}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-subtle)",
                        }}
                      >
                        {formatRelative(project.updated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => !createSubmitting && setCreateOpen(false)}
        title="New project"
      >
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          <div>
            <label
              htmlFor="project-name"
              style={{
                display: "block",
                marginBottom: "var(--space-2)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-medium)",
              }}
            >
              Name
            </label>
            <Input
              id="project-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Project name"
              required
              autoFocus
              aria-label="Project name"
            />
          </div>
          <div>
            <label
              htmlFor="project-description"
              style={{
                display: "block",
                marginBottom: "var(--space-2)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-medium)",
              }}
            >
              Description (optional)
            </label>
            <Input
              id="project-description"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Brief description"
              aria-label="Project description"
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              justifyContent: "flex-end",
              marginTop: "var(--space-2)",
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubmitting || !createName.trim()}>
              {createSubmitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}
