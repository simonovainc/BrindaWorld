-- ============================================================
-- 003_analytics.sql  –  Growth and product analytics
-- BrindaWorld Platform
-- Must run after 001_operational.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS games (
  id               VARCHAR(50)   NOT NULL,
  name             VARCHAR(200)  NOT NULL,
  category         VARCHAR(100)  NULL,
  age_min          TINYINT UNSIGNED NOT NULL DEFAULT 6,
  age_max          TINYINT UNSIGNED NOT NULL DEFAULT 14,
  difficulty       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  curriculum_on    TEXT          NULL,
  curriculum_nb    TEXT          NULL,
  language_support JSON          NULL,
  active           TINYINT(1)    NOT NULL DEFAULT 1,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_games_category (category),
  INDEX idx_games_active (active),
  INDEX idx_games_age (age_min, age_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS game_sessions (
  id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id            INT UNSIGNED     NOT NULL,
  game_id             VARCHAR(50)      NOT NULL,
  started_at          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at            DATETIME         NULL,
  duration_seconds    INT UNSIGNED     NOT NULL DEFAULT 0,
  completion_status   ENUM('completed','abandoned','timed_out') NOT NULL DEFAULT 'abandoned',
  level_reached       INT              NOT NULL DEFAULT 1,
  score               INT              NOT NULL DEFAULT 0,
  hints_used          INT UNSIGNED     NOT NULL DEFAULT 0,
  retries             INT UNSIGNED     NOT NULL DEFAULT 0,
  device_type         VARCHAR(50)      NULL,
  browser             VARCHAR(100)     NULL,
  language_code       VARCHAR(10)      NULL,
  ip_country          VARCHAR(10)      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_game_sessions_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  CONSTRAINT fk_game_sessions_game  FOREIGN KEY (game_id)  REFERENCES games    (id) ON DELETE CASCADE,
  INDEX idx_game_sessions_child_id (child_id),
  INDEX idx_game_sessions_game_id (game_id),
  INDEX idx_game_sessions_started_at (started_at),
  INDEX idx_game_sessions_status (completion_status),
  INDEX idx_game_sessions_child_game (child_id, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS game_events (
  id             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  session_id     BIGINT UNSIGNED  NOT NULL,
  event_type     VARCHAR(50)      NOT NULL,
  event_time     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_payload  JSON             NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_game_events_session FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
  INDEX idx_game_events_session_id (session_id),
  INDEX idx_game_events_event_type (event_type),
  INDEX idx_game_events_event_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS daily_user_metrics (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id          INT UNSIGNED  NOT NULL,
  date              DATE          NOT NULL,
  sessions_count    INT UNSIGNED  NOT NULL DEFAULT 0,
  total_minutes     INT UNSIGNED  NOT NULL DEFAULT 0,
  games_completed   INT UNSIGNED  NOT NULL DEFAULT 0,
  badges_earned     INT UNSIGNED  NOT NULL DEFAULT 0,
  streak_days       INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_daily_metrics_child_date (child_id, date),
  CONSTRAINT fk_daily_metrics_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_daily_metrics_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS device_sessions (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED  NOT NULL,
  session_token  VARCHAR(255)  NOT NULL,
  device_type    VARCHAR(50)   NULL,
  browser        VARCHAR(100)  NULL,
  os             VARCHAR(100)  NULL,
  language_code  VARCHAR(10)   NULL,
  country        VARCHAR(10)   NULL,
  started_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at       DATETIME      NULL,
  pages_viewed   INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_device_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_device_sessions_user_id (user_id),
  INDEX idx_device_sessions_started_at (started_at),
  INDEX idx_device_sessions_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS signup_attribution (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id               INT UNSIGNED  NOT NULL,
  first_touch_source    VARCHAR(100)  NULL,
  first_touch_medium    VARCHAR(100)  NULL,
  first_touch_campaign  VARCHAR(200)  NULL,
  last_touch_source     VARCHAR(100)  NULL,
  last_touch_campaign   VARCHAR(200)  NULL,
  referral_code         VARCHAR(50)   NULL,
  utm_params            JSON          NULL,
  signed_up_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_signup_attr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_signup_attr_user_id (user_id),
  INDEX idx_signup_attr_source (first_touch_source),
  INDEX idx_signup_attr_signed_up (signed_up_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS funnel_events (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED     NOT NULL,
  funnel_name  VARCHAR(100)     NOT NULL,
  stage_name   VARCHAR(100)     NOT NULL,
  event_time   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  properties   JSON             NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_funnel_events_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_funnel_events_user_id (user_id),
  INDEX idx_funnel_events_funnel (funnel_name),
  INDEX idx_funnel_events_stage (stage_name),
  INDEX idx_funnel_events_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS email_campaigns (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  mailchimp_campaign_id VARCHAR(100)  NULL,
  name                  VARCHAR(200)  NOT NULL,
  subject               VARCHAR(500)  NOT NULL,
  sent_at               DATETIME      NULL,
  recipients_count      INT UNSIGNED  NOT NULL DEFAULT 0,
  opens_count           INT UNSIGNED  NOT NULL DEFAULT 0,
  clicks_count          INT UNSIGNED  NOT NULL DEFAULT 0,
  unsubscribes_count    INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_email_campaigns_sent_at (sent_at),
  INDEX idx_email_campaigns_mailchimp (mailchimp_campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS email_engagement (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED     NOT NULL,
  campaign_id  INT UNSIGNED     NOT NULL,
  event_type   ENUM('sent','opened','clicked','unsubscribed','bounced') NOT NULL,
  event_time   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  link_url     VARCHAR(2000)    NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_email_eng_user     FOREIGN KEY (user_id)     REFERENCES users           (id) ON DELETE CASCADE,
  CONSTRAINT fk_email_eng_campaign FOREIGN KEY (campaign_id) REFERENCES email_campaigns (id) ON DELETE CASCADE,
  INDEX idx_email_eng_user_id (user_id),
  INDEX idx_email_eng_campaign_id (campaign_id),
  INDEX idx_email_eng_event_type (event_type),
  INDEX idx_email_eng_event_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS payments (
  id                        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id                   INT UNSIGNED  NOT NULL,
  subscription_id           INT UNSIGNED  NULL,
  stripe_payment_intent_id  VARCHAR(255)  NULL,
  amount_cents              INT UNSIGNED  NOT NULL DEFAULT 0,
  currency                  VARCHAR(10)   NOT NULL DEFAULT 'cad',
  status                    ENUM('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at                   DATETIME      NULL,
  refunded_at               DATETIME      NULL,
  refund_reason             VARCHAR(500)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_payments_user         FOREIGN KEY (user_id)         REFERENCES users          (id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions  (id) ON DELETE SET NULL,
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_subscription_id (subscription_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_paid_at (paid_at),
  INDEX idx_payments_stripe_intent (stripe_payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS subscription_events (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  subscription_id   INT UNSIGNED  NOT NULL,
  event_type        ENUM('created','upgraded','downgraded','cancelled','renewed','reactivated') NOT NULL,
  plan_from         VARCHAR(50)   NULL,
  plan_to           VARCHAR(50)   NULL,
  mrr_change_cents  INT           NOT NULL DEFAULT 0,
  event_time        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  churn_reason      VARCHAR(500)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_sub_events_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE,
  INDEX idx_sub_events_subscription_id (subscription_id),
  INDEX idx_sub_events_event_type (event_type),
  INDEX idx_sub_events_event_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS churn_surveys (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id            INT UNSIGNED  NOT NULL,
  subscription_id    INT UNSIGNED  NOT NULL,
  primary_reason     ENUM('price','missing_feature','child_lost_interest','school_ended','found_alternative','other') NOT NULL,
  secondary_reason   VARCHAR(200)  NULL,
  feedback_text      TEXT          NULL,
  submitted_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_churn_surveys_user         FOREIGN KEY (user_id)         REFERENCES users          (id) ON DELETE CASCADE,
  CONSTRAINT fk_churn_surveys_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions  (id) ON DELETE CASCADE,
  INDEX idx_churn_surveys_user_id (user_id),
  INDEX idx_churn_surveys_subscription (subscription_id),
  INDEX idx_churn_surveys_reason (primary_reason)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS win_back_campaigns (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED  NOT NULL,
  campaign_type  VARCHAR(100)  NOT NULL,
  offer_code     VARCHAR(50)   NULL,
  sent_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened         TINYINT(1)    NOT NULL DEFAULT 0,
  converted      TINYINT(1)    NOT NULL DEFAULT 0,
  converted_at   DATETIME      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_win_back_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_win_back_user_id (user_id),
  INDEX idx_win_back_sent_at (sent_at),
  INDEX idx_win_back_converted (converted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS marketing_sources (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  source_name   VARCHAR(100)  NOT NULL,
  medium        VARCHAR(100)  NULL,
  channel_type  ENUM('organic','paid','referral','email','social','direct') NOT NULL,
  active        TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  INDEX idx_marketing_sources_channel (channel_type),
  INDEX idx_marketing_sources_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS content_items (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  content_type   ENUM('game','story','wellness','hero','assessment') NOT NULL,
  title          VARCHAR(300)  NOT NULL,
  language_code  VARCHAR(10)   NOT NULL DEFAULT 'en',
  active         TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_content_items_type (content_type),
  INDEX idx_content_items_language (language_code),
  INDEX idx_content_items_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS experiments (
  id                         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name                       VARCHAR(200)  NOT NULL,
  hypothesis                 TEXT          NULL,
  status                     ENUM('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
  start_date                 DATE          NULL,
  end_date                   DATE          NULL,
  primary_metric             VARCHAR(200)  NULL,
  minimum_detectable_effect  DECIMAL(6,4)  NULL,
  created_at                 DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_experiments_status (status),
  INDEX idx_experiments_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS experiment_variants (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  experiment_id   INT UNSIGNED  NOT NULL,
  variant_name    VARCHAR(100)  NOT NULL,
  is_control      TINYINT(1)    NOT NULL DEFAULT 0,
  traffic_percent DECIMAL(5,2)  NOT NULL DEFAULT 50.00,
  description     TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_exp_variants_experiment FOREIGN KEY (experiment_id) REFERENCES experiments (id) ON DELETE CASCADE,
  INDEX idx_exp_variants_experiment_id (experiment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS experiment_assignments (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  experiment_id  INT UNSIGNED  NOT NULL,
  variant_id     INT UNSIGNED  NOT NULL,
  user_id        INT UNSIGNED  NOT NULL,
  assigned_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_exp_assign_experiment FOREIGN KEY (experiment_id) REFERENCES experiments         (id) ON DELETE CASCADE,
  CONSTRAINT fk_exp_assign_variant    FOREIGN KEY (variant_id)    REFERENCES experiment_variants (id) ON DELETE CASCADE,
  CONSTRAINT fk_exp_assign_user       FOREIGN KEY (user_id)       REFERENCES users               (id) ON DELETE CASCADE,
  INDEX idx_exp_assign_experiment (experiment_id),
  INDEX idx_exp_assign_variant (variant_id),
  INDEX idx_exp_assign_user (user_id),
  UNIQUE KEY uq_exp_assign_user_exp (experiment_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS experiment_events (
  id             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  experiment_id  INT UNSIGNED     NOT NULL,
  variant_id     INT UNSIGNED     NOT NULL,
  user_id        INT UNSIGNED     NOT NULL,
  event_type     VARCHAR(100)     NOT NULL,
  event_time     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  value          DECIMAL(12,4)    NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_exp_events_experiment FOREIGN KEY (experiment_id) REFERENCES experiments         (id) ON DELETE CASCADE,
  CONSTRAINT fk_exp_events_variant    FOREIGN KEY (variant_id)    REFERENCES experiment_variants (id) ON DELETE CASCADE,
  CONSTRAINT fk_exp_events_user       FOREIGN KEY (user_id)       REFERENCES users               (id) ON DELETE CASCADE,
  INDEX idx_exp_events_experiment (experiment_id),
  INDEX idx_exp_events_variant (variant_id),
  INDEX idx_exp_events_user (user_id),
  INDEX idx_exp_events_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS experiment_results (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  experiment_id    INT UNSIGNED  NOT NULL,
  variant_id       INT UNSIGNED  NOT NULL,
  metric_name      VARCHAR(200)  NOT NULL,
  control_value    DECIMAL(12,4) NULL,
  treatment_value  DECIMAL(12,4) NULL,
  lift_percent     DECIMAL(8,4)  NULL,
  p_value          DECIMAL(8,6)  NULL,
  significant      TINYINT(1)    NOT NULL DEFAULT 0,
  computed_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_exp_results_experiment FOREIGN KEY (experiment_id) REFERENCES experiments         (id) ON DELETE CASCADE,
  CONSTRAINT fk_exp_results_variant    FOREIGN KEY (variant_id)    REFERENCES experiment_variants (id) ON DELETE CASCADE,
  INDEX idx_exp_results_experiment (experiment_id),
  INDEX idx_exp_results_variant (variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS cohort_retention_snapshots (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  cohort_month     DATE           NOT NULL,
  week_number      TINYINT UNSIGNED NOT NULL,
  users_in_cohort  INT UNSIGNED   NOT NULL DEFAULT 0,
  users_retained   INT UNSIGNED   NOT NULL DEFAULT 0,
  retention_rate   DECIMAL(6,4)   NOT NULL DEFAULT 0.0000,
  computed_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_cohort_ret_cohort_month (cohort_month),
  INDEX idx_cohort_ret_computed_at (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS locale_sessions (
  id                     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  language_code          VARCHAR(10)    NOT NULL,
  country_code           VARCHAR(10)    NOT NULL,
  region                 VARCHAR(100)   NULL,
  date                   DATE           NOT NULL,
  session_count          INT UNSIGNED   NOT NULL DEFAULT 0,
  unique_users           INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_duration_seconds   INT UNSIGNED   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_locale_sessions_date (date),
  INDEX idx_locale_sessions_language (language_code),
  INDEX idx_locale_sessions_country (country_code),
  UNIQUE KEY uq_locale_sessions_lang_country_date (language_code, country_code, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
