-- Add admin flag and RLS policies so is_admin users have full read/write access.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: admins can read all
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Projects: admins can do everything
DROP POLICY IF EXISTS "Users can CRUD own projects" ON public.projects;
CREATE POLICY "Users can CRUD own projects"
  ON public.projects FOR ALL
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can CRUD project_agents for owned projects" ON public.project_agents;
CREATE POLICY "Users can CRUD project_agents for owned projects"
  ON public.project_agents FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can CRUD conversations for owned projects" ON public.conversations;
CREATE POLICY "Users can CRUD conversations for owned projects"
  ON public.conversations FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can CRUD messages in owned projects" ON public.messages;
CREATE POLICY "Users can CRUD messages in owned projects"
  ON public.messages FOR ALL
  USING (
    public.user_owns_project((SELECT project_id FROM public.conversations WHERE id = conversation_id))
    OR public.is_admin()
  )
  WITH CHECK (
    public.user_owns_project((SELECT project_id FROM public.conversations WHERE id = conversation_id))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can CRUD project_memory for owned projects" ON public.project_memory;
CREATE POLICY "Users can CRUD project_memory for owned projects"
  ON public.project_memory FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can CRUD artifacts for owned projects" ON public.artifacts;
CREATE POLICY "Users can CRUD artifacts for owned projects"
  ON public.artifacts FOR ALL
  USING (public.user_owns_project(project_id) OR public.is_admin())
  WITH CHECK (public.user_owns_project(project_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can read audit logs for own actions or owned projects" ON public.audit_logs;
CREATE POLICY "Users can read audit logs for own actions or owned projects"
  ON public.audit_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR (project_id IS NOT NULL AND public.user_owns_project(project_id))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert audit logs for themselves in owned projects" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs for themselves in owned projects"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND (project_id IS NULL OR public.user_owns_project(project_id)))
    OR public.is_admin()
  );
