/**
 * performance.js — BrindaWorld Performance Middleware
 * Phase 2 P5: Helmet, rate limiting, compression, cache headers.
 */

'use strict';

const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const compression = require('compression');

// ── Helmet — secure HTTP headers ─────────────────────────────────────────────
const helmetConfig = helmet({
  contentSecurityPolicy: false, // React app manages its own CSP
  crossOriginEmbedderPolicy: false,
});

// ── Rate limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 300,                    // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,                     // 15 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

const quizLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,                     // 30 quiz submissions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Slow down! Too many submissions.' },
});

// ── Compression ──────────────────────────────────────────────────────────────
const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,             // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

// ── Cache headers for static assets ──────────────────────────────────────────
function cacheHeaders(req, res, next) {
  // Cache static assets aggressively, API responses not at all
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}

module.exports = {
  helmetConfig,
  globalLimiter,
  authLimiter,
  quizLimiter,
  compressionMiddleware,
  cacheHeaders,
};
