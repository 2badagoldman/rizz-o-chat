UPDATE public.showcase_media AS m
SET caption = v.caption,
    original_caption = COALESCE(m.original_caption, m.caption),
    ai_caption_updated_at = now()
FROM (VALUES
  ('b542dafd-f36b-4785-9b5b-ececd4ee316e'::uuid, 'Slide into my inbox and show off 😏'),
  ('4e535500-ab6b-4ec2-82c2-432f53f23bcc'::uuid, 'Do not be shy, say hi to me ✨'),
  ('97859241-93f7-4362-a878-670ef31683aa'::uuid, 'Take a peek at what you are missing 👀'),
  ('773eb3ec-778d-452d-9386-fde22f62191f'::uuid, 'Join my inner circle tonight, babe 👑'),
  ('9ffef6a9-8e9b-4650-8735-a9739bd44e89'::uuid, 'Ready to chat with your favorite girl? 💬'),
  ('ec3d5c42-c766-4acc-91b1-762dcc6a7341'::uuid, 'Whisper a secret just for my ears 💋'),
  ('923b6651-8174-42e5-be5b-6e5c8abc6618'::uuid, 'Unlock my private side right here 🗝️'),
  ('898d250d-0dbd-4215-b13c-9a301cb73fe7'::uuid, 'Tap below to turn up the heat 🔥'),
  ('6d8188d8-b7e8-41ac-8980-cc634e6c4c2b'::uuid, 'Step inside my world if you dare 🖤'),
  ('8d56eacd-a270-40c2-8c32-26f6a85fd2d8'::uuid, 'Text me first and make an impression 💅'),
  ('f5e36479-0f4a-44f6-8ad1-8f3fc56dc02b'::uuid, 'Message me to see if you can keep up 💌'),
  ('0566aa2c-c541-4754-b763-82b4181bd8fb'::uuid, 'Flirt a little behind closed doors 🌶️'),
  ('a07d803c-fcc8-40af-bee1-b1ca47e0a1bd'::uuid, 'Catch my attention if you can 😉'),
  ('0cb7af47-773e-4588-9809-73920e2e448e'::uuid, 'Drop in for a late night conversation 🍸'),
  ('33222edb-a1f8-4f35-81b8-72b922d0c235'::uuid, 'Come closer and find out more 🌹'),
  ('0be4bd6d-eee3-4cae-90c0-53d7ee22602f'::uuid, 'Hang out where the real fun starts 🥂'),
  ('dc8acbd4-40c8-423b-9271-370d899a1922'::uuid, 'Venture closer, I promise I am sweet 💫'),
  ('b7d4bfa2-cdee-4d9a-89ea-4dce891b726c'::uuid, 'Slip into my inbox with a good line 😈'),
  ('c17c9709-10fd-4902-ab0d-38212245fb43'::uuid, 'Vibe with me under the night lights 🌙'),
  ('486e80ff-4d25-4e05-95c3-504037409b62'::uuid, 'Discover what I hide from the rest 🔮'),
  ('4ba2c358-4e0d-472f-9a9f-981bb7c946d7'::uuid, 'Meet me where all the best secrets live 🎀'),
  ('43b5008d-7b28-41c6-90e5-7469617ce160'::uuid, 'Request access and spark something new ⚡'),
  ('a0bd922c-586c-4755-8ba2-5349464bb490'::uuid, 'Claim your VIP spot before it fills up 💎'),
  ('cacd152a-c5bf-448f-985b-7a7da7221370'::uuid, 'Ping me your best line right now 🍒'),
  ('55dc8f81-e883-4714-a872-dc27785523ad'::uuid, 'Spill your thoughts to me in private 🙈')
) AS v(id, caption)
WHERE m.id = v.id;

-- Broaden reel: pick from top-20 candidates by score, then weighted-random shuffle
CREATE OR REPLACE FUNCTION public.get_showcase_reel(_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, caption text, media_type text, storage_path text, score real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH scored AS (
    SELECT
      m.id,
      m.caption,
      m.media_type::text AS media_type,
      m.storage_path,
      GREATEST(0.05,
        m.ai_score
        + LEAST(0.4, m.completes::real / NULLIF(m.impressions,0)::real)
        - LEAST(0.4, m.dismisses::real / NULLIF(m.impressions,0)::real)
      )::real AS score
    FROM public.showcase_media m
    WHERE m.is_active = true
  ),
  pool AS (
    SELECT * FROM scored ORDER BY score DESC LIMIT 40
  )
  SELECT id, caption, media_type, storage_path, score
  FROM pool
  ORDER BY (score * (0.5 + random())) DESC
  LIMIT GREATEST(1, _limit);
$function$;