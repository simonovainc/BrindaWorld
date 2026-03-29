-- ============================================================
-- Claritum S01: Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- Entity: Simonova Inc. o/a Claritum
-- Date: 2026-03-29
-- ============================================================

-- ============================================================
-- Enable RLS on ALL 16 tables
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE children_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfp_comparison ENABLE ROW LEVEL SECURITY;
ALTER TABLE parenting_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS — own row only
-- ============================================================
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_admin_all" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- JURISDICTIONS — public read, admin write
-- ============================================================
CREATE POLICY "jurisdictions_public_read" ON jurisdictions
    FOR SELECT USING (TRUE);

CREATE POLICY "jurisdictions_admin_write" ON jurisdictions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- COURTS — public read, admin write
-- ============================================================
CREATE POLICY "courts_public_read" ON courts
    FOR SELECT USING (TRUE);

CREATE POLICY "courts_admin_write" ON courts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- CASES — user owns directly
-- ============================================================
CREATE POLICY "cases_user_own" ON cases
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "cases_admin_all" ON cases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- PARTIES — user owns via case
-- ============================================================
CREATE POLICY "parties_user_own" ON parties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = parties.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "parties_admin_all" ON parties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- FACTS — user owns directly or via case
-- ============================================================
CREATE POLICY "facts_user_own" ON facts
    FOR ALL USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = facts.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "facts_admin_all" ON facts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- EVIDENCE — user owns directly or via case
-- ============================================================
CREATE POLICY "evidence_user_own" ON evidence
    FOR ALL USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = evidence.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "evidence_admin_all" ON evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- ISSUES — user owns via case
-- ============================================================
CREATE POLICY "issues_user_own" ON issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = issues.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "issues_admin_all" ON issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- EVENTS — user owns via case
-- ============================================================
CREATE POLICY "events_user_own" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = events.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "events_admin_all" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- DEADLINES — user owns via case
-- ============================================================
CREATE POLICY "deadlines_user_own" ON deadlines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = deadlines.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "deadlines_admin_all" ON deadlines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- PACKAGES — user owns via case
-- ============================================================
CREATE POLICY "packages_user_own" ON packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = packages.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "packages_admin_all" ON packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- SERVICE_LOG — user owns via case
-- ============================================================
CREATE POLICY "service_log_user_own" ON service_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = service_log.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "service_log_admin_all" ON service_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- CHILDREN_LOG — user owns via case
-- ============================================================
CREATE POLICY "children_log_user_own" ON children_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = children_log.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "children_log_admin_all" ON children_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- NFP_COMPARISON — user owns via case
-- ============================================================
CREATE POLICY "nfp_comparison_user_own" ON nfp_comparison
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = nfp_comparison.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "nfp_comparison_admin_all" ON nfp_comparison
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- PARENTING_PLAN — user owns via case
-- ============================================================
CREATE POLICY "parenting_plan_user_own" ON parenting_plan
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = parenting_plan.case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "parenting_plan_admin_all" ON parenting_plan
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );

-- ============================================================
-- KNOWLEDGE_BASE — public read (active only), admin write
-- ============================================================
CREATE POLICY "knowledge_base_public_read" ON knowledge_base
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "knowledge_base_admin_write" ON knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.subscription_tier = 'admin'
        )
    );
