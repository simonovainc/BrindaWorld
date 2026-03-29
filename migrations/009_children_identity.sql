-- ============================================================
-- 009_children_identity.sql  –  CMMI Level 5 Children Identity
-- BrindaWorld Platform
-- Must run after 001_operational.sql (children table)
--
-- Changes:
--   1. Add public_id UUID column (stable external identifier)
--   2. Add display_name column (nickname / alternate label)
--   3. Unique index: active children per parent cannot share a name
--      (NULL deleted_at = active; allows re-add after soft-delete)
--   4. Unique index on children.public_id
--   5. Unique index on users.email (guard for email uniqueness)
-- ============================================================

-- 1. Stable external UUID — never expose internal numeric id externally
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS public_id VARCHAR(36) NULL AFTER id;

-- 2. Optional nickname / display label (max 60 chars, NULL = use name)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(60) NULL AFTER name;

-- 3. Unique index: (parent_user_id, name) among active (non-deleted) rows
--    Because MySQL unique indexes treat each NULL as distinct, we cannot
--    directly use deleted_at in a partial index the way PostgreSQL can.
--    Strategy: use a deterministic sentinel value for deleted rows.
--
--    Add a soft-delete sentinel column that is:
--      • '' (empty string) when the row is active
--      • the deleted_at timestamp as a VARCHAR when soft-deleted
--    This lets us place the unique constraint on (parent_user_id, name, active_sentinel)
--    so two active siblings cannot share a name, but a deleted name may be reused.
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS active_sentinel VARCHAR(26) NOT NULL DEFAULT '' AFTER deleted_at;

-- Back-fill: any already-deleted rows get a sentinel so they don't block uniqueness
UPDATE children
SET    active_sentinel = DATE_FORMAT(deleted_at, '%Y-%m-%d %H:%i:%s')
WHERE  deleted_at IS NOT NULL AND active_sentinel = '';

-- 4. The uniqueness constraint itself
--    (Two active children of the same parent cannot have the same name)
CREATE UNIQUE INDEX IF NOT EXISTS uq_children_active_name
  ON children (parent_user_id, name, active_sentinel);

-- 5. Unique index on children.public_id (populated at INSERT time via UUID())
CREATE UNIQUE INDEX IF NOT EXISTS uq_children_public_id
  ON children (public_id);

-- 6. Ensure users.email is unique (defence-in-depth beyond Supabase)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email
  ON users (email);
