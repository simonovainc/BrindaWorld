-- ============================================================
-- 010_pricing_v2.sql  –  Licence Types Seed (Pricing v2)
-- BrindaWorld Platform
--
-- Creates the licence_types reference table (idempotent) and
-- seeds all 15 product tiers for the revised pricing strategy.
--
-- Tiers
--   individual  – Free / Gift cards
--   family      – Family Monthly & Annual / Family Plus Monthly & Annual
--   group       – Homeschool co-ops, community groups (≤20 children)
--   school      – Per-school licences (Starter / Standard / Unlimited)
--   district    – School district (custom pricing)
--   province    – Provincial government (custom pricing)
--   partner     – NGO / non-profit partner rate
--
-- billing_cycle values: monthly | annual | lifetime | custom
-- Prices are in cents (CAD).  0 = free or custom-quoted.
-- NULL max_children / max_users = unlimited.
-- ============================================================

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licence_types (
  id                 INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  code               VARCHAR(30)       NOT NULL,
  name               VARCHAR(100)      NOT NULL,
  description        VARCHAR(500)      NULL,
  tier               ENUM(
                       'individual',
                       'family',
                       'group',
                       'school',
                       'district',
                       'province',
                       'partner'
                     )                 NOT NULL DEFAULT 'individual',
  max_children       SMALLINT UNSIGNED NULL     COMMENT 'NULL = unlimited',
  max_users          SMALLINT UNSIGNED NULL     COMMENT 'NULL = unlimited (sub-accounts + coordinator)',
  base_price_cents   INT UNSIGNED      NOT NULL DEFAULT 0,
  currency           CHAR(3)           NOT NULL DEFAULT 'CAD',
  billing_cycle      ENUM(
                       'monthly',
                       'annual',
                       'lifetime',
                       'custom'
                     )                 NOT NULL DEFAULT 'monthly',
  trial_days         TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  active             TINYINT(1)        NOT NULL DEFAULT 1,
  created_at         DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_licence_types_code (code),
  INDEX idx_licence_types_tier (tier),
  INDEX idx_licence_types_billing_cycle (billing_cycle),
  INDEX idx_licence_types_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reference table: one row per purchasable plan / licence type';

-- ── Seed data ─────────────────────────────────────────────────────────────────
-- INSERT IGNORE: re-runnable; existing rows are never overwritten.
-- To update a price, write a dedicated ALTER or UPDATE migration instead.
INSERT IGNORE INTO licence_types
  (code, name, description, tier, max_children, max_users, base_price_cents, currency, billing_cycle, trial_days)
VALUES
  -- ── Free ──────────────────────────────────────────────────────────────────
  ('FREE',
   'Explorer',
   'Free forever - 2 child profiles, all free games',
   'individual', 2, 1, 0, 'CAD', 'monthly', 0),

  -- ── Family monthly / annual ───────────────────────────────────────────────
  ('FAMILY_M',
   'Family',
   'Up to 6 children, all games, weekly reports',
   'family', 6, 1, 499, 'CAD', 'monthly', 14),

  ('FAMILY_A',
   'Family Annual',
   'Up to 6 children - save 33% vs monthly',
   'family', 6, 1, 3999, 'CAD', 'annual', 14),

  -- ── Family Plus monthly / annual ──────────────────────────────────────────
  ('FAMILY_PLUS_M',
   'Family Plus',
   'Up to 10 children, 2 parent accounts, skill graphs',
   'family', 10, 2, 799, 'CAD', 'monthly', 14),

  ('FAMILY_PLUS_A',
   'Family Plus Annual',
   'Up to 10 children - save 37% vs monthly',
   'family', 10, 2, 5999, 'CAD', 'annual', 14),

  -- ── Gift cards (one-time, lifetime billing cycle) ─────────────────────────
  ('GIFT_3M',
   'Gift 3 Months',
   'Gift subscription - 3 months Family plan',
   'individual', 6, 1, 1499, 'CAD', 'lifetime', 0),

  ('GIFT_6M',
   'Gift 6 Months',
   'Gift subscription - 6 months Family plan',
   'individual', 6, 1, 2499, 'CAD', 'lifetime', 0),

  ('GIFT_12M',
   'Gift 12 Months',
   'Gift subscription - 1 year Family plan',
   'individual', 6, 1, 3999, 'CAD', 'lifetime', 0),

  -- ── Group (homeschool co-ops / community) ─────────────────────────────────
  ('GROUP',
   'Group',
   'Up to 20 children, 1 coordinator + 5 sub-accounts',
   'group', 20, 6, 14900, 'CAD', 'annual', 30),

  -- ── School tiers ──────────────────────────────────────────────────────────
  ('SCHOOL_S',
   'School Starter',
   'Up to 30 students, 1 teacher dashboard',
   'school', 30, 5, 9900, 'CAD', 'annual', 30),

  ('SCHOOL_M',
   'School Standard',
   'Up to 150 students, 5 teacher dashboards',
   'school', 150, 10, 29900, 'CAD', 'annual', 30),

  ('SCHOOL_L',
   'School Unlimited',
   'Unlimited students and teachers',
   'school', NULL, NULL, 99900, 'CAD', 'annual', 30),

  -- ── Institutional / custom-quoted ─────────────────────────────────────────
  ('DISTRICT',
   'District',
   'School district - custom pricing',
   'district', NULL, NULL, 0, 'CAD', 'custom', 30),

  ('PROVINCE',
   'Provincial',
   'Provincial government - custom pricing',
   'province', NULL, NULL, 0, 'CAD', 'custom', 0),

  ('NGO',
   'NGO Partner',
   'Non-profit and NGO partner rate',
   'partner', NULL, NULL, 0, 'CAD', 'custom', 0);
