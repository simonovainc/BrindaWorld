-- ============================================================
-- 004_learning.sql  –  Pedagogy, skills and assessments
-- BrindaWorld Platform
-- Must run after 001_operational.sql and 003_analytics.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS skills (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  skill_name     VARCHAR(200)  NOT NULL,
  domain         ENUM('math','literacy','stem','chess','geography','creativity','wellness','leadership') NOT NULL,
  age_band_min   TINYINT UNSIGNED NOT NULL DEFAULT 6,
  age_band_max   TINYINT UNSIGNED NOT NULL DEFAULT 14,
  description    TEXT          NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_skills_domain (domain),
  INDEX idx_skills_age_band (age_band_min, age_band_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS skill_dependencies (
  id                     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  prerequisite_skill_id  INT UNSIGNED  NOT NULL,
  dependent_skill_id     INT UNSIGNED  NOT NULL,
  strength               ENUM('required','recommended') NOT NULL DEFAULT 'recommended',
  PRIMARY KEY (id),
  CONSTRAINT fk_skill_dep_prereq    FOREIGN KEY (prerequisite_skill_id) REFERENCES skills (id) ON DELETE CASCADE,
  CONSTRAINT fk_skill_dep_dependent FOREIGN KEY (dependent_skill_id)    REFERENCES skills (id) ON DELETE CASCADE,
  INDEX idx_skill_dep_prereq (prerequisite_skill_id),
  INDEX idx_skill_dep_dependent (dependent_skill_id),
  UNIQUE KEY uq_skill_dep_pair (prerequisite_skill_id, dependent_skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS game_skill_map (
  id       INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  game_id  VARCHAR(50)    NOT NULL,
  skill_id INT UNSIGNED   NOT NULL,
  weight   DECIMAL(3,2)   NOT NULL DEFAULT 1.00,
  notes    VARCHAR(500)   NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_game_skill_map_game  FOREIGN KEY (game_id)  REFERENCES games  (id) ON DELETE CASCADE,
  CONSTRAINT fk_game_skill_map_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE,
  INDEX idx_gsm_game_id (game_id),
  INDEX idx_gsm_skill_id (skill_id),
  UNIQUE KEY uq_gsm_game_skill (game_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS child_skill_progress (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  child_id          INT UNSIGNED   NOT NULL,
  skill_id          INT UNSIGNED   NOT NULL,
  proficiency_level ENUM('novice','beginner','intermediate','advanced','mastered') NOT NULL DEFAULT 'novice',
  confidence_score  DECIMAL(4,3)   NOT NULL DEFAULT 0.000,
  sessions_count    INT UNSIGNED   NOT NULL DEFAULT 0,
  last_updated      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_csp_child_skill (child_id, skill_id),
  CONSTRAINT fk_csp_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  CONSTRAINT fk_csp_skill FOREIGN KEY (skill_id) REFERENCES skills   (id) ON DELETE CASCADE,
  INDEX idx_csp_child_id (child_id),
  INDEX idx_csp_skill_id (skill_id),
  INDEX idx_csp_proficiency (proficiency_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS mastery_milestones (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id             INT UNSIGNED  NOT NULL,
  skill_id             INT UNSIGNED  NOT NULL,
  level_achieved       VARCHAR(50)   NOT NULL,
  achieved_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  evidence_session_id  BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_mm_child   FOREIGN KEY (child_id)            REFERENCES children      (id) ON DELETE CASCADE,
  CONSTRAINT fk_mm_skill   FOREIGN KEY (skill_id)            REFERENCES skills        (id) ON DELETE CASCADE,
  CONSTRAINT fk_mm_session FOREIGN KEY (evidence_session_id) REFERENCES game_sessions (id) ON DELETE SET NULL,
  INDEX idx_mm_child_id (child_id),
  INDEX idx_mm_skill_id (skill_id),
  INDEX idx_mm_achieved_at (achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS skill_progression_events (
  id                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  child_id            INT UNSIGNED   NOT NULL,
  skill_id            INT UNSIGNED   NOT NULL,
  old_level           VARCHAR(50)    NULL,
  new_level           VARCHAR(50)    NOT NULL,
  delta_score         DECIMAL(4,3)   NOT NULL DEFAULT 0.000,
  trigger_session_id  BIGINT UNSIGNED NULL,
  event_time          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_spe_child   FOREIGN KEY (child_id)           REFERENCES children      (id) ON DELETE CASCADE,
  CONSTRAINT fk_spe_skill   FOREIGN KEY (skill_id)           REFERENCES skills        (id) ON DELETE CASCADE,
  CONSTRAINT fk_spe_session FOREIGN KEY (trigger_session_id) REFERENCES game_sessions (id) ON DELETE SET NULL,
  INDEX idx_spe_child_id (child_id),
  INDEX idx_spe_skill_id (skill_id),
  INDEX idx_spe_event_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS assessments (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  title               VARCHAR(300)  NOT NULL,
  skill_id            INT UNSIGNED  NOT NULL,
  age_band_min        TINYINT UNSIGNED NOT NULL DEFAULT 6,
  age_band_max        TINYINT UNSIGNED NOT NULL DEFAULT 14,
  difficulty          TINYINT UNSIGNED NOT NULL DEFAULT 1,
  question_count      TINYINT UNSIGNED NOT NULL DEFAULT 10,
  time_limit_seconds  INT UNSIGNED  NULL,
  premium             TINYINT(1)    NOT NULL DEFAULT 0,
  active              TINYINT(1)    NOT NULL DEFAULT 1,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_assessments_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE,
  INDEX idx_assessments_skill_id (skill_id),
  INDEX idx_assessments_active (active),
  INDEX idx_assessments_age_band (age_band_min, age_band_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS assessment_questions (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  assessment_id   INT UNSIGNED  NOT NULL,
  question_text   TEXT          NOT NULL,
  question_type   ENUM('multiple_choice','true_false','ordering','matching') NOT NULL,
  options         JSON          NOT NULL,
  correct_answer  JSON          NOT NULL,
  points          TINYINT UNSIGNED NOT NULL DEFAULT 1,
  order_num       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_aq_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE,
  INDEX idx_aq_assessment_id (assessment_id),
  INDEX idx_aq_order (assessment_id, order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS assessment_results (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id         INT UNSIGNED  NOT NULL,
  assessment_id    INT UNSIGNED  NOT NULL,
  score            INT UNSIGNED  NOT NULL DEFAULT 0,
  max_score        INT UNSIGNED  NOT NULL DEFAULT 0,
  time_taken_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  passed           TINYINT(1)    NOT NULL DEFAULT 0,
  attempt_number   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  completed_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ar_child      FOREIGN KEY (child_id)      REFERENCES children     (id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_assessment FOREIGN KEY (assessment_id) REFERENCES assessments  (id) ON DELETE CASCADE,
  INDEX idx_ar_child_id (child_id),
  INDEX idx_ar_assessment_id (assessment_id),
  INDEX idx_ar_completed_at (completed_at),
  INDEX idx_ar_passed (passed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS assessment_item_responses (
  id                 INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  result_id          INT UNSIGNED   NOT NULL,
  question_id        INT UNSIGNED   NOT NULL,
  response           JSON           NOT NULL,
  correct            TINYINT(1)     NOT NULL DEFAULT 0,
  points_earned      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  time_taken_seconds INT UNSIGNED   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_air_result   FOREIGN KEY (result_id)   REFERENCES assessment_results    (id) ON DELETE CASCADE,
  CONSTRAINT fk_air_question FOREIGN KEY (question_id) REFERENCES assessment_questions  (id) ON DELETE CASCADE,
  INDEX idx_air_result_id (result_id),
  INDEX idx_air_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS learning_goals (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  set_by_user_id   INT UNSIGNED  NOT NULL,
  child_id         INT UNSIGNED  NOT NULL,
  skill_id         INT UNSIGNED  NOT NULL,
  target_level     VARCHAR(50)   NOT NULL,
  target_date      DATE          NULL,
  status           ENUM('active','achieved','abandoned') NOT NULL DEFAULT 'active',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_lg_user  FOREIGN KEY (set_by_user_id) REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_lg_child FOREIGN KEY (child_id)       REFERENCES children (id) ON DELETE CASCADE,
  CONSTRAINT fk_lg_skill FOREIGN KEY (skill_id)       REFERENCES skills   (id) ON DELETE CASCADE,
  INDEX idx_lg_child_id (child_id),
  INDEX idx_lg_skill_id (skill_id),
  INDEX idx_lg_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS goal_progress (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  goal_id          INT UNSIGNED   NOT NULL,
  recorded_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_level    VARCHAR(50)    NULL,
  progress_percent DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  notes            TEXT           NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_gp_goal FOREIGN KEY (goal_id) REFERENCES learning_goals (id) ON DELETE CASCADE,
  INDEX idx_gp_goal_id (goal_id),
  INDEX idx_gp_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS interventions (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id             INT UNSIGNED  NOT NULL,
  trigger_reason       VARCHAR(100)  NOT NULL,
  intervention_type    ENUM('content_recommendation','difficulty_adjustment','encouragement','parent_alert') NOT NULL,
  assigned_content_id  INT UNSIGNED  NULL,
  outcome              ENUM('engaged','ignored','helped','unhelpful') NULL,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at          DATETIME      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_interventions_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_interventions_child_id (child_id),
  INDEX idx_interventions_type (intervention_type),
  INDEX idx_interventions_outcome (outcome),
  INDEX idx_interventions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS intervention_outcomes (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  intervention_id  INT UNSIGNED   NOT NULL,
  sessions_after   INT UNSIGNED   NOT NULL DEFAULT 0,
  skill_delta      DECIMAL(5,3)   NULL,
  engagement_delta DECIMAL(5,3)   NULL,
  resolved_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes            TEXT           NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_io_intervention FOREIGN KEY (intervention_id) REFERENCES interventions (id) ON DELETE CASCADE,
  INDEX idx_io_intervention_id (intervention_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS adaptive_difficulty_logs (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id        INT UNSIGNED  NOT NULL,
  game_id         VARCHAR(50)   NOT NULL,
  old_difficulty  TINYINT UNSIGNED NOT NULL,
  new_difficulty  TINYINT UNSIGNED NOT NULL,
  trigger_reason  VARCHAR(200)  NOT NULL,
  triggered_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_adl_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_adl_child_id (child_id),
  INDEX idx_adl_game_id (game_id),
  INDEX idx_adl_triggered_at (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS curriculum_alignments (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  game_id                 VARCHAR(50)   NOT NULL,
  province                ENUM('ON','NB','BC','AB','QC','ALL') NOT NULL DEFAULT 'ALL',
  grade_level             VARCHAR(20)   NOT NULL,
  subject                 VARCHAR(100)  NOT NULL,
  curriculum_code         VARCHAR(100)  NULL,
  curriculum_description  TEXT          NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ca_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  INDEX idx_ca_game_id (game_id),
  INDEX idx_ca_province (province),
  INDEX idx_ca_grade (grade_level),
  INDEX idx_ca_subject (subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
