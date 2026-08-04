SELECT cron.unschedule('crush-ops-managers');
SELECT cron.schedule(
  'crush-ops-managers',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--ff766acd-3197-49c5-9028-9b3a0c8d20eb.lovable.app/api/public/hooks/ops-managers',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "92af6d826f292007ab501c2cf29ce0f687b3ece2027791a7fed2a7306a4c053b"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);