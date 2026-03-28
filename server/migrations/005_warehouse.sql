-- ============================================================
-- 005_warehouse.sql  –  Data warehouse pre-aggregated tables
-- BrindaWorld Platform
-- Must run after 001, 003, 004
-- ============================================================

CREATE TABLE IF NOT EXISTS dw_daily_platform_metrics (
  id                     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  date                   DATE           NOT NULL,
  dau                    INT UNSIGNED   NOT NULL DEFAULT 0,
  wau                    INT UNSIGNED   NOT NULL DEFAULT 0,
  mau                    INT UNSIGNED   NOT NULL DEFAULT 0,
  new_users              INT UNSIGNED   NOT NULL DEFAULT 0,
  new_children           INT UNSIGNED   NOT NULL DEFAULT 0,
  sessions_total         INT UNSIGNED   NOT NULL DEFAULT 0,
  minutes_total          BIGINT UNSIGNED NOT NULL DEFAULT 0,
  games_completed        INT UNSIGNED   NOT NULL DEFAULT 0,
  badges_earned          INT UNSIGNED   NOT NULL DEFAULT 0,
  revenue_cents          BIGINT UNSIGNED NOT NULL DEFAULT 0,
  new_subscriptions      INT UNSIGNED   NOT NULL DEFAULT 0,
  churned_subscriptions  INT UNSIGNED   NOT NULL DEFAULT 0,
  net_mrr_cents          BIGINT         NOT NULL DEFAULT 0,
  computed_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dw_daily_date (date),
  INDEX idx_dw_daily_computed_at (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_weekly_cohort_retention (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  cohort_month     DATE           NOT NULL,
  week_number      TINYINT UNSIGNED NOT NULL,
  users_in_cohort  INT UNSIGNED   NOT NULL DEFAULT 0,
  users_retained   INT UNSIGNED   NOT NULL DEFAULT 0,
  retention_rate   DECIMAL(6,4)   NOT NULL DEFAULT 0.0000,
  computed_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dw_wcr_cohort_week (cohort_month, week_number),
  INDEX idx_dw_wcr_computed_at (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_monthly_revenue_summary (
  id                           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  month                        DATE           NOT NULL,
  mrr_cents                    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  arr_cents                    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  new_mrr_cents                BIGINT UNSIGNED NOT NULL DEFAULT 0,
  expansion_mrr_cents          BIGINT UNSIGNED NOT NULL DEFAULT 0,
  churned_mrr_cents            BIGINT UNSIGNED NOT NULL DEFAULT 0,
  net_new_mrr_cents            BIGINT         NOT NULL DEFAULT 0,
  subscribers_total            INT UNSIGNED   NOT NULL DEFAULT 0,
  new_subscribers              INT UNSIGNED   NOT NULL DEFAULT 0,
  churned_subscribers          INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_revenue_per_user_cents   INT UNSIGNED   NOT NULL DEFAULT 0,
  computed_at                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dw_monthly_rev_month (month),
  INDEX idx_dw_monthly_rev_computed (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_game_performance_rollup (
  id                   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  game_id              VARCHAR(50)    NOT NULL,
  date                 DATE           NOT NULL,
  sessions_count       INT UNSIGNED   NOT NULL DEFAULT 0,
  unique_players       INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_duration_seconds INT UNSIGNED   NOT NULL DEFAULT 0,
  completion_rate      DECIMAL(6,4)   NOT NULL DEFAULT 0.0000,
  avg_score            DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  hints_used_avg       DECIMAL(6,2)   NOT NULL DEFAULT 0.00,
  computed_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dw_gpr_game_date (game_id, date),
  CONSTRAINT fk_dw_gpr_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  INDEX idx_dw_gpr_date (date),
  INDEX idx_dw_gpr_computed (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_school_usage_rollup (
  id                           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  school_licence_id            INT UNSIGNED   NULL,
  month                        DATE           NOT NULL,
  active_teachers              INT UNSIGNED   NOT NULL DEFAULT 0,
  active_students              INT UNSIGNED   NOT NULL DEFAULT 0,
  assignments_completed        INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_sessions_per_student     DECIMAL(6,2)   NOT NULL DEFAULT 0.00,
  computed_at                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_dw_sur_school (school_licence_id),
  INDEX idx_dw_sur_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_learning_outcomes_rollup (
  id                    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  skill_id              INT UNSIGNED   NOT NULL,
  age_band              VARCHAR(20)    NOT NULL,
  language_code         VARCHAR(10)    NOT NULL,
  month                 DATE           NOT NULL,
  learners_count        INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_proficiency_gain  DECIMAL(5,3)   NOT NULL DEFAULT 0.000,
  mastery_rate          DECIMAL(6,4)   NOT NULL DEFAULT 0.0000,
  computed_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_dw_lor_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE,
  INDEX idx_dw_lor_skill_id (skill_id),
  INDEX idx_dw_lor_month (month),
  INDEX idx_dw_lor_language (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_channel_attribution_rollup (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  source          VARCHAR(100)   NOT NULL,
  medium          VARCHAR(100)   NOT NULL,
  month           DATE           NOT NULL,
  new_users       INT UNSIGNED   NOT NULL DEFAULT 0,
  converted_to_paid INT UNSIGNED NOT NULL DEFAULT 0,
  revenue_cents   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  ltv_cents_avg   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  computed_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_dw_car_month (month),
  INDEX idx_dw_car_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dw_experiment_rollup (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  experiment_id  INT UNSIGNED   NOT NULL,
  variant_id     INT UNSIGNED   NOT NULL,
  metric_name    VARCHAR(200)   NOT NULL,
  value          DECIMAL(14,4)  NOT NULL DEFAULT 0.0000,
  computed_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_dw_er_experiment FOREIGN KEY (experiment_id) REFERENCES experiments         (id) ON DELETE CASCADE,
  CONSTRAINT fk_dw_er_variant    FOREIGN KEY (variant_id)    REFERENCES experiment_variants (id) ON DELETE CASCADE,
  INDEX idx_dw_er_experiment (experiment_id),
  INDEX idx_dw_er_variant (variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS feature_definitions (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  feature_name        VARCHAR(200)  NOT NULL,
  entity_type         ENUM('child','user') NOT NULL,
  formula_description TEXT          NULL,
  refresh_cadence     ENUM('realtime','hourly','daily','weekly') NOT NULL DEFAULT 'daily',
  active              TINYINT(1)    NOT NULL DEFAULT 1,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_feature_defs_name (feature_name),
  INDEX idx_feature_defs_entity (entity_type),
  INDEX idx_feature_defs_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS child_feature_snapshots (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  child_id       INT UNSIGNED  NOT NULL,
  snapshot_date  DATE          NOT NULL,
  features       JSON          NOT NULL,
  computed_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cfs_child_date (child_id, snapshot_date),
  CONSTRAINT fk_cfs_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_cfs_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS user_feature_snapshots (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED  NOT NULL,
  snapshot_date  DATE          NOT NULL,
  features       JSON          NOT NULL,
  computed_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ufs_user_date (user_id, snapshot_date),
  CONSTRAINT fk_ufs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_ufs_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS feature_pipeline_runs (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  feature_name     VARCHAR(200)  NOT NULL,
  run_date         DATE          NOT NULL,
  started_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at     DATETIME      NULL,
  rows_processed   INT UNSIGNED  NOT NULL DEFAULT 0,
  errors_count     INT UNSIGNED  NOT NULL DEFAULT 0,
  status           ENUM('success','failed','partial') NOT NULL DEFAULT 'partial',
  PRIMARY KEY (id),
  INDEX idx_fpr_feature_name (feature_name),
  INDEX idx_fpr_run_date (run_date),
  INDEX idx_fpr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS feature_drift_logs (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  feature_name   VARCHAR(200)   NOT NULL,
  detected_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_mean  DECIMAL(14,4)  NULL,
  actual_mean    DECIMAL(14,4)  NULL,
  drift_score    DECIMAL(8,4)   NOT NULL DEFAULT 0.0000,
  alerted        TINYINT(1)     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_fdl_feature_name (feature_name),
  INDEX idx_fdl_detected_at (detected_at),
  INDEX idx_fdl_alerted (alerted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS feature_serving_logs (
  id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  feature_name    VARCHAR(200)     NOT NULL,
  requested_by    VARCHAR(100)     NOT NULL,
  requested_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  latency_ms      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  cache_hit       TINYINT(1)       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_fsl_feature_name (feature_name),
  INDEX idx_fsl_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS ltv_snapshots (
  id                    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  cohort_source         VARCHAR(100)   NOT NULL,
  cohort_month          DATE           NOT NULL,
  months_since_signup   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  avg_ltv_cents         BIGINT UNSIGNED NOT NULL DEFAULT 0,
  users_count           INT UNSIGNED   NOT NULL DEFAULT 0,
  computed_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ltv_cohort_month (cohort_month),
  INDEX idx_ltv_cohort_source (cohort_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS payback_period_snapshots (
  id                      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  channel                 VARCHAR(100)   NOT NULL,
  month                   DATE           NOT NULL,
  cac_cents               INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_months_to_payback   DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  computed_at             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pps_channel (channel),
  INDEX idx_pps_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id                   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  forecast_date        DATE           NOT NULL,
  horizon_days         SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  predicted_mrr_cents  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  confidence_low       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  confidence_high      BIGINT UNSIGNED NOT NULL DEFAULT 0,
  model_version        VARCHAR(50)    NOT NULL,
  created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_rf_forecast_date (forecast_date),
  INDEX idx_rf_model_version (model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS locale_engagement_metrics (
  id                      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  language_code           VARCHAR(10)    NOT NULL,
  country_code            VARCHAR(10)    NOT NULL,
  month                   DATE           NOT NULL,
  active_users            INT UNSIGNED   NOT NULL DEFAULT 0,
  avg_sessions_per_user   DECIMAL(6,2)   NOT NULL DEFAULT 0.00,
  avg_minutes_per_session DECIMAL(6,2)   NOT NULL DEFAULT 0.00,
  game_completion_rate    DECIMAL(6,4)   NOT NULL DEFAULT 0.0000,
  retention_30d           DECIMAL(6,4)   NOT NULL DEFAULT 0.0000,
  computed_at             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_lem_month (month),
  INDEX idx_lem_language (language_code),
  INDEX idx_lem_country (country_code),
  UNIQUE KEY uq_lem_lang_country_month (language_code, country_code, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
