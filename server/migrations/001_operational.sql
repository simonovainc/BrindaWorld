-- ============================================================
-- 001_operational.sql  –  Core application tables
-- BrindaWorld Platform
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  email            VARCHAR(255)     NOT NULL,
  password_hash    VARCHAR(255)     NULL,
  role             ENUM('parent','teacher','admin') NOT NULL DEFAULT 'parent',
  first_name       VARCHAR(100)     NULL,
  last_name        VARCHAR(100)     NULL,
  country          VARCHAR(10)      NULL,
  language_code    VARCHAR(10)      NULL,
  email_verified   TINYINT(1)       NOT NULL DEFAULT 0,
  created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at    DATETIME         NULL,
  deleted_at       DATETIME         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_deleted_at (deleted_at),
  INDEX idx_users_country (country),
  INDEX idx_users_language_code (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS children (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  parent_user_id   INT UNSIGNED     NOT NULL,
  name             VARCHAR(100)     NOT NULL,
  age              TINYINT UNSIGNED NULL,
  avatar           VARCHAR(255)     NULL,
  language_code    VARCHAR(10)      NULL,
  created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       DATETIME         NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_children_parent FOREIGN KEY (parent_user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_children_parent_user_id (parent_user_id),
  INDEX idx_children_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS subscriptions (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id                 INT UNSIGNED  NOT NULL,
  plan_type               ENUM('free','premium','school') NOT NULL DEFAULT 'free',
  status                  ENUM('active','cancelled','expired','trialing') NOT NULL DEFAULT 'trialing',
  stripe_subscription_id  VARCHAR(255)  NULL,
  stripe_customer_id      VARCHAR(255)  NULL,
  current_period_start    DATETIME      NULL,
  current_period_end      DATETIME      NULL,
  cancelled_at            DATETIME      NULL,
  cancel_reason           VARCHAR(500)  NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_subscriptions_user_id (user_id),
  INDEX idx_subscriptions_status (status),
  INDEX idx_subscriptions_stripe_sub (stripe_subscription_id),
  INDEX idx_subscriptions_stripe_cust (stripe_customer_id),
  INDEX idx_subscriptions_period_end (current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS teacher_classes (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  teacher_user_id  INT UNSIGNED     NOT NULL,
  class_name       VARCHAR(200)     NOT NULL,
  grade_level      VARCHAR(50)      NULL,
  school_name      VARCHAR(200)     NULL,
  school_board     VARCHAR(200)     NULL,
  province         VARCHAR(10)      NULL,
  class_code       VARCHAR(20)      NOT NULL,
  active           TINYINT(1)       NOT NULL DEFAULT 1,
  created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teacher_classes_code (class_code),
  CONSTRAINT fk_teacher_classes_teacher FOREIGN KEY (teacher_user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_teacher_classes_teacher (teacher_user_id),
  INDEX idx_teacher_classes_province (province),
  INDEX idx_teacher_classes_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS game_scores (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id             INT UNSIGNED  NOT NULL,
  game_id              VARCHAR(50)   NOT NULL,
  score                INT           NOT NULL DEFAULT 0,
  level_reached        INT           NOT NULL DEFAULT 1,
  time_spent_seconds   INT UNSIGNED  NOT NULL DEFAULT 0,
  completed            TINYINT(1)    NOT NULL DEFAULT 0,
  played_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_game_scores_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_game_scores_child_id (child_id),
  INDEX idx_game_scores_game_id (game_id),
  INDEX idx_game_scores_played_at (played_at),
  INDEX idx_game_scores_child_game (child_id, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS badges (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id     INT UNSIGNED  NOT NULL,
  badge_type   VARCHAR(50)   NOT NULL,
  badge_name   VARCHAR(200)  NOT NULL,
  earned_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  xp_awarded   INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_badges_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_badges_child_id (child_id),
  INDEX idx_badges_badge_type (badge_type),
  INDEX idx_badges_earned_at (earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS mood_logs (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id    INT UNSIGNED  NOT NULL,
  mood_type   ENUM('amazing','happy','okay','sad','worried') NOT NULL,
  logged_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes       TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_mood_logs_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_mood_logs_child_id (child_id),
  INDEX idx_mood_logs_logged_at (logged_at),
  INDEX idx_mood_logs_mood_type (mood_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS language_preferences (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED  NOT NULL,
  child_id         INT UNSIGNED  NULL,
  language_code    VARCHAR(10)   NOT NULL,
  detected_country VARCHAR(10)   NULL,
  detected_region  VARCHAR(100)  NULL,
  manually_set     TINYINT(1)    NOT NULL DEFAULT 0,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_lang_prefs_user  FOREIGN KEY (user_id)  REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_lang_prefs_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_lang_prefs_user_id (user_id),
  INDEX idx_lang_prefs_child_id (child_id),
  INDEX idx_lang_prefs_language_code (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS favourites (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id    INT UNSIGNED  NOT NULL,
  game_id     VARCHAR(50)   NOT NULL,
  pinned_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_favourites_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_favourites_child_id (child_id),
  INDEX idx_favourites_game_id (game_id),
  UNIQUE KEY uq_favourites_child_game (child_id, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS certificates (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id           INT UNSIGNED  NOT NULL,
  certificate_type   VARCHAR(100)  NOT NULL,
  assessment_id      INT UNSIGNED  NULL,
  issued_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verification_code  VARCHAR(100)  NOT NULL,
  premium            TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_certificates_verification_code (verification_code),
  CONSTRAINT fk_certificates_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_certificates_child_id (child_id),
  INDEX idx_certificates_assessment_id (assessment_id),
  INDEX idx_certificates_issued_at (issued_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS referrals (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  referrer_user_id   INT UNSIGNED  NOT NULL,
  referred_email     VARCHAR(255)  NOT NULL,
  referred_user_id   INT UNSIGNED  NULL,
  referral_code      VARCHAR(50)   NOT NULL,
  converted          TINYINT(1)    NOT NULL DEFAULT 0,
  rewarded           TINYINT(1)    NOT NULL DEFAULT 0,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referrals_code (referral_code),
  CONSTRAINT fk_referrals_referrer  FOREIGN KEY (referrer_user_id)  REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_referrals_referred  FOREIGN KEY (referred_user_id)  REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_referrals_referrer (referrer_user_id),
  INDEX idx_referrals_referred_user (referred_user_id),
  INDEX idx_referrals_converted (converted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS offers (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  code             VARCHAR(50)      NOT NULL,
  discount_percent DECIMAL(5,2)     NULL,
  discount_amount  INT UNSIGNED     NULL,
  valid_from       DATETIME         NOT NULL,
  valid_to         DATETIME         NOT NULL,
  max_uses         INT UNSIGNED     NULL,
  uses_count       INT UNSIGNED     NOT NULL DEFAULT 0,
  plan_type        ENUM('free','premium','school') NULL,
  created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offers_code (code),
  INDEX idx_offers_valid_from (valid_from),
  INDEX idx_offers_valid_to (valid_to),
  INDEX idx_offers_plan_type (plan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
