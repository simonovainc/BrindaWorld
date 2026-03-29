-- ============================================================
-- Claritum S01: Complete Database Schema
-- Migration: 001_initial_schema.sql
-- Entity: Simonova Inc. o/a Claritum
-- Date: 2026-03-29
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE 1: users
-- Purpose: Authentication anchor + subscription state
-- ============================================================
CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                   TEXT UNIQUE NOT NULL,
    full_name               TEXT NOT NULL DEFAULT '',
    phone                   TEXT DEFAULT NULL,
    preferred_language      TEXT NOT NULL DEFAULT 'en',
    subscription_tier       TEXT NOT NULL DEFAULT 'free'
        CHECK (subscription_tier IN ('free','essential','professional','trial_ready','paralegal','firm','admin')),
    subscription_status     TEXT NOT NULL DEFAULT 'active'
        CHECK (subscription_status IN ('active','cancelled','paused','past_due')),
    stripe_customer_id      TEXT UNIQUE DEFAULT NULL,
    stripe_subscription_id  TEXT DEFAULT NULL,
    subscription_started_at TIMESTAMPTZ DEFAULT NULL,
    subscription_ends_at    TIMESTAMPTZ DEFAULT NULL,
    trial_ends_at           TIMESTAMPTZ DEFAULT NULL,
    facts_count             INTEGER NOT NULL DEFAULT 0,
    cases_count             INTEGER NOT NULL DEFAULT 0,
    storage_used_bytes      BIGINT NOT NULL DEFAULT 0,
    last_login_at           TIMESTAMPTZ DEFAULT NULL,
    onboarding_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 2: jurisdictions
-- Purpose: Federal and provincial jurisdiction configs
-- ============================================================
CREATE TABLE jurisdictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                TEXT UNIQUE NOT NULL,
    name                TEXT NOT NULL,
    type                TEXT NOT NULL
        CHECK (type IN ('federal','provincial','territorial')),
    country             TEXT NOT NULL DEFAULT 'CA',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    parent_id           UUID REFERENCES jurisdictions(id),
    primary_legislation TEXT NOT NULL DEFAULT '',
    court_forms_url     TEXT NOT NULL DEFAULT '',
    rules_url           TEXT NOT NULL DEFAULT '',
    legal_aid_url       TEXT NOT NULL DEFAULT '',
    official_court_url  TEXT NOT NULL DEFAULT '',
    notes               TEXT DEFAULT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: courts
-- Purpose: Court intelligence for every court location
-- ============================================================
CREATE TABLE courts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id             UUID NOT NULL REFERENCES jurisdictions(id),
    court_type                  TEXT NOT NULL
        CHECK (court_type IN ('OCJ','SCJ','UFC','COA','SCC','KBD','other')),
    name                        TEXT NOT NULL,
    short_name                  TEXT NOT NULL DEFAULT '',
    city                        TEXT NOT NULL,
    address                     TEXT NOT NULL DEFAULT '',
    phone                       TEXT DEFAULT NULL,
    fax                         TEXT DEFAULT NULL,
    email                       TEXT DEFAULT NULL,
    website_url                 TEXT DEFAULT NULL,
    filing_portal_url           TEXT DEFAULT NULL,
    practice_direction_url      TEXT DEFAULT NULL,
    scheduling_url              TEXT DEFAULT NULL,
    motion_days                 TEXT DEFAULT NULL,
    virtual_appearance_default  BOOLEAN DEFAULT TRUE,
    in_person_required_from     DATE DEFAULT NULL,
    duty_counsel_hours          TEXT DEFAULT NULL,
    duty_counsel_url            TEXT DEFAULT NULL,
    hours_of_operation          TEXT DEFAULT NULL,
    notes                       TEXT DEFAULT NULL,
    last_verified_at            TIMESTAMPTZ DEFAULT NULL,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: cases
