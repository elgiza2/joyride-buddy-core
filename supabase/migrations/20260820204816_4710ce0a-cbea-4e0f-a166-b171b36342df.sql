CREATE TABLE public.music_bot_state (
  id text PRIMARY KEY DEFAULT 'default',
  autopost_enabled boolean NOT NULL DEFAULT false,
  day_index integer NOT NULL DEFAULT 0,
  last_post_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.music_channel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_index integer NOT NULL,
  title text NOT NULL,
  message_id bigint,
  image_url text,
  posted_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.music_bot_state TO service_role;
GRANT ALL ON public.music_channel_posts TO service_role;

ALTER TABLE public.music_bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_channel_posts ENABLE ROW LEVEL SECURITY;

INSERT INTO public.music_bot_state (id) VALUES ('default');