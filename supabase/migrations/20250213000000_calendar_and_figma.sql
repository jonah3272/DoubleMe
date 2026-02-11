-- Phase 2: Calendar events (manual + future OAuth sync) and Figma links

-- Calendar events: manual entries or synced from Google/Outlook
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'google', 'microsoft')),
  external_id text,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  link text,
  raw jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_project_id ON public.calendar_events(project_id);
CREATE INDEX idx_calendar_events_start_at ON public.calendar_events(project_id, start_at);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD calendar_events for owned projects"
  ON public.calendar_events FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

-- Figma links: store URL + optional name for dashboard
CREATE TABLE public.figma_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_figma_links_project_id ON public.figma_links(project_id);

ALTER TABLE public.figma_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD figma_links for owned projects"
  ON public.figma_links FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());
