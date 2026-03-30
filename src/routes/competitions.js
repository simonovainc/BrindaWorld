/**
 * competitions.js — BrindaWorld Competition routes (Phase 2 P4)
 * Mounted at /api/competitions in index.js
 *
 * These are ADDITIONAL routes for teacher-created competitions.
 * The base /api/competitions and /api/competitions/:id/leaderboard
 * routes already exist in api.js.
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { safeQuery } = require('../db');
const { verifyToken } = require('../middleware/auth');

// ── GET /api/competitions/active ─────────────────────────────────────────────
// Returns all active competitions with entry counts.
router.get('/active', async (req, res) => {
  try {
    const [rows] = await safeQuery(
      `SELECT c.public_id, c.title, c.description, c.competition_type AS comp_type,
              c.age_band, c.ends_at, c.prize_description AS prize_label, c.status,
              COUNT(ce.id) AS entry_count
       FROM competitions c
       LEFT JOIN competition_entries ce ON ce.competition_id = c.id
       WHERE c.status = 'active'
       GROUP BY c.id
       ORDER BY c.ends_at ASC`
    );
    res.json({ competitions: rows });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ competitions: [] });
    console.error('[competitions/active]', err.message);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// ── POST /api/competitions/:id/score ─────────────────────────────────────────
// Submit/update a score for a child in a competition.
router.post('/:id/score', verifyToken, async (req, res) => {
  const { childPublicId, score, bestTime, streak } = req.body;
  if (!childPublicId) return res.status(400).json({ error: 'childPublicId is required.' });

  try {
    const [comp] = await safeQuery(
      'SELECT id FROM competitions WHERE public_id = ? AND status = "active" LIMIT 1',
      [req.params.id]
    );
    if (!comp.length) return res.status(404).json({ error: 'Competition not found or not active.' });

    const [childRows] = await safeQuery(
      'SELECT id FROM children WHERE public_id = ? AND parent_user_id = ? AND deleted_at IS NULL LIMIT 1',
      [childPublicId, req.user.id]
    );
    if (!childRows.length) return res.status(403).json({ error: 'Child not found.' });

    await safeQuery(
      `INSERT INTO competition_scores (competition_id, child_id, score, best_time, streak)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         score = GREATEST(score, VALUES(score)),
         best_time = LEAST(COALESCE(best_time, VALUES(best_time)), VALUES(best_time)),
         streak = GREATEST(streak, VALUES(streak)),
         submitted_at = NOW()`,
      [comp[0].id, childRows[0].id, score || 0, bestTime || null, streak || 0]
    );

    res.json({ success: true, message: 'Score submitted!' });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(503).json({ error: 'Scores not available yet.' });
    console.error('[competitions/score]', err.message);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

module.exports = router;