-- Purpose: One row per legal matter
-- ============================================================
CREATE TABLE cases (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id),
    jurisdiction_id       UUID NOT NULL REFERENCES jurisdictions(id),
    court_id              UUID REFERENCES courts(id),
    case_type             TEXT NOT NULL DEFAULT 'family'
        CHECK (case_type IN ('family','civil','employment','other')),
    case_subtype          TEXT DEFAULT NULL,
    title                 TEXT NOT NULL DEFAULT 'My Case',
    court_file_number     TEXT DEFAULT NULL,
    court_level           TEXT DEFAULT NULL
        CHECK (court_level IN ('OCJ','SCJ','UFC','KBD','COA','SCC','other',NULL)),
    stage                 TEXT NOT NULL DEFAULT 'intake'
        CHECK (stage IN ('intake','application','first_appearance','case_conference',
            'settlement_conference','motion','trial_management','trial','appeal',
            'enforcement','closed')),
    is_applicant          BOOLEAN DEFAULT TRUE,
    date_of_marriage      DATE DEFAULT NULL,
    date_of_separation    DATE DEFAULT NULL,
    date_of_divorce       DATE DEFAULT NULL,
    children_involved     BOOLEAN NOT NULL DEFAULT FALSE,
    children_count        INTEGER NOT NULL DEFAULT 0,
    property_claim        BOOLEAN NOT NULL DEFAULT FALSE,
    support_claim         BOOLEAN NOT NULL DEFAULT FALSE,
    divorce_claim         BOOLEAN NOT NULL DEFAULT FALSE,
    violence_involved     BOOLEAN NOT NULL DEFAULT FALSE,
    cas_involved          BOOLEAN NOT NULL DEFAULT FALSE,
    police_involved       BOOLEAN NOT NULL DEFAULT FALSE,
    urgency_level         TEXT NOT NULL DEFAULT 'normal'
        CHECK (urgency_level IN ('emergency','urgent','normal','low')),
    resolve_score         INTEGER DEFAULT NULL,
    case_strength         INTEGER DEFAULT NULL,
    estimated_cost_low    DECIMAL(10,2) DEFAULT NULL,
    estimated_cost_high   DECIMAL(10,2) DEFAULT NULL,
    notes                 TEXT DEFAULT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 5: parties
-- Purpose: Every person in a case
-- ============================================================
CREATE TABLE parties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID NOT NULL REFERENCES cases(id),
    role            TEXT NOT NULL
        CHECK (role IN ('applicant','respondent','child','lawyer_applicant',
            'lawyer_respondent','ocl','cas_worker','police','doctor','school',
            'mediator','assessor','process_server','witness','other')),
    full_name       TEXT NOT NULL,
    date_of_birth   DATE DEFAULT NULL,
    gender          TEXT DEFAULT NULL,
    address         TEXT DEFAULT NULL,
    city            TEXT DEFAULT NULL,
    province        TEXT DEFAULT NULL,
    postal_code     TEXT DEFAULT NULL,
    phone           TEXT DEFAULT NULL,
    email           TEXT DEFAULT NULL,
    employer        TEXT DEFAULT NULL,
    lawyer_name     TEXT DEFAULT NULL,
    lawyer_firm     TEXT DEFAULT NULL,
    lawyer_address  TEXT DEFAULT NULL,
    lawyer_phone    TEXT DEFAULT NULL,
    lawyer_email    TEXT DEFAULT NULL,
    lso_number      TEXT DEFAULT NULL,
    notes           TEXT DEFAULT NULL,
    is_primary_user BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 6: facts
