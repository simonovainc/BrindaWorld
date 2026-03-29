-- ============================================================
-- Claritum S01: Schema Verification Tests
-- File: tests/s01_schema_verification.sql
-- Entity: Simonova Inc. o/a Claritum
-- Date: 2026-03-29
--
-- Run against Supabase SQL editor or psql to verify
-- schema integrity, RLS isolation, and performance.
-- ============================================================

-- ============================================================
-- TEST 1: Verify all 16 tables exist
-- Expected: 16 rows
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================
-- TEST 2: Verify RLS is enabled on all 16 tables
-- Expected: ALL rows show rowsecurity = TRUE
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- TEST 3: Verify seed data — jurisdictions
-- Expected: 13 jurisdictions (1 federal + 10 provinces + 2 territories + Nunavut)
-- ============================================================
SELECT code, name, type, is_active, sort_order
FROM jurisdictions
ORDER BY sort_order;

-- ============================================================
-- TEST 4: Verify seed data — Ontario courts
-- Expected: 8 courts
-- ============================================================
SELECT name, court_type, city, is_active
FROM courts
WHERE jurisdiction_id = 'a0000000-0000-0000-0000-000000000002'
ORDER BY name;

-- ============================================================
-- TEST 5: Verify seed data — knowledge base entries
-- Expected: 8 entries
-- ============================================================
SELECT source_name, reference, source_type
FROM knowledge_base
ORDER BY source_name, reference;

-- ============================================================
-- TEST 6: Federal + Ontario jurisdiction routing (Scenario 1)
-- Insert a test case, verify parent join works
-- Expected: Returns Ontario data AND federal via parent_id
-- ============================================================
SELECT
    child.code AS province_code,
    child.name AS province_name,
    child.primary_legislation AS provincial_law,
    parent.code AS federal_code,
    parent.name AS federal_name,
    parent.primary_legislation AS federal_law
FROM jurisdictions child
JOIN jurisdictions parent ON child.parent_id = parent.id
WHERE child.code = 'CA_ON';

-- ============================================================
-- TEST 7: Check all column counts per table
-- Verify table structure matches spec
-- ============================================================
SELECT
    t.table_name,
    COUNT(c.column_name) AS column_count
FROM information_schema.tables t
JOIN information_schema.columns c
    ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================
-- TEST 8: Verify CHECK constraints exist
-- Expected: Multiple CHECK constraints per table
-- ============================================================
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================
-- TEST 9: Verify foreign key relationships
-- Expected: All FK constraints present
-- ============================================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================
-- TEST 10: Verify indexes exist
-- Expected: All performance indexes created
-- ============================================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================
-- TEST 11: Verify RLS policies exist
-- Expected: At least 2 policies per table (user + admin)
-- ============================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- TEST 12: Verify updated_at triggers exist on all tables
-- Expected: 16 triggers
-- ============================================================
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_%_updated_at'
ORDER BY event_object_table;

-- ============================================================
-- TEST 13: Verify pgvector extension is available
-- Expected: vector extension present
-- ============================================================
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

-- ============================================================
-- TEST 14: Verify uuid-ossp extension is available
-- Expected: uuid-ossp extension present
-- ============================================================
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'uuid-ossp';

-- ============================================================
-- SCENARIO 2: RLS breach attempt
-- NOTE: This must be run as an authenticated user (user_b)
-- attempting to access user_a's data.
--
-- Setup (run with service_role / admin):
--   INSERT INTO users (id, email) VALUES
--     ('b0000000-0000-0000-0000-000000000001', 'user_a@test.com'),
--     ('b0000000-0000-0000-0000-000000000002', 'user_b@test.com');
--
--   INSERT INTO cases (id, user_id, jurisdiction_id, title) VALUES
--     ('c0000000-0000-0000-0000-000000000001',
--      'b0000000-0000-0000-0000-000000000001',
--      'a0000000-0000-0000-0000-000000000002',
--      'User A Case');
--
--   INSERT INTO facts (case_id, user_id, statement) VALUES
--     ('c0000000-0000-0000-0000-000000000001',
--      'b0000000-0000-0000-0000-000000000001',
--      'User A secret fact 1'),
--     ... (repeat for 5 facts)
--
-- Then authenticate as user_b and run:
--   SELECT * FROM facts;
--   -- Expected: 0 rows (user_b has no cases)
--
--   UPDATE facts SET statement = 'hacked'
--   WHERE case_id IN (
--     SELECT id FROM cases
--     WHERE user_id = 'b0000000-0000-0000-0000-000000000001'
--   );
--   -- Expected: 0 rows affected
-- ============================================================

-- ============================================================
-- SCENARIO 3: Soft delete integrity
-- NOTE: Run with service_role for setup.
--
-- Setup:
--   -- Create user, case, 5 facts
--   -- Soft-delete the case:
--   UPDATE cases SET deleted_at = NOW()
--   WHERE id = 'c0000000-0000-0000-0000-000000000001';
--
-- Verify visible facts (non-deleted):
--   SELECT COUNT(*) FROM facts
--   WHERE case_id = 'c0000000-0000-0000-0000-000000000001'
--     AND deleted_at IS NULL;
--   -- Expected: 5 (facts not cascade-deleted; soft delete
--   --           is per-table, case deleted_at doesn't hide facts)
--
-- Verify data preserved with admin:
--   SELECT COUNT(*) FROM facts
--   WHERE case_id = 'c0000000-0000-0000-0000-000000000001';
--   -- Expected: 5 (all data intact)
--
-- Verify case is soft-deleted:
--   SELECT id, title, deleted_at FROM cases
--   WHERE id = 'c0000000-0000-0000-0000-000000000001';
--   -- Expected: 1 row with deleted_at set
-- ============================================================

-- ============================================================
-- PERFORMANCE TEST: Query 10,000 facts
-- NOTE: Insert 10,000 test facts first, then run:
--
--   EXPLAIN ANALYZE
--   SELECT * FROM facts
--   WHERE case_id = '[test_case_id]'
--     AND deleted_at IS NULL;
--
-- Expected: < 50ms with index scan on idx_facts_case_id
-- Record actual timing in S01_SCHEMA_REPORT.md
-- ============================================================

-- ============================================================
-- PERFORMANCE TEST: pgvector similarity search
-- NOTE: Insert 10 test entries with embeddings, then run:
--
--   EXPLAIN ANALYZE
--   SELECT id, source_name, reference, chunk_text,
--          1 - (embedding <=> '[test_vector]'::vector) AS similarity
--   FROM knowledge_base
--   WHERE is_active = TRUE
--   ORDER BY embedding <=> '[test_vector]'::vector
--   LIMIT 3;
--
-- Expected: < 200ms
-- Record actual timing in S01_SCHEMA_REPORT.md
-- ============================================================
