-- Prep for single-project workflow: contacts (teammates), tasks (assignable), artifact types (meeting notes, etc.)

-- Contacts / teammates: per-project people you can assign work to
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_project_id ON public.contacts(project_id);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD contacts for owned projects"
  ON public.contacts FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

-- Tasks: assignable to contacts, linkable to conversations/artifacts later
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  assignee_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  due_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(project_id, status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD tasks for owned projects"
  ON public.tasks FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

-- Artifact type: meeting_summary, note, plan, design (for future meeting notes + Figma)
ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS artifact_type text NOT NULL DEFAULT 'note';

ALTER TABLE public.artifacts DROP CONSTRAINT IF EXISTS artifacts_artifact_type_check;
ALTER TABLE public.artifacts ADD CONSTRAINT artifacts_artifact_type_check
  CHECK (artifact_type IN ('note', 'meeting_summary', 'plan', 'design'));

CREATE INDEX IF NOT EXISTS idx_artifacts_type ON public.artifacts(project_id, artifact_type);

ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz;
