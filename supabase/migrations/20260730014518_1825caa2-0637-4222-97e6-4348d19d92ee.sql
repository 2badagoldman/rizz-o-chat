ALTER TABLE public.host_rooms
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS co_hosts text[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS host_rooms_slug_key ON public.host_rooms (slug) WHERE slug IS NOT NULL;

ALTER TABLE public.room_messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS ai_host_id text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'room_messages_author_present') THEN
    ALTER TABLE public.room_messages
      ADD CONSTRAINT room_messages_author_present CHECK (sender_id IS NOT NULL OR ai_host_id IS NOT NULL);
  END IF;
END $$;

INSERT INTO public.host_rooms (host_id, name, description, is_public, category, city, state, lat, lng, slug, emoji, is_official, co_hosts)
SELECT '4328fae5-6998-4f8f-950b-cd0b18458c64'::uuid, v.name, v.tagline, true, v.category, v.city, v.state, v.lat, v.lng, v.slug, v.emoji, true, ARRAY['demo-cleo','demo-remy','demo-lena']
FROM (VALUES
  ('trending-tonight','Trending Tonight','The room everyone''s talking about','Trending','✨',NULL,NULL,NULL::double precision,NULL::double precision),
  ('coffee-chat','Coffee Chat','Slow conversations, good company','Conversation','☕',NULL,NULL,NULL,NULL),
  ('icebreakers','Icebreakers','Games, questions, easy hellos','Conversation','🎲',NULL,NULL,NULL,NULL),
  ('evening-unwind','Evening Unwind','Wind down and talk about your day','Evening','🌙',NULL,NULL,NULL,NULL),
  ('party-line','Party Line','Music, memes, mayhem','Party','🎉',NULL,NULL,NULL,NULL),
  ('music-room','Music Room','Share what you''re listening to','Conversation','🎧',NULL,NULL,NULL,NULL),
  ('dallas','Dallas Nights','Big-D hellos and Deep Ellum crew','Local','🤠','Dallas','TX',32.7767,-96.7970),
  ('houston','H-Town Lounge','Space City vibes, midtown mingle','Local','🚀','Houston','TX',29.7604,-95.3698),
  ('austin','Austin Live Music Room','6th Street energy, keep it weird','Local','🎸','Austin','TX',30.2672,-97.7431),
  ('atlanta','Atlanta ATL Room','Peach State, good takes','Local','🍑','Atlanta','GA',33.7490,-84.3880),
  ('miami','Miami Nights','South Beach sunshine crew','Local','🌴','Miami','FL',25.7617,-80.1918),
  ('nyc','NYC Night Owls','5-boro chat, always on','Local','🗽','New York','NY',40.7128,-74.0060),
  ('la','LA Sunset Room','Sunset Blvd. moods','Local','🌇','Los Angeles','CA',34.0522,-118.2437),
  ('sf','SF Bay Circle','Bay Area chill','Local','🌉','San Francisco','CA',37.7749,-122.4194),
  ('chicago','Chicago Loop Chat','Windy city warmth','Local','🌆','Chicago','IL',41.8781,-87.6298),
  ('vegas','Vegas Neon Room','Neon lights, night owls','Local','🎰','Las Vegas','NV',36.1699,-115.1398),
  ('phoenix','Phoenix Desert Room','AZ heat, cool vibes','Local','🌵','Phoenix','AZ',33.4484,-112.0740),
  ('denver','Denver Mile-High','Rocky Mountain hellos','Local','🏔️','Denver','CO',39.7392,-104.9903),
  ('seattle','Seattle Rain Chat','Rainy day coffee talk','Local','☔','Seattle','WA',47.6062,-122.3321),
  ('dc','DC Capitol Circle','Beltway banter, off the record','Local','🏛️','Washington','DC',38.9072,-77.0369),
  ('boston','Boston Common Room','Beantown banter','Local','⚓','Boston','MA',42.3601,-71.0589),
  ('philly','Philly Row Chat','Rowhome regulars','Local','🔔','Philadelphia','PA',39.9526,-75.1652),
  ('sd','San Diego Sunset','PCH & palm trees','Local','🏄','San Diego','CA',32.7157,-117.1611),
  ('orlando','Orlando Magic Room','Theme-park kids grown up','Local','🎢','Orlando','FL',28.5383,-81.3792),
  ('nashville','Nashville Honky Room','Music Row jam session','Local','🎶','Nashville','TN',36.1627,-86.7816),
  ('detroit','Detroit Motor Room','Motor City moods','Local','🚗','Detroit','MI',42.3314,-83.0458)
) AS v(slug,name,tagline,category,emoji,city,state,lat,lng)
WHERE NOT EXISTS (SELECT 1 FROM public.host_rooms hr WHERE hr.slug = v.slug);