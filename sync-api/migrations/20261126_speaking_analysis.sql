-- Additive: no changes to tomeng_cloud_state or learning-progress schema.
CREATE TABLE IF NOT EXISTS public.tomeng_speaking_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  request_key uuid NOT NULL,
  phrase_id text NOT NULL CHECK (phrase_id ~ '^p[0-9]{3,4}$'),
  transcript text NOT NULL CHECK (char_length(transcript) BETWEEN 1 AND 600),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  result jsonb,
  error_code text,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT result_only_when_done CHECK ((status = 'done') = (result IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS tomeng_speaking_analysis_idempotent
  ON public.tomeng_speaking_analysis (user_id, request_key);
CREATE INDEX IF NOT EXISTS tomeng_speaking_analysis_owner_created
  ON public.tomeng_speaking_analysis (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tomeng_speaking_analysis_pending
  ON public.tomeng_speaking_analysis (created_at)
  WHERE status = 'pending';
