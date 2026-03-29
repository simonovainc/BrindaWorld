require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./src/db');
const apiRoutes  = require('./src/routes/api');
const authRoutes = require('./src/routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files (React production build) ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'client/dist')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api',      apiRoutes);
app.use('/api/auth', authRoutes);

// ── React client-side routing (must come after API routes) ───────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
// CMMI L5: one bad route NEVER crashes the whole server.
// Handles three tiers of error:
//   1. ServiceUnavailableError (MySQL down)  → 503 + Retry-After
//   2. All other errors                      → 500 + request_id
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
// These prevent uncaught async errors from killing the Node.js process.
process.on('uncaughtException',  (err) => console.error('[uncaughtException]',  err.message));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`BrindaWorld server running on port ${PORT}`);
  db.testConnection();
});
