/**
 * Claritum — Health Check Routes
 * Entity: Simonova Inc. o/a Claritum
 *
 * GET /api/health    — basic health + DB connection status
 * GET /api/health/db — detailed table counts
 */

const express = require('express');
const { testConnection, getTableCounts } = require('../lib/database');

const router = express.Router();

/**
 * GET /api/health
 * Returns service status and database connectivity.
 */
router.get('/', async (_req, res) => {
  const dbStatus = await testConnection();

  const status = dbStatus.ok ? 'healthy' : 'degraded';
  const httpCode = dbStatus.ok ? 200 : 503;

  res.status(httpCode).json({
    service: 'claritum-api',
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '0.1.0',
    database: {
      connected: dbStatus.ok,
      latencyMs: dbStatus.latencyMs,
      error: dbStatus.error || null,
    },
  });
});

/**
 * GET /api/health/db
 * Returns row counts for every table. Requires service_role key.
 */
router.get('/db', async (_req, res) => {
  const result = await getTableCounts();

  if (!result.ok) {
    return res.status(503).json({
      service: 'claritum-api',
      status: 'error',
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    service: 'claritum-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tables: result.tables,
    totalTables: Object.keys(result.tables).length,
  });
});

module.exports = router;