-- Purpose: The atomic unit of everything
-- ============================================================
CREATE TABLE facts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID NOT NULL REFERENCES cases(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    statement           TEXT NOT NULL,
    category            TEXT NOT NULL DEFAULT 'general'
        CHECK (category IN ('parenting','property','support','disclosure','safety',
            'violation','communication','financial','medical','legal_proceeding',
            'police','cas','children','employment','general')),
    date_occurred       DATE DEFAULT NULL,
    date_discovered     DATE DEFAULT NULL,
    legal_weight        TEXT NOT NULL DEFAULT 'medium'
        CHECK (legal_weight IN ('critical','high','medium','low','inadmissible')),
    evidence_strength   TEXT NOT NULL DEFAULT 'circumstantial'
        CHECK (evidence_strength IN ('direct','strong','circumstantial','weak','inadmissible')),
    urgency             TEXT NOT NULL DEFAULT 'normal'
        CHECK (urgency IN ('emergency','urgent','important','normal','low')),
    value_score         INTEGER NOT NULL DEFAULT 5,
    emotional_flag      BOOLEAN NOT NULL DEFAULT FALSE,
    legal_remedy_exists BOOLEAN DEFAULT NULL,
    parties_involved    UUID[] DEFAULT '{}',
    is_confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_date   TIMESTAMPTZ DEFAULT NULL,
    exhibit_number      TEXT DEFAULT NULL,
    used_in_packages    UUID[] DEFAULT '{}',
    notes               TEXT DEFAULT NULL,
    source              TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual','email_intake','ocr_extracted','ai_suggested','voice')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 7: evidence
-- Purpose: Documents and files attached to facts
-- ============================================================
CREATE TABLE evidence (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_id             UUID REFERENCES facts(id),
    case_id             UUID NOT NULL REFERENCES cases(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    file_name           TEXT NOT NULL,
    file_type           TEXT NOT NULL,
    mime_type           TEXT NOT NULL,
    file_size_bytes     BIGINT NOT NULL DEFAULT 0,
    storage_path        TEXT NOT NULL,
    storage_bucket      TEXT NOT NULL DEFAULT 'evidence',
    ocr_text            TEXT DEFAULT NULL,
    ocr_completed       BOOLEAN NOT NULL DEFAULT FALSE,
    ai_extracted        BOOLEAN NOT NULL DEFAULT FALSE,
    extraction_summary  TEXT DEFAULT NULL,
    exhibit_number      TEXT DEFAULT NULL,
    document_date       DATE DEFAULT NULL,
    document_type       TEXT DEFAULT NULL,
    parties_mentioned   UUID[] DEFAULT '{}',
    key_values          JSONB DEFAULT '{}',
    checksum            TEXT DEFAULT NULL,
    is_privileged       BOOLEAN NOT NULL DEFAULT FALSE,
    virus_scanned       BOOLEAN NOT NULL DEFAULT FALSE,
    virus_scan_result   TEXT DEFAULT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 8: issues
-- Purpose: Legal issues triaged from the 100-problem dump
-- ============================================================
CREATE TABLE issues (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id           UUID NOT NULL REFERENCES cases(id),
    title             TEXT NOT NULL,
    description       TEXT DEFAULT NULL,
    category          TEXT NOT NULL DEFAULT 'general'
        CHECK (category IN ('parenting','property','support','divorce','disclosure',
            'enforcement','safety','variation','procedural','general')),
    value_score       INTEGER NOT NULL DEFAULT 5,
    urgency_score     INTEGER NOT NULL DEFAULT 5,
    quadrant          TEXT DEFAULT NULL
        CHECK (quadrant IN ('high_value_urgent','high_value_not_urgent',
            'low_value_urgent','noise',NULL)),
    has_legal_remedy  BOOLEAN DEFAULT NULL,
    emotional_only    BOOLEAN NOT NULL DEFAULT FALSE,
    status            TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','in_progress','resolved','withdrawn','deferred')),
    resolution_path   TEXT DEFAULT NULL,
    related_fact_ids  UUID[] DEFAULT '{}',
    priority_rank     INTEGER DEFAULT NULL,
    court_order_sought TEXT DEFAULT NULL,
    notes             TEXT DEFAULT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 9: events
-- Purpose: All court events and deadlines
-- ============================================================
CREATE TABLE events (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id                 UUID NOT NULL REFERENCES cases(id),
    court_id                UUID REFERENCES courts(id),
    event_type              TEXT NOT NULL
        CHECK (event_type IN ('first_appearance','case_conference','settlement_conference',
            'motion_14b','motion_regular','motion_long','motion_urgent',
            'trial_management','trial','binding_jdr','appeal','enforcement','other')),
    title                   TEXT NOT NULL,
    event_date              TIMESTAMPTZ NOT NULL,
    event_time              TEXT DEFAULT NULL,
    duration_minutes        INTEGER DEFAULT NULL,
    location                TEXT DEFAULT NULL,
    courtroom               TEXT DEFAULT NULL,
    judge_name              TEXT DEFAULT NULL,
    is_confirmed            BOOLEAN NOT NULL DEFAULT FALSE,
    outcome                 TEXT DEFAULT NULL,
    outcome_notes           TEXT DEFAULT NULL,
    package_id              UUID DEFAULT NULL,
    appearance_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
    notes                   TEXT DEFAULT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 10: deadlines
-- Purpose: All calculated deadlines
-- ============================================================
CREATE TABLE deadlines (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id                 UUID NOT NULL REFERENCES cases(id),
    event_id                UUID REFERENCES events(id),
    title                   TEXT NOT NULL,
    description             TEXT DEFAULT NULL,
    deadline_date           DATE NOT NULL,
    deadline_time           TEXT DEFAULT NULL,
    governing_rule          TEXT DEFAULT NULL,
    is_hard_deadline        BOOLEAN NOT NULL DEFAULT TRUE,
    consequence             TEXT DEFAULT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','completed','missed','waived')),
    completed_at            TIMESTAMPTZ DEFAULT NULL,
    alert_sent_14_days      BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_7_days       BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_48_hours     BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_day_of       BOOLEAN NOT NULL DEFAULT FALSE,
    form_required           TEXT DEFAULT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: packages
-- Purpose: Generated court packages
-- ============================================================
CREATE TABLE packages (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id               UUID NOT NULL REFERENCES cases(id),
    event_id              UUID REFERENCES events(id),
    package_type          TEXT NOT NULL
        CHECK (package_type IN ('conference_brief','motion_14b','motion_regular',
            'motion_long','trial_record','separation_agreement','parenting_plan',
            'disclosure_demand','motion_to_compel','substituted_service',
            'cost_outline','other')),
    title                 TEXT NOT NULL,
    status                TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','reviewing','complete','filed','superseded')),
    completeness_score    INTEGER DEFAULT 0,
    completeness_issues   JSONB DEFAULT '[]',
    facts_used            UUID[] DEFAULT '{}',
    evidence_used         UUID[] DEFAULT '{}',
    issues_addressed      UUID[] DEFAULT '{}',
    ai_draft              TEXT DEFAULT NULL,
    user_edited           TEXT DEFAULT NULL,
    final_content         TEXT DEFAULT NULL,
    form_numbers          TEXT[] DEFAULT '{}',
    filing_portal         TEXT DEFAULT NULL,
    filing_instructions   TEXT DEFAULT NULL,
    generate_version      INTEGER NOT NULL DEFAULT 1,
    last_generated_at     TIMESTAMPTZ DEFAULT NULL,
    finalized_at          TIMESTAMPTZ DEFAULT NULL,
    downloaded_at         TIMESTAMPTZ DEFAULT NULL,
    filed_at              TIMESTAMPTZ DEFAULT NULL,
    notes                 TEXT DEFAULT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 12: service_log
-- Purpose: Track service of every document
-- ============================================================
CREATE TABLE service_log (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id                 UUID NOT NULL REFERENCES cases(id),
    package_id              UUID REFERENCES packages(id),
    document_name           TEXT NOT NULL,
    service_type            TEXT NOT NULL
        CHECK (service_type IN ('special','regular','substituted','dispensed','hague','international')),
    served_by_name          TEXT NOT NULL DEFAULT '',
    served_by_type          TEXT DEFAULT NULL,
    served_on_party_id      UUID REFERENCES parties(id),
    served_on_name          TEXT NOT NULL DEFAULT '',
    served_date             DATE DEFAULT NULL,
    served_time             TEXT DEFAULT NULL,
    service_method          TEXT DEFAULT NULL,
    service_address         TEXT DEFAULT NULL,
    received_by             TEXT DEFAULT NULL,
    identity_confirmed      BOOLEAN DEFAULT FALSE,
    documents_refused       BOOLEAN DEFAULT FALSE,
    refusal_notes           TEXT DEFAULT NULL,
    form_6b_completed       BOOLEAN NOT NULL DEFAULT FALSE,
    form_6b_commissioned    BOOLEAN NOT NULL DEFAULT FALSE,
    form_6b_filed           BOOLEAN NOT NULL DEFAULT FALSE,
    form_6b_filed_date      DATE DEFAULT NULL,
    evidence_id             UUID REFERENCES evidence(id),
    attempt_number          INTEGER NOT NULL DEFAULT 1,
    successful              BOOLEAN DEFAULT NULL,
    failure_reason          TEXT DEFAULT NULL,
    notes                   TEXT DEFAULT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 13: children_log
-- Purpose: Continuous children interaction tracking
-- ============================================================
CREATE TABLE children_log (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id                 UUID NOT NULL REFERENCES cases(id),
    child_party_id          UUID REFERENCES parties(id),
    log_date                DATE NOT NULL,
    log_time                TEXT DEFAULT NULL,
    log_type                TEXT NOT NULL
        CHECK (log_type IN ('parenting_time','contact_call','contact_video','exchange',
            'school_event','medical','communication_parent','incident','activity',
            'refusal','child_statement','general')),
    with_parent             TEXT DEFAULT NULL,
    description             TEXT NOT NULL,
    duration_minutes        INTEGER DEFAULT NULL,
    location                TEXT DEFAULT NULL,
    outcome                 TEXT DEFAULT NULL,
    child_emotional_state   TEXT DEFAULT NULL,
    incident_flagged        BOOLEAN NOT NULL DEFAULT FALSE,
    cas_reportable          BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_id             UUID REFERENCES evidence(id),
    fact_id                 UUID REFERENCES facts(id),
    flagged_for_plan        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 14: nfp_comparison
-- Purpose: Live Form 13C engine
-- ============================================================
CREATE TABLE nfp_comparison (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id               UUID NOT NULL REFERENCES cases(id),
    asset_name            TEXT NOT NULL,
    asset_category        TEXT NOT NULL
        CHECK (asset_category IN ('real_property','rrsp_rrif','tfsa','pension',
            'bank_account','investment','business','vehicle','digital_asset',
            'life_insurance','personal_property','debt','other')),
    valuation_date        TEXT NOT NULL
        CHECK (valuation_date IN ('date_of_marriage','date_of_separation','current')),
    applicant_value       DECIMAL(15,2) DEFAULT NULL,
    respondent_value      DECIMAL(15,2) DEFAULT NULL,
    agreed_value          DECIMAL(15,2) DEFAULT NULL,
    is_disputed           BOOLEAN NOT NULL DEFAULT FALSE,
    dispute_reason        TEXT DEFAULT NULL,
    is_excluded           BOOLEAN NOT NULL DEFAULT FALSE,
    exclusion_reason      TEXT DEFAULT NULL,
    evidence_id           UUID REFERENCES evidence(id),
    valuation_method      TEXT DEFAULT NULL,
    valuation_date_actual DATE DEFAULT NULL,
    notes                 TEXT DEFAULT NULL,
    last_updated          TIMESTAMPTZ DEFAULT NOW(),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 15: parenting_plan
-- Purpose: Versioned parenting plan builder
-- ============================================================
CREATE TABLE parenting_plan (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id                     UUID NOT NULL REFERENCES cases(id),
    version                     INTEGER NOT NULL DEFAULT 1,
    status                      TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','proposed','negotiating','agreed','ordered','superseded')),
    schedule_type               TEXT DEFAULT NULL,
    applicant_parenting_pct     DECIMAL(5,2) DEFAULT NULL,
    respondent_parenting_pct    DECIMAL(5,2) DEFAULT NULL,
    schedule_json               JSONB DEFAULT '{}',
    holiday_schedule            JSONB DEFAULT '{}',
    communication_protocol      JSONB DEFAULT '{}',
    exchange_location           TEXT DEFAULT NULL,
    exchange_method             TEXT DEFAULT NULL,
    decision_making             TEXT DEFAULT NULL,
    special_provisions          JSONB DEFAULT '[]',
    data_period_start           DATE DEFAULT NULL,
    data_period_end             DATE DEFAULT NULL,
    log_entries_count           INTEGER DEFAULT 0,
    proposed_to_other_party     BOOLEAN DEFAULT FALSE,
    proposed_at                 TIMESTAMPTZ DEFAULT NULL,
    other_party_response        TEXT DEFAULT NULL,
    court_ordered               BOOLEAN DEFAULT FALSE,
    order_date                  DATE DEFAULT NULL,
    notes                       TEXT DEFAULT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- TABLE 16: knowledge_base
-- Purpose: RAG knowledge store for all legal content
-- ============================================================
CREATE TABLE knowledge_base (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id     UUID REFERENCES jurisdictions(id),
    source_name         TEXT NOT NULL,
    source_type         TEXT NOT NULL
        CHECK (source_type IN ('statute','regulation','practice_direction','court_form',
            'guideline','ssag','advisory','procedure','other')),
    reference           TEXT NOT NULL,
    chunk_text          TEXT NOT NULL,
    embedding           vector(1536),
    topic_tags          TEXT[] DEFAULT '{}',
    applies_to_provinces TEXT[] DEFAULT '{all}',
    court_types         TEXT[] DEFAULT '{all}',
    official_url        TEXT DEFAULT NULL,
    version_date        DATE DEFAULT NULL,
    last_verified_at    TIMESTAMPTZ DEFAULT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    token_count         INTEGER DEFAULT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Cases
CREATE INDEX idx_cases_user_id ON cases(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_jurisdiction ON cases(jurisdiction_id);
CREATE INDEX idx_cases_court ON cases(court_id) WHERE court_id IS NOT NULL;

-- Parties
CREATE INDEX idx_parties_case_id ON parties(case_id) WHERE deleted_at IS NULL;

-- Facts
CREATE INDEX idx_facts_case_id ON facts(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_facts_user_id ON facts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_facts_category ON facts(case_id, category);
CREATE INDEX idx_facts_legal_weight ON facts(case_id, legal_weight);
CREATE INDEX idx_facts_urgency ON facts(case_id, urgency);
CREATE INDEX idx_facts_date_occurred ON facts(case_id, date_occurred) WHERE date_occurred IS NOT NULL;
CREATE INDEX idx_facts_confirmed ON facts(case_id, is_confirmed);

-- Evidence
CREATE INDEX idx_evidence_case_id ON evidence(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_evidence_fact_id ON evidence(fact_id) WHERE fact_id IS NOT NULL;
CREATE INDEX idx_evidence_user_id ON evidence(user_id);

-- Issues
CREATE INDEX idx_issues_case_id ON issues(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_category ON issues(case_id, category);
CREATE INDEX idx_issues_status ON issues(case_id, status);

-- Events
CREATE INDEX idx_events_case_id ON events(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_date ON events(case_id, event_date);
CREATE INDEX idx_events_court ON events(court_id) WHERE court_id IS NOT NULL;

-- Deadlines
CREATE INDEX idx_deadlines_case_id ON deadlines(case_id);
CREATE INDEX idx_deadlines_date ON deadlines(deadline_date, status);
CREATE INDEX idx_deadlines_alerts ON deadlines(deadline_date)
    WHERE status = 'pending'
    AND (alert_sent_14_days = FALSE OR alert_sent_7_days = FALSE
         OR alert_sent_48_hours = FALSE OR alert_sent_day_of = FALSE);

-- Packages
CREATE INDEX idx_packages_case_id ON packages(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_packages_event ON packages(event_id) WHERE event_id IS NOT NULL;

-- Service Log
CREATE INDEX idx_service_log_case_id ON service_log(case_id);
CREATE INDEX idx_service_log_package ON service_log(package_id) WHERE package_id IS NOT NULL;

-- Children Log
CREATE INDEX idx_children_log_case_id ON children_log(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_children_log_date ON children_log(case_id, log_date);
CREATE INDEX idx_children_log_type ON children_log(case_id, log_type);
CREATE INDEX idx_children_log_child ON children_log(child_party_id) WHERE child_party_id IS NOT NULL;

-- NFP Comparison
CREATE INDEX idx_nfp_case ON nfp_comparison(case_id, valuation_date) WHERE deleted_at IS NULL;

-- Parenting Plan
CREATE INDEX idx_parenting_plan_case ON parenting_plan(case_id) WHERE deleted_at IS NULL;

-- Knowledge Base
CREATE INDEX idx_knowledge_jurisdiction ON knowledge_base(jurisdiction_id) WHERE is_active = TRUE;
CREATE INDEX idx_knowledge_source_type ON knowledge_base(source_type) WHERE is_active = TRUE;
CREATE INDEX idx_knowledge_topic_tags ON knowledge_base USING GIN(topic_tags) WHERE is_active = TRUE;
CREATE INDEX idx_knowledge_embedding ON knowledge_base
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Courts
CREATE INDEX idx_courts_jurisdiction ON courts(jurisdiction_id) WHERE is_active = TRUE;
CREATE INDEX idx_courts_type ON courts(court_type) WHERE is_active = TRUE;

-- Jurisdictions
CREATE INDEX idx_jurisdictions_code ON jurisdictions(code);
CREATE INDEX idx_jurisdictions_parent ON jurisdictions(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_jurisdictions_updated_at BEFORE UPDATE ON jurisdictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_courts_updated_at BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_parties_updated_at BEFORE UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_facts_updated_at BEFORE UPDATE ON facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_evidence_updated_at BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_deadlines_updated_at BEFORE UPDATE ON deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_service_log_updated_at BEFORE UPDATE ON service_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_children_log_updated_at BEFORE UPDATE ON children_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_nfp_comparison_updated_at BEFORE UPDATE ON nfp_comparison
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_parenting_plan_updated_at BEFORE UPDATE ON parenting_plan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
