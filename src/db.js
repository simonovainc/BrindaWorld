/**
 * db.js — MySQL connection pool + graceful degradation helpers
 * CMMI L5: never crash the process; surface DB outages as 503.
 *
 * Exports
 * ───────
 *   pool                  — raw mysql2 pool (use for transactions)
 *   safeQuery(sql, params) — wraps pool.query(); throws ServiceUnavailableError
 *                           if MySQL is unreachable so the global error handler
 *                           can return HTTP 503 instead of a 500 stack trace
 *   testConnection()      — called on server start; logs result only
 *   ServiceUnavailableError — custom error class; caught in index.js
 */

'use strict';

const mysql = require('mysql2/promise');

// ── Error codes that mean "MySQL is down / unreachable" ───────────────────────
const DB_DOWN_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_ACCESS_DENIED_ERROR',
  'ER_NO_DB_ERROR',
  'POOL_CLOSED',
]);

// ── Custom error class — caught by global error handler in index.js ───────────
class ServiceUnavailableError extends Error {
  constructor(message = 'Database temporarily unavailable') {
    super(message);
    this.name  = 'ServiceUnavailableError';
    this.code  = 'service_unavailable';
    this.retry_after = 30;          // seconds — sent in Retry-After header
  }
}

// ── Connection pool ───────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  database:           process.env.DB_NAME     || 'u171187877_brindaworld_db',
  user:               process.env.DB_USER     || 'u171187877_brindaworld_us',
  password:           process.env.DB_PASS     || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     8000,          // 8 s — fail fast rather than hang
});

// ── safeQuery ─────────────────────────────────────────────────────────────────
// Drop-in replacement for pool.query() that converts MySQL connection errors
// into ServiceUnavailableError.  Application logic errors (bad SQL, constraint
// violations, etc.) are NOT caught here — they propagate normally.
//
// Usage:
//   const [rows] = await safeQuery('SELECT * FROM users WHERE id = ?', [id]);
//
async function safeQuery(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (DB_DOWN_CODES.has(err.code)) {
      console.error(`[db] MySQL unreachable (${err.code}): ${err.message}`);
      throw new ServiceUnavailableError();
    }
    // Application-level error (bad query, constraint, etc.) — let it propagate
    throw err;
  }
}

// ── testConnection ────────────────────────────────────────────────────────────
// Called once on startup.  Logs only — never throws.
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    // Non-fatal: server starts regardless; health endpoint will report 'down'
    console.error('⚠️  MySQL connection failed on startup:', err.message);
  }
}

module.exports = { pool, safeQuery, testConnection, ServiceUnavailableError };
