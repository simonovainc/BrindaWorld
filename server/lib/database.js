/**
 * Claritum — Supabase Client Initialization
 * Entity: Simonova Inc. o/a Claritum
 *
 * Provides:
 * - Supabase client (anon key for frontend-safe calls)
 * - Supabase admin client (service_role for server-side operations)
 * - Connection test function
 * - Health check helper
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set.'
  );
}

/** Public client — respects RLS, safe for authenticated user context. */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Admin client — bypasses RLS. NEVER expose to frontend. */
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

/**
 * Tests the database connection by running a simple query.
 * @returns {{ ok: boolean, latencyMs: number, error?: string }}
 */
async function testConnection() {
  const start = Date.now();
  try {
    const { error } = await supabase.from('jurisdictions').select('id').limit(1);
    const latencyMs = Date.now() - start;
    if (error) {
      return { ok: false, latencyMs, error: error.message };
    }
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

/**
 * Returns row counts for all 16 public tables.
 * Requires the admin client (service_role) to bypass RLS.
 * @returns {{ ok: boolean, tables: Record<string, number>, error?: string }}
 */
async function getTableCounts() {
  const client = supabaseAdmin || supabase;
  const tableNames = [
    'users', 'jurisdictions', 'courts', 'cases', 'parties',
    'facts', 'evidence', 'issues', 'events', 'deadlines',
    'packages', 'service_log', 'children_log', 'nfp_comparison',
    'parenting_plan', 'knowledge_base',
  ];

  try {
    const counts = {};
    for (const table of tableNames) {
      const { count, error } = await client
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        counts[table] = -1;
      } else {
        counts[table] = count ?? 0;
      }
    }
    return { ok: true, tables: counts };
  } catch (err) {
    return { ok: false, tables: {}, error: err.message };
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  getTableCounts,
};
