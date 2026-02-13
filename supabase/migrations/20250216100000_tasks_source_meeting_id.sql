-- Link tasks to Granola meeting so we can open full context from the task.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS source_meeting_id text;
COMMENT ON COLUMN public.tasks.source_meeting_id IS 'Granola document id so we can link to the meeting transcript/summary.';
