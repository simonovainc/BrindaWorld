-- ============================================================
-- 012_integrity.sql  –  Anti-Cheat and Integrity Scoring System
-- BrindaWorld Platform
-- CMMI L5: signals visible to parents/teachers only, never to child
--
-- Tables: 2 | Running total: 109 tables
--   1. game_sessions        – every play session with integrity score
--   2. integrity_events     – individual flag events for review queue
--
-- Flag code reference (never stored in DB, only in code)
-- ┌─────────────────────┬───────────────────────────────────────────────────┐
-- │ SPEED_ANOMALY       │ Answer submitted in < 500ms consistently           │
-- │ PERFECT_RETRY       │ Wrong → immediate correct answer pattern           │
-- │ LATE_NIGHT          │ Session between 23:00 and 05:00 local time         │
-- │ SCORE_JUMP          │ Score improved > 40 percentile points, 1 session   │
-- │ NEW_DEVICE          │ Session from device type not seen before for child  │
-- │ RAPID_COMPLETION    │ Game completed in < 20% of average time            │
-- └─────────────────────┴───────────────────────────────────────────────────┘
-- ============================================================

-- 1. game_sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id                 INT              NOT NULL AUTO_INCREMENT,
  public_id          VARCHAR(36)      NOT NULL DEFAULT (UUID()),
  child_id           INT              NOT NULL COMMENT 'FK to children.id',
  game_id            VARCHAR(100)     NOT NULL COMMENT 'e.g. chess-beginner, baking-kitchen',
  game_category      VARCHAR(50)      NOT NULL,
  started_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at           TIMESTAMP        NULL,
  duration_seconds   INT              NULL,
  score              INT              NOT NULL DEFAULT 0,
  max_score          INT              NOT NULL DEFAULT 100,
  score_percent      DECIMAL(5,2)     NULL,
  hints_used         INT              NOT NULL DEFAULT 0,
  retries            INT              NOT NULL DEFAULT 0,
  questions_total    INT              NOT NULL DEFAULT 0,
  questions_correct  INT              NOT NULL DEFAULT 0,
  completion_status  ENUM(
                       'completed',
                       'abandoned',
                       'timeout',
                       'error'
                     )                NOT NULL DEFAULT 'completed',
  device_type        VARCHAR(50)      NULL     COMMENT 'mobile/desktop/tablet',
  session_hour       TINYINT UNSIGNED NULL     COMMENT 'Hour of day 0-23 for anomaly detection',
  integrity_score    TINYINT UNSIGNED NOT NULL DEFAULT 100 COMMENT '0-100, computed server-side — never shown to child',
  integrity_flags    JSON             NULL     COMMENT 'Array of flag code strings',
  created_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_public_id (public_id),
  INDEX idx_sessions_child       (child_id),
  INDEX idx_sessions_game        (game_id),
  INDEX idx_sessions_started     (started_at),
  INDEX idx_sessions_integrity   (integrity_score),
  INDEX idx_sessions_category    (game_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='One row per child play session; includes anti-cheat integrity score';

-- 2. integrity_events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrity_events (
  id               INT              NOT NULL AUTO_INCREMENT,
  session_id       INT              NOT NULL COMMENT 'FK to game_sessions.id',
  child_id         INT              NOT NULL COMMENT 'FK to children.id (denormalised for fast queries)',
  flag_code        VARCHAR(50)      NOT NULL,
  flag_description VARCHAR(200)     NOT NULL,
  severity         ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  detected_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by      VARCHAR(100)     NULL     COMMENT 'Parent or teacher who reviewed',
  reviewed_at      TIMESTAMP        NULL,
  review_notes     TEXT             NULL,

  PRIMARY KEY (id),
  INDEX idx_integrity_child   (child_id),
  INDEX idx_integrity_flag    (flag_code),
  INDEX idx_integrity_session (session_id),
  INDEX idx_integrity_severity(severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual integrity flag events — visible to parents/teachers only';
