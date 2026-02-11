-- Initial schema: profiles, projects, project_agents, conversations, messages, project_memory, artifacts, audit_logs
-- RLS enabled on all tables. Policies based strictly on project ownership.

-- Profiles: one row per auth user
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_updated_at ON public.profiles(updated_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Projects: owned by a profile (must exist before user_owns_project)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects"
  ON public.projects FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Helper: true if current user owns the project (after projects exists)
CREATE OR REPLACE FUNCTION public.user_owns_project(project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Project agents: config per project (e.g. enabled tools)
CREATE TABLE public.project_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  agent_key text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, agent_key)
);

CREATE INDEX idx_project_agents_project_id ON public.project_agents(project_id);

ALTER TABLE public.project_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD project_agents for owned projects"
  ON public.project_agents FOR ALL
  USING (public.user_owns_project(project_id))
  WITH CHECK (public.user_owns_project(project_id));

-- Conversations: threads within a project
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD conversations for owned projects"
  ON public.conversations FOR ALL
  USING (public.user_owns_project(project_id))
  WITH CHECK (public.user_owns_project(project_id));

-- Messages: messages in a conversation
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD messages in owned projects"
  ON public.messages FOR ALL
  USING (
    public.user_owns_project(
      (SELECT project_id FROM public.conversations WHERE id = conversation_id)
    )
  )
  WITH CHECK (
    public.user_owns_project(
      (SELECT project_id FROM public.conversations WHERE id = conversation_id)
    )
  );

-- Project memory: key-value memory per project (user-controlled)
CREATE TABLE public.project_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, key)
);

CREATE INDEX idx_project_memory_project_id ON public.project_memory(project_id);

ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD project_memory for owned projects"
  ON public.project_memory FOR ALL
  USING (public.user_owns_project(project_id))
  WITH CHECK (public.user_owns_project(project_id));

-- Artifacts: notes, plans, summaries per project
CREATE TABLE public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_project_id ON public.artifacts(project_id);
CREATE INDEX idx_artifacts_conversation_id ON public.artifacts(conversation_id);
CREATE INDEX idx_artifacts_updated_at ON public.artifacts(updated_at);

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD artifacts for owned projects"
  ON public.artifacts FOR ALL
  USING (public.user_owns_project(project_id))
  WITH CHECK (public.user_owns_project(project_id));

-- Audit logs: optional audit trail per project or global
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read audit logs for own actions or owned projects"
  ON public.audit_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR (project_id IS NOT NULL AND public.user_owns_project(project_id))
  );

CREATE POLICY "Users can insert audit logs for themselves in owned projects"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

-- No UPDATE or DELETE on audit_logs (append-only)

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_project_agents_updated_at
  BEFORE UPDATE ON public.project_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_project_memory_updated_at
  BEFORE UPDATE ON public.project_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_artifacts_updated_at
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
