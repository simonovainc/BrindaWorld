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
