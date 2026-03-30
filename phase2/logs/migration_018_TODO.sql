-- ============================================================
-- MIGRATION 018 — Competitions (enhanced)
-- RUN THIS MANUALLY IN phpMyAdmin.
-- Note: competitions and competition_entries tables may already
-- exist from Phase 1 migration 013. This adds any missing columns.
-- ============================================================

-- Add missing columns to competitions if they exist
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS comp_type ENUM('score','time','streak') DEFAULT 'score',
  ADD COLUMN IF NOT EXISTS game_id VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prize_label VARCHAR(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS class_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS teacher_id INT DEFAULT NULL;

-- Competition scores (per-child leaderboard entries from game sessions)
CREATE TABLE IF NOT EXISTS competition_scores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  competition_id  INT NOT NULL,
  child_id        INT NOT NULL,
  score           INT DEFAULT 0,
  best_time       INT DEFAULT NULL,
  streak          INT DEFAULT 0,
  submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE KEY uq_comp_child (competition_id, child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
