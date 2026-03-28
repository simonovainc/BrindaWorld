-- ============================================================
-- 002_compliance.sql  –  COPPA / PIPEDA / GDPR compliance
-- BrindaWorld Platform
-- Must run after 001_operational.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS data_processing_purposes (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  purpose_name    VARCHAR(200)  NOT NULL,
  legal_basis     VARCHAR(200)  NOT NULL,
  description     TEXT          NULL,
  retention_days  INT UNSIGNED  NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_dpp_purpose_name (purpose_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS parental_consents (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  parent_user_id       INT UNSIGNED  NOT NULL,
  child_id             INT UNSIGNED  NOT NULL,
  consent_type         VARCHAR(50)   NOT NULL,
  consent_version      VARCHAR(20)   NOT NULL,
  granted_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at           DATETIME      NULL,
  ip_address           VARCHAR(45)   NULL,
  verification_method  ENUM('email','credit_card','id_check') NOT NULL DEFAULT 'email',
  notes                TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_parental_consents_parent FOREIGN KEY (parent_user_id) REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_parental_consents_child  FOREIGN KEY (child_id)       REFERENCES children (id) ON DELETE CASCADE,
  INDEX idx_pc_parent_user_id (parent_user_id),
  INDEX idx_pc_child_id (child_id),
  INDEX idx_pc_consent_type (consent_type),
  INDEX idx_pc_revoked_at (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS consent_scopes (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  consent_id   INT UNSIGNED  NOT NULL,
  purpose_id   INT UNSIGNED  NOT NULL,
  allowed_flag TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_consent_scopes_consent  FOREIGN KEY (consent_id)  REFERENCES parental_consents      (id) ON DELETE CASCADE,
  CONSTRAINT fk_consent_scopes_purpose  FOREIGN KEY (purpose_id)  REFERENCES data_processing_purposes (id) ON DELETE CASCADE,
  INDEX idx_consent_scopes_consent_id (consent_id),
  INDEX idx_consent_scopes_purpose_id (purpose_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  actor_id     INT UNSIGNED     NULL,
  actor_type   ENUM('user','system','admin') NOT NULL DEFAULT 'system',
  action       VARCHAR(100)     NOT NULL,
  entity_type  VARCHAR(50)      NOT NULL,
  entity_id    VARCHAR(50)      NULL,
  old_values   JSON             NULL,
  new_values   JSON             NULL,
  ip_address   VARCHAR(45)      NULL,
  user_agent   VARCHAR(500)     NULL,
  timestamp    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_logs_actor_id (actor_id),
  INDEX idx_audit_logs_actor_type (actor_type),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS data_access_requests (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  requesting_user_id   INT UNSIGNED  NOT NULL,
  child_id             INT UNSIGNED  NULL,
  request_type         ENUM('access','deletion','portability','correction') NOT NULL,
  status               ENUM('pending','processing','completed','denied') NOT NULL DEFAULT 'pending',
  requested_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at         DATETIME      NULL,
  notes                TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_dar_user  FOREIGN KEY (requesting_user_id) REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_dar_child FOREIGN KEY (child_id)           REFERENCES children (id) ON DELETE SET NULL,
  INDEX idx_dar_user_id (requesting_user_id),
  INDEX idx_dar_child_id (child_id),
  INDEX idx_dar_status (status),
  INDEX idx_dar_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id                 INT UNSIGNED  NOT NULL,
  child_id                INT UNSIGNED  NULL,
  requested_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheduled_deletion_at   DATETIME      NOT NULL,
  executed_at             DATETIME      NULL,
  tables_cleared          JSON          NULL,
  verified_by             INT UNSIGNED  NULL,
  notes                   TEXT          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ddr_user  FOREIGN KEY (user_id)  REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_ddr_child FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE SET NULL,
  INDEX idx_ddr_user_id (user_id),
  INDEX idx_ddr_child_id (child_id),
  INDEX idx_ddr_scheduled (scheduled_deletion_at),
  INDEX idx_ddr_executed_at (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS deletion_execution_logs (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  deletion_request_id INT UNSIGNED  NOT NULL,
  table_name          VARCHAR(100)  NOT NULL,
  records_deleted     INT UNSIGNED  NOT NULL DEFAULT 0,
  executed_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified            TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_del_exec_request FOREIGN KEY (deletion_request_id) REFERENCES data_deletion_requests (id) ON DELETE CASCADE,
  INDEX idx_del_exec_request_id (deletion_request_id),
  INDEX idx_del_exec_table_name (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS data_portability_exports (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED  NOT NULL,
  requested_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at   DATETIME      NULL,
  export_format  VARCHAR(20)   NOT NULL DEFAULT 'json',
  download_url   VARCHAR(2000) NULL,
  expires_at     DATETIME      NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_dpe_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_dpe_user_id (user_id),
  INDEX idx_dpe_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS privacy_incident_logs (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  incident_type         VARCHAR(100)  NOT NULL,
  severity              ENUM('low','medium','high','critical') NOT NULL,
  description           TEXT          NOT NULL,
  affected_users_count  INT UNSIGNED  NOT NULL DEFAULT 0,
  detected_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reported_at           DATETIME      NULL,
  resolved_at           DATETIME      NULL,
  resolution_notes      TEXT          NULL,
  PRIMARY KEY (id),
  INDEX idx_pil_severity (severity),
  INDEX idx_pil_detected_at (detected_at),
  INDEX idx_pil_resolved_at (resolved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS access_control_changes (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  changed_by       INT UNSIGNED  NOT NULL,
  target_user_id   INT UNSIGNED  NOT NULL,
  permission_type  VARCHAR(100)  NOT NULL,
  old_value        VARCHAR(500)  NULL,
  new_value        VARCHAR(500)  NULL,
  changed_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason           VARCHAR(1000) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_acc_changed_by     FOREIGN KEY (changed_by)     REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_acc_target_user    FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_acc_changed_by (changed_by),
  INDEX idx_acc_target_user_id (target_user_id),
  INDEX idx_acc_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS regional_compliance_flags (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  country_code     VARCHAR(10)   NOT NULL,
  regulation_name  VARCHAR(100)  NOT NULL,
  applies_flag     TINYINT(1)    NOT NULL DEFAULT 1,
  notes            TEXT          NULL,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_rcf_country_code (country_code),
  INDEX idx_rcf_regulation (regulation_name),
  UNIQUE KEY uq_rcf_country_regulation (country_code, regulation_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
