/**
 * api.js  –  General API routes (non-auth)
 * Mounted at /api in index.js
 *
 * Routes
 * ──────
 *   GET  /api/health          – health check (public)
 *   POST /api/feedback        – submit feedback or service request (protected)
 */

'use strict';

const express        = require('express');
const router         = express.Router();
const { pool }       = require('../db');
const { verifyToken } = require('../middleware/auth');
const { generatePublicId } = require('../utils/identity');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Map frontend dropdown label → DB enum value */
const FEEDBACK_TYPE_MAP = {
  'Bug Report':          'bug',
  'Feature Suggestion':  'suggestion',
  'Complaint':           'complaint',
  'Praise':              'praise',
  'General Question':    'question',
  'service_request':     'service_request',
  // accept enum values directly too
  bug:             'bug',
  suggestion:      'suggestion',
  complaint:       'complaint',
  praise:          'praise',
  question:        'question',
};

const VALID_TYPES = new Set(['bug', 'suggestion', 'complaint', 'praise', 'question', 'service_request']);

/**
 * Auto-generate a subject line when the caller doesn't provide one.
 * Produces e.g.  "Service Request: Personal Chess Tutor (1-on-1 coaching)"
 */
function autoSubject(feedbackType, serviceRequested) {
  const labels = {
    bug:             'Bug Report',
    suggestion:      'Feature Suggestion',
    complaint:       'Complaint',
    praise:          'Praise',
    question:        'General Question',
    service_request: 'Service Request',
  };
  const base = labels[feedbackType] || 'Feedback';
  if (feedbackType === 'service_request' && serviceRequested) {
    return `${base}: ${serviceRequested}`;
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health  (public)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'BrindaWorld' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feedback  (protected — JWT required)
//
// Request body
// ────────────
//   feedback_type     string  required  bug | suggestion | complaint | praise
//                                       | question | service_request
//                                       (also accepts frontend label strings)
//   subject           string  optional  auto-generated if blank
//   body              string  required  ≥ 10 characters
//   service_requested string  optional  service label for service_request type
//
// Response 201
// ────────────
//   { success: true, message: "Feedback received", id: "<public_uuid>" }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/feedback', verifyToken, async (req, res) => {
  const {
    feedback_type: rawType,
    subject: rawSubject,
    body,
    service_requested,
  } = req.body;

  // ── Normalise type ────────────────────────────────────────────────────────
  const feedbackType = FEEDBACK_TYPE_MAP[rawType] || rawType;

  if (!VALID_TYPES.has(feedbackType)) {
    return res.status(400).json({
      error: `Invalid feedback_type "${rawType}". Must be one of: ${[...VALID_TYPES].join(', ')}.`,
    });
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  if (!body || typeof body !== 'string' || body.trim().length < 10) {
    return res.status(400).json({
      error: 'Message body must be at least 10 characters.',
    });
  }

  // ── Build row fields ──────────────────────────────────────────────────────
  const subject  = (rawSubject && rawSubject.trim())
    ? rawSubject.trim().slice(0, 200)
    : autoSubject(feedbackType, service_requested);

  const priority  = feedbackType === 'complaint' ? 'high' : 'medium';
  const publicId  = generatePublicId();

  try {
    await pool.query(
      `INSERT INTO user_feedback
         (public_id, user_id, feedback_type, subject, body,
          service_requested, priority, status, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'VN')`,
      [
        publicId,
        req.user.id,
        feedbackType,
        subject,
        body.trim(),
        service_requested || null,
        priority,
      ]
    );

    console.log(
      `[feedback] user=${req.user.id} type=${feedbackType} priority=${priority} id=${publicId}`
    );

    res.status(201).json({
      success: true,
      message: 'Feedback received',
      id:      publicId,
    });
  } catch (err) {
    console.error('[feedback] DB error:', err.message);
    res.status(500).json({ error: 'Failed to save feedback. Please try again.' });
  }
});

module.exports = router;
