-- ============================================================
-- 011_feedback.sql  –  User Feedback & Service Requests
-- BrindaWorld Platform
--
-- Stores all inbound feedback from authenticated users:
--   bug reports, feature suggestions, complaints, praise,
--   general questions, and service match requests.
--
-- Columns of note
--   public_id         – UUID exposed externally (never numeric id)
--   feedback_type     – drives routing and auto-response logic
--   service_requested – populated for service_request type only
--   priority          – 'high' auto-set for complaints
--   assigned_to       – default 'VN' (Veronica N., support lead)
--   auto_response_sent– tracks whether 48-hr auto-reply was sent
--
-- 011_feedback.sql: 1 table | Running total: 107 tables
-- ============================================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id                    INT              NOT NULL AUTO_INCREMENT,
  public_id             VARCHAR(36)      NOT NULL DEFAULT (UUID()),
  user_id               INT              NOT NULL,
  feedback_type         ENUM(
                          'bug',
                          'suggestion',
                          'complaint',
                          'praise',
                          'question',
                          'service_request'
                        )                NOT NULL,
  subject               VARCHAR(200)     NOT NULL,
  body                  TEXT             NOT NULL,
  service_requested     VARCHAR(200)     NULL     COMMENT 'For service_request type only',
  priority              ENUM(
                          'low',
                          'medium',
                          'high',
                          'urgent'
                        )                NOT NULL DEFAULT 'medium',
  status                ENUM(
                          'new',
                          'assigned',
                          'in_progress',
                          'resolved',
                          'closed'
                        )                NOT NULL DEFAULT 'new',
  assigned_to           VARCHAR(100)     NOT NULL DEFAULT 'VN',
  resolution_notes      TEXT             NULL,
  auto_response_sent    TINYINT(1)       NOT NULL DEFAULT 0,
  created_at            TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at           TIMESTAMP        NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_feedback_public_id (public_id),
  INDEX idx_feedback_user       (user_id),
  INDEX idx_feedback_status     (status),
  INDEX idx_feedback_type       (feedback_type),
  INDEX idx_feedback_assigned   (assigned_to),
  INDEX idx_feedback_priority   (priority),
  INDEX idx_feedback_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='User feedback, bug reports, and service match requests';
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
-- ============================================================
-- 013_competitions.sql  –  Group Competitions System
-- BrindaWorld Platform
-- CMMI L5: age-banded, school-safe, COPPA compliant (first names only)
--
-- Tables: 3 | Running total: 112 tables
--   1. competitions              – tournament definitions
--   2. competition_entries       – child entry + running score
--   3. competition_leaderboard   – public-safe ranked view (first name + last initial only)
-- ============================================================

-- 1. competitions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitions (
  id                 INT              NOT NULL AUTO_INCREMENT,
  public_id          VARCHAR(36)      NOT NULL DEFAULT (UUID()),
  title              VARCHAR(200)     NOT NULL,
  description        TEXT             NULL,
  competition_type   ENUM(
                       'weekly_chess',
                       'class_tournament',
                       'monthly_grand_prix',
                       'custom'
                     )                NOT NULL,
  age_band           ENUM('6-8','9-11','12-14','all') NOT NULL DEFAULT 'all',
  game_category      VARCHAR(50)      NULL     COMMENT 'NULL = all categories',
  created_by         INT              NULL     COMMENT 'FK to users.id — NULL = system-created',
  scope              ENUM('global','province','school','class') NOT NULL DEFAULT 'global',
  province_code      VARCHAR(10)      NULL,
  school_code        VARCHAR(100)     NULL,
  starts_at          TIMESTAMP        NOT NULL,
  ends_at            TIMESTAMP        NOT NULL,
  status             ENUM(
                       'upcoming',
                       'active',
                       'ended',
                       'cancelled'
                     )                NOT NULL DEFAULT 'upcoming',
  max_participants   INT              NULL,
  prize_description  VARCHAR(200)     NULL     COMMENT 'e.g. Digital Trophy + Certificate',
  created_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_competitions_public_id (public_id),
  INDEX idx_comp_status   (status),
  INDEX idx_comp_type     (competition_type),
  INDEX idx_comp_age      (age_band),
  INDEX idx_comp_dates    (starts_at, ends_at),
  INDEX idx_comp_scope    (scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Competition / tournament definitions — one row per event';

-- 2. competition_entries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competition_entries (
  id                 INT              NOT NULL AUTO_INCREMENT,
  competition_id     INT              NOT NULL,
  child_id           INT              NOT NULL,
  entered_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_score        INT              NOT NULL DEFAULT 0,
  sessions_count     INT              NOT NULL DEFAULT 0,
  rank               INT              NULL     COMMENT 'Computed at end of competition',
  badge_awarded      VARCHAR(100)     NULL,
  certificate_issued TINYINT(1)       NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  UNIQUE KEY uq_entry (competition_id, child_id),
  INDEX idx_entry_comp  (competition_id),
  INDEX idx_entry_child (child_id),
  INDEX idx_entry_score (total_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='One row per child per competition; tracks cumulative score and rank';

-- 3. competition_leaderboard ───────────────────────────────────────────────────
-- COPPA: display_name = first name + last initial only. No full names. No parent info.
CREATE TABLE IF NOT EXISTS competition_leaderboard (
  id                 INT              NOT NULL AUTO_INCREMENT,
  competition_id     INT              NOT NULL,
  child_id           INT              NOT NULL,
  display_name       VARCHAR(100)     NOT NULL COMMENT 'First name + last initial only — COPPA compliant',
  province_code      VARCHAR(10)      NULL,
  score              INT              NOT NULL DEFAULT 0,
  rank               INT              NOT NULL,
  updated_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_leaderboard (competition_id, child_id),
  INDEX idx_lb_comp_rank (competition_id, rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Public-safe leaderboard — first name + last initial only per COPPA';

-- ── Seed: first system competitions ───────────────────────────────────────────
INSERT IGNORE INTO competitions
  (title, description, competition_type, age_band, starts_at, ends_at, status, prize_description)
VALUES
  (
    'Weekly Chess Challenge — Week 1',
    'Compete against girls your age in chess puzzles. Top 3 win a digital trophy!',
    'weekly_chess', '9-11',
    NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active',
    'Digital Trophy Badge + Printable Certificate'
  ),
  (
    'Monthly Grand Prix — March 2026',
    'Earn points across all games this month. The all-round champion wins!',
    'monthly_grand_prix', 'all',
    '2026-03-01 00:00:00', '2026-03-31 23:59:59', 'active',
    'Champion Crown Badge + Featured on Homepage'
  );
