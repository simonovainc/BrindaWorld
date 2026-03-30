require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./src/db');
const apiRoutes          = require('./src/routes/api');
const authRoutes         = require('./src/routes/auth');
const { router: teachersRouter } = require('./src/routes/teachers');
const competitionsRouter = require('./src/routes/competitions');

// ── Security & Performance middleware (Phase 2 P5+P6) ────────────────────────
const { helmetConfig, globalLimiter, compressionMiddleware, cacheHeaders } = require('./src/middleware/performance');
const { sanitizeBody, preventParamPollution, securityLogger } = require('./src/middleware/validation');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmetConfig);
app.use(compressionMiddleware);
app.use(cacheHeaders);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/', globalLimiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(preventParamPollution);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);
app.use(securityLogger);

// ── Static files (React production build) ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'client/dist')));

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api',              apiRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/teachers',     teachersRouter);
app.use('/api/competitions', competitionsRouter);

// ── React client-side routing (must come after API routes) ───────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
// CMMI L5: one bad route NEVER crashes the whole server.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const requestId = Date.now();

  // Tier 1 — DB / service unavailable
  if (err.name === 'ServiceUnavailableError' || err.code === 'service_unavailable') {
    const retryAfter = err.retry_after || 30;
    console.error(`[${requestId}] 503 ServiceUnavailable: ${err.message}`);
    res.set('Retry-After', String(retryAfter));
    return res.status(503).json({
      error:       'service_unavailable',
      message:     'We are experiencing technical difficulties. Please try again shortly.',
      retry_after: retryAfter,
      request_id:  requestId,
    });
  }

  // Tier 2 — Unhandled application error
  console.error(`[${requestId}] Unhandled error on ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(500).json({
    error:      'Something went wrong',
    request_id: requestId,
  });
});

// ── Process-level safety nets ─────────────────────────────────────────────────
process.on('uncaughtException',  (err) => console.error('[uncaughtException]',  err.message));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

// ── Weekly email cron (Phase 3 S2) ───────────────────────────────────────────
try {
  const cron = require('node-cron');
  const { runWeeklyParentReports } = require('./src/services/emailService');
  const { safeQuery } = require('./src/db');
  // Every Monday at 8am
  cron.schedule('0 8 * * 1', () => {
    console.log('[Cron] Starting weekly parent reports...');
    runWeeklyParentReports(safeQuery).catch(e => console.error('[Cron]', e.message));
  });
} catch (e) {
  console.log('[Cron] node-cron not available, weekly emails disabled');
}

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BrindaWorld server running on port ${PORT}`);
    db.testConnection();
  });
}

module.exports = app;
