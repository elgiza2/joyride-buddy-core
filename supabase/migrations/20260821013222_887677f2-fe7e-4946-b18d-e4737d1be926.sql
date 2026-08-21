CREATE TABLE IF NOT EXISTS public.music_deepai_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key text NOT NULL UNIQUE,
  label text,
  active boolean NOT NULL DEFAULT true,
  disabled_reason text,
  calls integer NOT NULL DEFAULT 0,
  failures integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.music_deepai_keys TO service_role;
ALTER TABLE public.music_deepai_keys ENABLE ROW LEVEL SECURITY;