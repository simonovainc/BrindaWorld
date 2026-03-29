-- ============================================================
-- Claritum S01: Seed Data
-- Migration: 003_seed_data.sql
-- Entity: Simonova Inc. o/a Claritum
-- Date: 2026-03-29
-- ============================================================

-- ============================================================
-- JURISDICTIONS
-- ============================================================

-- 1. Federal
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, court_forms_url, rules_url, legal_aid_url, official_court_url, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'CA_FED',
    'Canada (Federal)',
    'federal',
    'CA',
    TRUE,
    NULL,
    'Divorce Act R.S.C. 1985 c.3 (2nd Supp)',
    'https://www.justice.gc.ca/eng/fl-df',
    'https://laws-lois.justice.gc.ca/eng/acts/d-3.4',
    'https://www.legalaid.on.ca',
    '',
    1
);

-- 2. Ontario (Phase 1 — active)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, court_forms_url, rules_url, legal_aid_url, official_court_url, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'CA_ON',
    'Ontario',
    'provincial',
    'CA',
    TRUE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act R.S.O. 1990 c.F.3',
    'https://ontariocourtforms.on.ca/en/family-law-rules-forms',
    'https://www.ontario.ca/laws/regulation/990114',
    'https://www.legalaid.on.ca',
    'https://www.ontariocourts.ca',
    2
);

-- 3. British Columbia (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'CA_BC',
    'British Columbia',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act S.B.C. 2011 c.25',
    3
);

-- 4. Alberta (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000004',
    'CA_AB',
    'Alberta',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act S.A. 2003 c.F-4.5',
    4
);

-- 5. New Brunswick (inactive — Phase 2)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000005',
    'CA_NB',
    'New Brunswick',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Services Act S.N.B. 1980 c.F-2.2',
    5
);

-- 6. Manitoba (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000006',
    'CA_MB',
    'Manitoba',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'The Family Maintenance Act C.C.S.M. c.F20',
    6
);

-- 7. Saskatchewan (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000007',
    'CA_SK',
    'Saskatchewan',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'The Family Maintenance Act 1997 S.S. 1997 c.F-6.2',
    7
);

-- 8. Nova Scotia (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000008',
    'CA_NS',
    'Nova Scotia',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Maintenance and Custody Act R.S.N.S. 1989 c.160',
    8
);

-- 9. Prince Edward Island (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000009',
    'CA_PE',
    'Prince Edward Island',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act R.S.P.E.I. 1988 c.F-2.1',
    9
);

-- 10. Newfoundland and Labrador (inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000010',
    'CA_NL',
    'Newfoundland and Labrador',
    'provincial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act R.S.N.L. 1990 c.F-2',
    10
);

-- 11. Yukon (territory, inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000011',
    'CA_YT',
    'Yukon',
    'territorial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Property and Support Act R.S.Y. 2002 c.83',
    11
);

-- 12. Northwest Territories (territory, inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000012',
    'CA_NT',
    'Northwest Territories',
    'territorial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act S.N.W.T. 1997 c.18',
    12
);

-- 13. Nunavut (territory, inactive)
INSERT INTO jurisdictions (id, code, name, type, country, is_active, parent_id, primary_legislation, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000013',
    'CA_NU',
    'Nunavut',
    'territorial',
    'CA',
    FALSE,
    'a0000000-0000-0000-0000-000000000001',
    'Family Law Act S.Nu. 1997 c.18',
    13
);

-- ============================================================
-- ONTARIO COURTS (8 courts)
-- ============================================================

-- 1. SCJ Toronto
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, address, phone, website_url, filing_portal_url, motion_days, virtual_appearance_default, in_person_required_from, duty_counsel_hours, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'SCJ',
    'Superior Court of Justice — Toronto (Family)',
    'SCJ Toronto',
    'Toronto',
    '393 University Avenue, Toronto ON M5G 1E6',
    '416-327-5440',
    'https://www.ontariocourts.ca/scj',
    'https://ontariocourts.ca/scj/filing',
    'Monday through Friday',
    TRUE,
    '2026-04-02',
    'Monday-Friday 9am-1pm',
    TRUE
);

-- 2. SCJ Brampton
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, address, phone, motion_days, virtual_appearance_default, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'SCJ',
    'Superior Court of Justice — Brampton (Family)',
    'SCJ Brampton',
    'Brampton',
    '7755 Hurontario Street, Brampton ON L6W 4T6',
    '905-456-4800',
    'Tuesday, Thursday',
    TRUE,
    TRUE
);

-- 3. SCJ Newmarket
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'SCJ',
    'Superior Court of Justice — Newmarket (Family)',
    'SCJ Newmarket',
    'Newmarket',
    TRUE
);

-- 4. SCJ Hamilton
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'SCJ',
    'Superior Court of Justice — Hamilton (Family)',
    'SCJ Hamilton',
    'Hamilton',
    TRUE
);

-- 5. SCJ Ottawa
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'SCJ',
    'Superior Court of Justice — Ottawa (Family)',
    'SCJ Ottawa',
    'Ottawa',
    TRUE
);

