-- Show which meeting a task came from (e.g. Granola import).
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS source_meeting_label text;
COMMENT ON COLUMN public.tasks.source_meeting_label IS 'Display label for the meeting this task came from (e.g. Granola meeting title + date).';
