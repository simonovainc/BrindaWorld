-- ============================================================
-- 014_leads.sql  –  Email Lead Capture
-- BrindaWorld Platform
-- CMMI L5: all lead sources routed through MySQL first;
--          downstream sync (Mailchimp/Resend) is handled by the
--          application layer, never by a direct browser POST.
--
-- Tables: 1 | Running total: 113 tables
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id           INT              NOT NULL AUTO_INCREMENT,
  public_id    VARCHAR(36)      NOT NULL,
  email        VARCHAR(255)     NOT NULL,
  lead_type    ENUM(
                 'parent',
                 'teacher',
                 'school',
                 'district',
                 'partner',
                 'other'
               )                NOT NULL DEFAULT 'parent',
  lead_source  VARCHAR(100)     NOT NULL DEFAULT 'unknown'
               COMMENT 'e.g. homepage_email, register_page, school_enquiry',
  first_name   VARCHAR(100)     NULL,
  last_name    VARCHAR(100)     NULL,
  school_name  VARCHAR(200)     NULL,
  province     VARCHAR(10)      NULL,
  notes        TEXT             NULL,
  status       ENUM(
                 'new',
                 'contacted',
                 'qualified',
                 'converted',
                 'unsubscribed'
               )                NOT NULL DEFAULT 'new',
  mailchimp_synced  TINYINT(1)  NOT NULL DEFAULT 0
               COMMENT '1 = successfully added to Mailchimp audience',
  mailchimp_sync_at TIMESTAMP   NULL,
  created_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_leads_public_id (public_id),
  UNIQUE KEY  uq_leads_email     (email),
  INDEX idx_leads_type   (lead_type),
  INDEX idx_leads_source (lead_source),
  INDEX idx_leads_status (status),
  INDEX idx_leads_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='All inbound email leads — browser never POSTs directly to Mailchimp';
