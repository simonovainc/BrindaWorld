/**
 * validation.js — BrindaWorld Input Validation & Security Middleware
 * Phase 2 P6: Sanitize body, prevent param pollution, security logging.
 */

'use strict';

// ── Sanitize request body — strip HTML tags from string values ───────────────
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Strip <script> tags and common XSS vectors
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*on\w+\s*=\s*[^>]*>/gi, '')
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// ── Prevent HTTP parameter pollution ─────────────────────────────────────────
// If a query param appears multiple times, keep only the last value.
function preventParamPollution(req, res, next) {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
}

// ── Security logger — log suspicious requests ───────────────────────────────
function securityLogger(req, res, next) {
  const suspicious =
    req.path.includes('..') ||
    req.path.includes('<script') ||
    req.path.includes('SELECT ') ||
    req.path.includes('UNION ') ||
    req.path.includes('%00');

  if (suspicious) {
    console.warn(`[SECURITY] Suspicious request: ${req.method} ${req.path} from ${req.ip}`);
  }
  next();
}

module.exports = {
  sanitizeBody,
  preventParamPollution,
  securityLogger,
};
