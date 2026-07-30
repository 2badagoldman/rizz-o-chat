-- Compliance: replace suggestive Welcome Showcase captions with friendly, non-sexual copy.
WITH safe(idx, txt) AS (
  VALUES
    (0, 'Say hi and start a real conversation 💬'),
    (1, 'New here? Come meet the group ✨'),
    (2, 'Good chats, good people — join in 🙌'),
    (3, 'Tell me about your day ☀️'),
    (4, 'Looking for someone to talk to? 💬'),
    (5, 'Join the conversation, no pressure 🌿'),
    (6, 'Friendly faces, real talk 💫'),
    (7, 'Come say hello to the community 👋'),
    (8, 'Chat about music, food, life 🎧'),
    (9, 'Start with a hello — that''s it 💬'),
    (10, 'Meet people who actually reply ✨'),
    (11, 'Bring your questions, we''ll bring the banter 😊')
),
flagged AS (
  SELECT id, (('x' || substr(md5(id::text), 1, 8))::bit(32)::bigint % 12) AS idx
  FROM public.showcase_media
  WHERE caption IS NOT NULL
    AND (
      caption ~* '(private side|behind closed doors|heat|spicy|naughty|tease|seduct|sexy|sensual|flirt|babe|bikini|lingerie|curves|bedroom|after dark|late night|keep up|come closer|whisper|slide into|show off|favorite girl|real fun|dirty|hot)'
      OR caption ~ '(💋|😏|🔥|🌶|🍑|🍆|😈|👅|🥵|💦|🍸|🥂)'
    )
)
UPDATE public.showcase_media m
SET caption = s.txt,
    original_caption = COALESCE(m.original_caption, m.caption),
    ai_caption_updated_at = now()
FROM flagged f
JOIN safe s ON s.idx = abs(f.idx)
WHERE m.id = f.id;