-- 6. SCJ London
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'SCJ',
    'Superior Court of Justice — London (Family)',
    'SCJ London',
    'London',
    TRUE
);

-- 7. OCJ Toronto
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, motion_days, notes, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'OCJ',
    'Ontario Court of Justice — Toronto',
    'OCJ Toronto',
    'Toronto',
    'N/A - OCJ does not hear contested motions',
    'Handles parenting and support (non-divorce), child protection. Cannot grant divorce or property division.',
    TRUE
);

-- 8. UFC Hamilton
INSERT INTO courts (jurisdiction_id, court_type, name, short_name, city, notes, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'UFC',
    'Family Court Branch (UFC) — Hamilton',
    'UFC Hamilton',
    'Hamilton',
    'Unified Family Court — handles all family matters in one court. Federally appointed judges.',
    TRUE
);

-- ============================================================
-- KNOWLEDGE BASE — Federal rules metadata (sample entries)
-- ============================================================

INSERT INTO knowledge_base (jurisdiction_id, source_name, source_type, reference, chunk_text, topic_tags, applies_to_provinces, court_types, official_url, is_active)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Divorce Act R.S.C. 1985 c.3',
    'statute',
    's.16(1) Divorce Act',
    'Best interests of the child — the court shall take into consideration only the best interests of the child of the marriage as determined by reference to the condition, means, needs and other circumstances of the child.',
    ARRAY['parenting','best_interests','custody'],
    ARRAY['all'],
    ARRAY['all'],
    'https://laws-lois.justice.gc.ca/eng/acts/d-3.4/page-6.html',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000001',
    'Divorce Act R.S.C. 1985 c.3',
    'statute',
    's.16(3) Divorce Act',
    'Maximum parenting time — the court shall give effect to the principle that a child should have as much time with each spouse as is consistent with the best interests of the child.',
    ARRAY['parenting','maximum_contact','parenting_time'],
    ARRAY['all'],
    ARRAY['all'],
    'https://laws-lois.justice.gc.ca/eng/acts/d-3.4/page-6.html',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000001',
    'Divorce Act R.S.C. 1985 c.3',
    'statute',
    's.15.1 Divorce Act',
    'Spousal support order — a court of competent jurisdiction may, on application by either or both spouses, make an order requiring a spouse to secure or pay, or to secure and pay, such lump sum or periodic sums, or such lump sum and periodic sums, as the court thinks reasonable for the support of the other spouse.',
    ARRAY['support','spousal_support'],
    ARRAY['all'],
    ARRAY['all'],
    'https://laws-lois.justice.gc.ca/eng/acts/d-3.4/page-5.html',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Family Law Rules O.Reg. 114/99',
    'regulation',
    'Rule 14(11)',
    'Motion materials must be served and filed at least 4 days before the motion date for a motion made on notice.',
    ARRAY['motions','deadlines','service'],
    ARRAY['ON'],
    ARRAY['SCJ','OCJ','UFC'],
    'https://www.ontario.ca/laws/regulation/990114',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Family Law Rules O.Reg. 114/99',
    'regulation',
    'Rule 17(14)',
    'A case conference brief (Form 17A or 17B) shall be served and filed not later than 2pm seven days before the conference date.',
    ARRAY['conference','case_conference','deadlines','forms'],
    ARRAY['ON'],
    ARRAY['SCJ','OCJ','UFC'],
    'https://www.ontario.ca/laws/regulation/990114',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Family Law Rules O.Reg. 114/99',
    'regulation',
    'Rule 13(1)',
    'Financial disclosure — every party to a case involving child support, spousal support, or the division of property shall serve and file a financial statement (Form 13 or 13.1) within the time set out in this rule.',
    ARRAY['disclosure','financial','support','property','forms'],
    ARRAY['ON'],
    ARRAY['SCJ','OCJ','UFC'],
    'https://www.ontario.ca/laws/regulation/990114',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000001',
    'Federal Child Support Guidelines SOR/97-175',
    'guideline',
    's.3(1) FCSG',
    'The amount of a child support order — Unless otherwise provided under these Guidelines, the amount of an order for the support of a child is the amount set out in the applicable table, based on the province where the paying spouse ordinarily resides.',
    ARRAY['child_support','guidelines','tables'],
    ARRAY['all'],
    ARRAY['all'],
    'https://laws-lois.justice.gc.ca/eng/regulations/SOR-97-175',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000001',
    'Spousal Support Advisory Guidelines',
    'ssag',
    'SSAG Without-Child Formula',
    'The without-child support formula — Amount ranges from 1.5 to 2 percent of the difference between the spouses gross incomes for each year of marriage (or cohabitation), up to a maximum of 50 percent for 25 or more years of marriage. Duration ranges from 0.5 to 1 year for each year of marriage, with the formula becoming indefinite (duration not specified) if the marriage has been 20 years or longer or if the years of marriage and age of the support recipient (at separation) total 65 or more (the rule of 65).',
    ARRAY['spousal_support','ssag','formula','duration'],
    ARRAY['all'],
    ARRAY['all'],
    NULL,
    TRUE
);
