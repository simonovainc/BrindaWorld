-- ============================================================
-- 006_governance.sql  –  AI governance, model registry,
--                         human review, sponsors & grants
-- BrindaWorld Platform
-- Must run after 001_operational.sql and 003_analytics.sql
-- ============================================================

-- ─── Training Data & Dataset Management ───────────────────

CREATE TABLE IF NOT EXISTS training_datasets (
  id                         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  dataset_name               VARCHAR(200)  NOT NULL,
  purpose                    VARCHAR(200)  NOT NULL,
  created_at                 DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  record_count               BIGINT UNSIGNED NOT NULL DEFAULT 0,
  de_identification_method   VARCHAR(200)  NULL,
  consent_coverage_percent   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  approved_by                INT UNSIGNED  NULL,
  approved_at                DATETIME      NULL,
  status                     ENUM('draft','approved','deprecated') NOT NULL DEFAULT 'draft',
  PRIMARY KEY (id),
  INDEX idx_td_status (status),
  INDEX idx_td_approved_by (approved_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dataset_versions (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  dataset_id           INT UNSIGNED  NOT NULL,
  version_number       VARCHAR(50)   NOT NULL,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changes_description  TEXT          NULL,
  created_by           INT UNSIGNED  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_dv_dataset FOREIGN KEY (dataset_id) REFERENCES training_datasets (id) ON DELETE CASCADE,
  INDEX idx_dv_dataset_id (dataset_id),
  INDEX idx_dv_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dataset_lineage (
  id                          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  dataset_id                  INT UNSIGNED  NOT NULL,
  source_table                VARCHAR(100)  NOT NULL,
  source_filter_description   TEXT          NULL,
  transformation_description  TEXT          NULL,
  records_included            BIGINT UNSIGNED NOT NULL DEFAULT 0,
  generated_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_dl_dataset FOREIGN KEY (dataset_id) REFERENCES training_datasets (id) ON DELETE CASCADE,
  INDEX idx_dl_dataset_id (dataset_id),
  INDEX idx_dl_source_table (source_table)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dataset_consent_coverage (
  id                 INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  dataset_id         INT UNSIGNED   NOT NULL,
  checked_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_records      BIGINT UNSIGNED NOT NULL DEFAULT 0,
  consented_records  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  coverage_percent   DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  issues_found       TEXT           NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_dcc_dataset FOREIGN KEY (dataset_id) REFERENCES training_datasets (id) ON DELETE CASCADE,
  INDEX idx_dcc_dataset_id (dataset_id),
  INDEX idx_dcc_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS data_quality_checks (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  check_name   VARCHAR(200)  NOT NULL,
  dataset_id   INT UNSIGNED  NOT NULL,
  check_type   ENUM('completeness','uniqueness','validity','consistency','timeliness') NOT NULL,
  threshold    DECIMAL(8,4)  NOT NULL,
  active       TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_dqc_dataset FOREIGN KEY (dataset_id) REFERENCES training_datasets (id) ON DELETE CASCADE,
  INDEX idx_dqc_dataset_id (dataset_id),
  INDEX idx_dqc_check_type (check_type),
  INDEX idx_dqc_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS data_quality_results (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  check_id         INT UNSIGNED   NOT NULL,
  run_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  passed           TINYINT(1)     NOT NULL DEFAULT 0,
  actual_value     DECIMAL(12,4)  NOT NULL,
  threshold_value  DECIMAL(12,4)  NOT NULL,
  records_failed   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  notes            TEXT           NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_dqr_check FOREIGN KEY (check_id) REFERENCES data_quality_checks (id) ON DELETE CASCADE,
  INDEX idx_dqr_check_id (check_id),
  INDEX idx_dqr_run_at (run_at),
  INDEX idx_dqr_passed (passed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS anonymization_logs (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  dataset_id          INT UNSIGNED  NOT NULL,
  method              VARCHAR(100)  NOT NULL,
  fields_anonymized   JSON          NOT NULL,
  performed_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  performed_by        INT UNSIGNED  NULL,
  verified_by         INT UNSIGNED  NULL,
  verified_at         DATETIME      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_al_dataset FOREIGN KEY (dataset_id) REFERENCES training_datasets (id) ON DELETE CASCADE,
  INDEX idx_al_dataset_id (dataset_id),
  INDEX idx_al_performed_by (performed_by),
  INDEX idx_al_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS bias_evaluation_results (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  model_id        INT UNSIGNED   NOT NULL,
  evaluation_date DATE           NOT NULL,
  segment_type    ENUM('age','language','country','device') NOT NULL,
  segment_value   VARCHAR(100)   NOT NULL,
  metric_name     VARCHAR(200)   NOT NULL,
  metric_value    DECIMAL(10,4)  NOT NULL,
  baseline_value  DECIMAL(10,4)  NOT NULL,
  bias_flag       TINYINT(1)     NOT NULL DEFAULT 0,
  notes           TEXT           NULL,
  PRIMARY KEY (id),
  INDEX idx_ber_model_id (model_id),
  INDEX idx_ber_evaluation_date (evaluation_date),
  INDEX idx_ber_bias_flag (bias_flag),
  INDEX idx_ber_segment (segment_type, segment_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── Model Registry ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS model_registry (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  model_name           VARCHAR(200)  NOT NULL,
  model_version        VARCHAR(50)   NOT NULL,
  purpose              VARCHAR(500)  NOT NULL,
  training_dataset_id  INT UNSIGNED  NULL,
  framework            VARCHAR(50)   NULL,
  deployed_at          DATETIME      NULL,
  deprecated_at        DATETIME      NULL,
  status               ENUM('development','staging','production','deprecated') NOT NULL DEFAULT 'development',
  created_by           INT UNSIGNED  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_mr_dataset    FOREIGN KEY (training_dataset_id) REFERENCES training_datasets (id) ON DELETE SET NULL,
  INDEX idx_mr_status (status),
  INDEX idx_mr_dataset (training_dataset_id),
  INDEX idx_mr_deployed_at (deployed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS model_evaluations (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  model_id      INT UNSIGNED   NOT NULL,
  evaluated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metric_name   VARCHAR(200)   NOT NULL,
  metric_value  DECIMAL(12,4)  NOT NULL,
  dataset_size  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  notes         TEXT           NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_me_model FOREIGN KEY (model_id) REFERENCES model_registry (id) ON DELETE CASCADE,
  INDEX idx_me_model_id (model_id),
  INDEX idx_me_evaluated_at (evaluated_at),
  INDEX idx_me_metric_name (metric_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS model_deployment_events (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  model_id         INT UNSIGNED  NOT NULL,
  event_type       ENUM('deployed','rolled_back','scaled_up','scaled_down') NOT NULL,
  traffic_percent  DECIMAL(5,2)  NOT NULL DEFAULT 100.00,
  event_time       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  triggered_by     INT UNSIGNED  NULL,
  notes            TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_mde_model FOREIGN KEY (model_id) REFERENCES model_registry (id) ON DELETE CASCADE,
  INDEX idx_mde_model_id (model_id),
  INDEX idx_mde_event_time (event_time),
  INDEX idx_mde_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS model_serving_logs (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  model_id     INT UNSIGNED     NOT NULL,
  requested_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  latency_ms   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  input_hash   VARCHAR(64)      NULL,
  output_hash  VARCHAR(64)      NULL,
  error_flag   TINYINT(1)       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_msl_model FOREIGN KEY (model_id) REFERENCES model_registry (id) ON DELETE CASCADE,
  INDEX idx_msl_model_id (model_id),
  INDEX idx_msl_requested_at (requested_at),
  INDEX idx_msl_error_flag (error_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── Human Review / Trust & Safety ────────────────────────

CREATE TABLE IF NOT EXISTS review_queues (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  queue_name  VARCHAR(100)  NOT NULL,
  queue_type  ENUM('content_flag','consent_dispute','deletion_request','appeal','safety') NOT NULL,
  priority    ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  INDEX idx_rq_queue_type (queue_type),
  INDEX idx_rq_priority (priority),
  INDEX idx_rq_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS review_queue_items (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  queue_id      INT UNSIGNED  NOT NULL,
  entity_type   VARCHAR(50)   NOT NULL,
  entity_id     VARCHAR(50)   NOT NULL,
  reason        TEXT          NOT NULL,
  status        ENUM('pending','assigned','resolved','escalated') NOT NULL DEFAULT 'pending',
  assigned_to   INT UNSIGNED  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   DATETIME      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_rqi_queue       FOREIGN KEY (queue_id)    REFERENCES review_queues (id) ON DELETE CASCADE,
  CONSTRAINT fk_rqi_assigned_to FOREIGN KEY (assigned_to) REFERENCES users         (id) ON DELETE SET NULL,
  INDEX idx_rqi_queue_id (queue_id),
  INDEX idx_rqi_status (status),
  INDEX idx_rqi_assigned_to (assigned_to),
  INDEX idx_rqi_created_at (created_at),
  INDEX idx_rqi_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS review_decisions (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  item_id      INT UNSIGNED  NOT NULL,
  reviewer_id  INT UNSIGNED  NOT NULL,
  decision     ENUM('approved','rejected','escalated','needs_info') NOT NULL,
  rationale    TEXT          NULL,
  decided_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rd_item     FOREIGN KEY (item_id)     REFERENCES review_queue_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_rd_reviewer FOREIGN KEY (reviewer_id) REFERENCES users              (id) ON DELETE CASCADE,
  INDEX idx_rd_item_id (item_id),
  INDEX idx_rd_reviewer_id (reviewer_id),
  INDEX idx_rd_decision (decision),
  INDEX idx_rd_decided_at (decided_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS review_appeals (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  original_item_id     INT UNSIGNED  NOT NULL,
  appealed_by          INT UNSIGNED  NOT NULL,
  appeal_reason        TEXT          NOT NULL,
  status               ENUM('pending','upheld','overturned') NOT NULL DEFAULT 'pending',
  decided_at           DATETIME      NULL,
  notes                TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ra_item       FOREIGN KEY (original_item_id) REFERENCES review_queue_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_ra_appealed   FOREIGN KEY (appealed_by)      REFERENCES users               (id) ON DELETE CASCADE,
  INDEX idx_ra_item_id (original_item_id),
  INDEX idx_ra_appealed_by (appealed_by),
  INDEX idx_ra_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS content_flags (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  content_type  VARCHAR(50)   NOT NULL,
  content_id    VARCHAR(50)   NOT NULL,
  flag_type     ENUM('inappropriate','inaccurate','outdated','copyright') NOT NULL,
  flagged_by    INT UNSIGNED  NULL,
  auto_flagged  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   DATETIME      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_cf_flagged_by FOREIGN KEY (flagged_by) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_cf_flagged_by (flagged_by),
  INDEX idx_cf_flag_type (flag_type),
  INDEX idx_cf_content (content_type, content_id),
  INDEX idx_cf_created_at (created_at),
  INDEX idx_cf_resolved_at (resolved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS moderation_actions (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  flag_id       INT UNSIGNED  NOT NULL,
  action_type   ENUM('removed','edited','approved','escalated') NOT NULL,
  performed_by  INT UNSIGNED  NOT NULL,
  performed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes         TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ma_flag         FOREIGN KEY (flag_id)      REFERENCES content_flags (id) ON DELETE CASCADE,
  CONSTRAINT fk_ma_performed_by FOREIGN KEY (performed_by) REFERENCES users          (id) ON DELETE CASCADE,
  INDEX idx_ma_flag_id (flag_id),
  INDEX idx_ma_performed_by (performed_by),
  INDEX idx_ma_action_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── Sponsors & Grants ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsors (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  company_name         VARCHAR(200)  NOT NULL,
  contact_name         VARCHAR(200)  NULL,
  contact_email        VARCHAR(255)  NULL,
  tier                 ENUM('impact','empowerment','title') NOT NULL DEFAULT 'impact',
  contract_value_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  contract_start       DATE          NULL,
  contract_end         DATE          NULL,
  status               ENUM('prospect','active','completed') NOT NULL DEFAULT 'prospect',
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sponsors_status (status),
  INDEX idx_sponsors_tier (tier),
  INDEX idx_sponsors_contract_end (contract_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS sponsor_campaigns (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  sponsor_id              INT UNSIGNED  NOT NULL,
  campaign_name           VARCHAR(200)  NOT NULL,
  sponsored_content_ids   JSON          NULL,
  start_date              DATE          NOT NULL,
  end_date                DATE          NOT NULL,
  kpi_targets             JSON          NULL,
  active                  TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_sc_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors (id) ON DELETE CASCADE,
  INDEX idx_sc_sponsor_id (sponsor_id),
  INDEX idx_sc_start_date (start_date),
  INDEX idx_sc_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS sponsor_impact_reports (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  sponsor_id            INT UNSIGNED  NOT NULL,
  report_period_start   DATE          NOT NULL,
  report_period_end     DATE          NOT NULL,
  girls_reached         INT UNSIGNED  NOT NULL DEFAULT 0,
  sessions_attributed   INT UNSIGNED  NOT NULL DEFAULT 0,
  skills_developed      JSON          NULL,
  countries_reached     INT UNSIGNED  NOT NULL DEFAULT 0,
  generated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sir_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors (id) ON DELETE CASCADE,
  INDEX idx_sir_sponsor_id (sponsor_id),
  INDEX idx_sir_period (report_period_start, report_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS grant_applications (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  grant_name              VARCHAR(300)  NOT NULL,
  funder                  VARCHAR(300)  NOT NULL,
  amount_requested_cents  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  amount_awarded_cents    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status                  ENUM('draft','submitted','under_review','awarded','rejected') NOT NULL DEFAULT 'draft',
  submitted_at            DATETIME      NULL,
  decision_at             DATETIME      NULL,
  reporting_requirements  TEXT          NULL,
  notes                   TEXT          NULL,
  PRIMARY KEY (id),
  INDEX idx_ga_status (status),
  INDEX idx_ga_submitted_at (submitted_at),
  INDEX idx_ga_funder (funder(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS grant_reporting_events (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  grant_id           INT UNSIGNED  NOT NULL,
  report_type        VARCHAR(100)  NOT NULL,
  due_date           DATE          NOT NULL,
  submitted_date     DATE          NULL,
  metrics_snapshot   JSON          NULL,
  notes              TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_gre_grant FOREIGN KEY (grant_id) REFERENCES grant_applications (id) ON DELETE CASCADE,
  INDEX idx_gre_grant_id (grant_id),
  INDEX idx_gre_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS partner_organisations (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  org_name              VARCHAR(300)  NOT NULL,
  org_type              ENUM('school_board','ngo','government','university','corporate') NOT NULL,
  country               VARCHAR(10)   NULL,
  province              VARCHAR(10)   NULL,
  contact_name          VARCHAR(200)  NULL,
  contact_email         VARCHAR(255)  NULL,
  partnership_status    VARCHAR(100)  NOT NULL DEFAULT 'prospect',
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_po_org_type (org_type),
  INDEX idx_po_country (country),
  INDEX idx_po_province (province),
  INDEX idx_po_status (partnership_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
