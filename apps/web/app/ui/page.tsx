"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  EmptyState,
  Drawer,
  Dialog,
  useToast,
} from "@/components/ui";

const sectionStyle: React.CSSProperties = {
  marginBottom: "var(--space-12)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 var(--space-4) 0",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--font-semibold)",
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function UIShowcasePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { addToast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <AppShell
      sidebar={
        <nav
          style={{
            padding: "var(--space-4)",
            fontSize: "var(--text-sm)",
          }}
        >
          <div style={{ marginBottom: "var(--space-4)", fontWeight: "var(--font-semibold)" }}>
            Design system
          </div>
          <a
            href="#buttons"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Buttons
          </a>
          <a
            href="#inputs"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Inputs
          </a>
          <a
            href="#cards"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Cards
          </a>
          <a
            href="#table"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Table
          </a>
          <a
            href="#skeleton"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Skeleton
          </a>
          <a
            href="#empty"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Empty state
          </a>
          <a
            href="#drawer"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Drawer
          </a>
          <a
            href="#dialog"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-2)" }}
          >
            Dialog
          </a>
          <a
            href="#toast"
            style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none" }}
          >
            Toast
          </a>
        </nav>
      }
    >
      <PageHeader
        title="Design system"
        description="Components and states. No icons."
        actions={
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </Button>
        }
      />
      <div style={{ padding: "var(--space-8)", maxWidth: 900 }}>
        <section id="buttons" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Buttons</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div style={{ marginTop: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Button variant="primary" fullWidth>Full width</Button>
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        <section id="inputs" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Inputs</h2>
          <div style={{ maxWidth: 360 }}>
            <Input placeholder="Placeholder" aria-label="Default input" />
            <div style={{ marginTop: "var(--space-4)" }}>
              <Input placeholder="With value" defaultValue="Entered text" aria-label="With value" />
            </div>
            <div style={{ marginTop: "var(--space-4)" }}>
              <Input placeholder="Error state" error aria-label="Error input" />
            </div>
          </div>
        </section>

        <section id="textarea" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Textarea</h2>
          <div style={{ maxWidth: 480 }}>
            <Textarea placeholder="Placeholder" aria-label="Default textarea" />
            <div style={{ marginTop: "var(--space-4)" }}>
              <Textarea placeholder="Error state" error aria-label="Error textarea" />
            </div>
          </div>
        </section>

        <section id="cards" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Cards</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
            <Card variant="elevated" style={{ minWidth: 280 }}>
              <CardHeader>
                <span style={{ fontWeight: "var(--font-semibold)" }}>Elevated</span>
              </CardHeader>
              <CardContent>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Soft shadow, subtle border.
                </p>
              </CardContent>
            </Card>
            <Card variant="outlined" style={{ minWidth: 280 }}>
              <CardHeader>
                <span style={{ fontWeight: "var(--font-semibold)" }}>Outlined</span>
              </CardHeader>
              <CardContent>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Border only, no shadow.
                </p>
              </CardContent>
            </Card>
            <Card variant="muted" style={{ minWidth: 280 }}>
              <CardHeader>
                <span style={{ fontWeight: "var(--font-semibold)" }}>Muted</span>
              </CardHeader>
              <CardContent>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Muted background.
                </p>
              </CardContent>
            </Card>
          </div>
          <div style={{ marginTop: "var(--space-4)", maxWidth: 480 }}>
            <Card variant="elevated">
              <CardHeader>Card with footer</CardHeader>
              <CardContent>Content here.</CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section id="table" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Table</h2>
          <Card variant="outlined" style={{ overflow: "hidden" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Project A</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Today</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Project B</TableCell>
                  <TableCell>Draft</TableCell>
                  <TableCell>Yesterday</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Project C</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>This week</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        <section id="skeleton" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Skeleton</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 360 }}>
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton height={16} width="80%" />
          </div>
        </section>

        <section id="empty" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Empty state</h2>
          <Card variant="outlined">
            <EmptyState
              title="No projects yet"
              description="Create a project to start planning and capturing decisions."
              action={<Button variant="primary">Create project</Button>}
            />
          </Card>
        </section>

        <section id="drawer" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Drawer</h2>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            side="right"
            title="Drawer title"
          >
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Drawer content. Close with Escape or the overlay.
            </p>
          </Drawer>
        </section>

        <section id="dialog" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Dialog</h2>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Dialog title">
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Dialog content. Focus is trapped; close with Escape or the overlay.
            </p>
          </Dialog>
        </section>

        <section id="toast" style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Toast</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <Button variant="secondary" onClick={() => addToast("Default toast")}>
              Default toast
            </Button>
            <Button variant="secondary" onClick={() => addToast("Success message", "success")}>
              Success toast
            </Button>
            <Button variant="secondary" onClick={() => addToast("Error message", "error")}>
              Error toast
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
