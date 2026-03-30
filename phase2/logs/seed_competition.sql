-- ============================================================
-- SEED DATA — Spring Chess Championship
-- RUN THIS MANUALLY IN phpMyAdmin after migration 018.
-- ============================================================

INSERT INTO competitions (public_id, title, description, competition_type, age_band, starts_at, ends_at, prize_description, status)
VALUES (
  UUID(),
  'Spring Chess Championship 🌸',
  'Show off your chess skills and compete for the Spring Champion Badge!',
  'score',
  'all',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  'Spring Champion Badge',
  'active'
);
