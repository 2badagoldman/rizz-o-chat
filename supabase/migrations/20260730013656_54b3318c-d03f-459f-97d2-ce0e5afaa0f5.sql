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
numbered AS (
  SELECT id, (row_number() OVER (ORDER BY created_at)) % 12 AS idx, caption
  FROM public.showcase_media
  WHERE caption IS NOT NULL
)
UPDATE public.showcase_media m
SET caption = s.txt,
    original_caption = COALESCE(m.original_caption, m.caption),
    ai_caption_updated_at = now()
FROM numbered n
JOIN safe s ON s.idx = n.idx
WHERE m.id = n.id AND m.caption IS DISTINCT FROM s.txt;