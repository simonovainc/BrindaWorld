/**
 * api.js  –  BrindaWorld General API routes
 * Mounted at /api in index.js
 * CMMI Level 5: documented, modular, portable.
 *
 * Routes (public)
 * ───────────────
 *   GET  /api/health
 *   GET  /api/competitions
 *   GET  /api/competitions/:id/leaderboard
 *
 * Routes (protected — Bearer JWT required)
 * ─────────────────────────────────────────
 *   POST /api/feedback
 *   GET  /api/feedback
 *   GET  /api/dashboard/summary
 *   POST /api/sessions/start
 *   POST /api/sessions/end
 *   GET  /api/sessions/child/:childId
 *   POST /api/competitions/:id/enter
 */

'use strict';

const express        = require('express');
const router         = express.Router();
const { pool }       = require('../db');
const { verifyToken } = require('../middleware/auth');
const { generatePublicId } = require('../utils/identity');
const { computeIntegrityScore, getIntegrityLabel } = require('../lib/integrity');

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

/** Map frontend dropdown label → DB enum value */
const FEEDBACK_TYPE_MAP = {
  'Bug Report':         'bug',
  'Feature Suggestion': 'suggestion',
  'Complaint':          'complaint',
  'Praise':             'praise',
  'General Question':   'question',
  'service_request':    'service_request',
  bug: 'bug', suggestion: 'suggestion', complaint: 'complaint',
  praise: 'praise', question: 'question',
};
const VALID_FEEDBACK_TYPES = new Set(['bug','suggestion','complaint','praise','question','service_request']);

function autoSubject(type, serviceRequested, email) {
  const map = {
    bug:             `Bug Report from ${email || 'user'}`,
    suggestion:      'Feature Suggestion',
    complaint:       'Complaint — needs attention',
    praise:          'Positive Feedback',
    question:        'Question from user',
    service_request: `Service Request: ${serviceRequested || 'General'}`,
  };
  return map[type] || 'Feedback';
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/health ───────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'BrindaWorld' });
});

// ── GET /api/competitions ─────────────────────────────────────────────────────
// Returns all active competitions (safe fields only — no internal IDs).
router.get('/competitions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT public_id, title, description, competition_type,
              age_band, ends_at, prize_description, status
       FROM competitions
       WHERE status = 'active'
       ORDER BY ends_at ASC`
    );
    res.json({ competitions: rows });
  } catch (err) {
    // Table may not exist yet (before migration 013 runs)
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ competitions: [] });
    console.error('[competitions]', err.message);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// ── GET /api/competitions/:id/leaderboard ─────────────────────────────────────
// Top 20 entries. COPPA: display_name = first name + last initial only.
router.get('/competitions/:id/leaderboard', async (req, res) => {
  try {
    const [comp] = await pool.query(
      'SELECT id FROM competitions WHERE public_id = ? LIMIT 1',
      [req.params.id]
    );
    if (!comp.length) return res.status(404).json({ error: 'Competition not found' });

    const [rows] = await pool.query(
      `SELECT rank, display_name, province_code, score
       FROM competition_leaderboard
       WHERE competition_id = ?
       ORDER BY rank ASC
       LIMIT 20`,
      [comp[0].id]
    );
    res.json({ leaderboard: rows });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ leaderboard: [] });
    console.error('[leaderboard]', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — all require verifyToken middleware
// ══════════════════════════════════════════════════════════════════════════════

// ── POST /api/feedback ────────────────────────────────────────────────────────
// Submit feedback or service request.
router.post('/feedback', verifyToken, async (req, res) => {
  const { feedback_type: rawType, subject: rawSubject, body, service_requested } = req.body;

  const feedbackType = FEEDBACK_TYPE_MAP[rawType] || rawType;
  if (!VALID_FEEDBACK_TYPES.has(feedbackType)) {
    return res.status(400).json({ error: `Invalid feedback_type. Must be one of: ${[...VALID_FEEDBACK_TYPES].join(', ')}.` });
  }
  if (!body || body.trim().length < 10) {
    return res.status(400).json({ error: 'Message body must be at least 10 characters.' });
  }
  if (feedbackType === 'service_request' && !service_requested) {
    return res.status(400).json({ error: 'service_requested is required for service requests.' });
  }

  const subject  = (rawSubject && rawSubject.trim())
    ? rawSubject.trim().slice(0, 200)
    : autoSubject(feedbackType, service_requested, req.user.email);
  const priority = feedbackType === 'complaint' ? 'high' : 'medium';
  const publicId = generatePublicId();

  try {
    await pool.query(
      `INSERT INTO user_feedback
         (public_id, user_id, feedback_type, subject, body, service_requested, priority, status, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'VN')`,
      [publicId, req.user.id, feedbackType, subject, body.trim(), service_requested || null, priority]
    );
    console.log(`[feedback] user=${req.user.id} type=${feedbackType} id=${publicId}`);
    res.status(201).json({
      success:    true,
      public_id:  publicId,
      message:    'Thank you! We will respond within 48 hours.',
    });
  } catch (err) {
    console.error('[feedback]', err.message);
    res.status(500).json({ error: 'Failed to save feedback. Please try again.' });
  }
});

// ── GET /api/feedback ─────────────────────────────────────────────────────────
// Returns authenticated user's last 10 feedback submissions.
router.get('/feedback', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT public_id, feedback_type, subject, status, created_at, resolution_notes
       FROM user_feedback
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );
    res.json({ feedback: rows });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ feedback: [] });
    console.error('[feedback/get]', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// ── GET /api/dashboard/summary ────────────────────────────────────────────────
// Returns children + licence summary + weekly activity KPIs.
// Gracefully returns zeroes if game_sessions or user_licences tables don't exist yet.
router.get('/dashboard/summary', verifyToken, async (req, res) => {
  try {
    // ── Children ────────────────────────────────────────────────────────────
    const [children] = await pool.query(
      `SELECT public_id AS id, name, display_name AS displayName,
              age, avatar, created_at AS createdAt
       FROM children
       WHERE parent_user_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    // ── Licence / plan info ──────────────────────────────────────────────────
    let licenceType  = 'FREE';
    let seatsUsed    = children.length;
    let seatsTotal   = 2;      // FREE default
    let memberSince  = null;

    try {
      // Try user_licences → licence_types join (may not exist yet)
      const [licRows] = await pool.query(
        `SELECT lt.code, lt.max_children, ul.created_at
         FROM user_licences ul
         JOIN licence_types lt ON lt.id = ul.licence_type_id
         WHERE ul.user_id = ? AND ul.status = 'active'
         LIMIT 1`,
        [req.user.id]
      );
      if (licRows.length) {
        licenceType = licRows[0].code;
        seatsTotal  = licRows[0].max_children || 999;
        memberSince = licRows[0].created_at;
      }
    } catch (_) { /* table not yet migrated — use FREE defaults */ }

    if (!memberSince) {
      // Fall back to user created_at
      const [userRow] = await pool.query('SELECT created_at FROM users WHERE id = ? LIMIT 1', [req.user.id]);
      memberSince = userRow[0]?.created_at || null;
    }

    // ── Weekly activity ─────────────────────────────────────────────────────
    let sessionsThisWeek = 0, minutesThisWeek = 0, gamesPlayed = 0, badgesEarned = 0;

    // Build list of child numeric IDs for the session query
    const [childIds] = await pool.query(
      'SELECT id FROM children WHERE parent_user_id = ? AND deleted_at IS NULL',
      [req.user.id]
    );

    if (childIds.length) {
      try {
        const ids = childIds.map(c => c.id);
        const placeholders = ids.map(() => '?').join(',');
        const [actRows] = await pool.query(
          `SELECT
             COUNT(*)                                        AS sessions_count,
             COALESCE(SUM(duration_seconds) / 60, 0)       AS minutes,
             COUNT(DISTINCT game_id)                        AS games
           FROM game_sessions
           WHERE child_id IN (${placeholders})
             AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
          ids
        );
        sessionsThisWeek = actRows[0].sessions_count || 0;
        minutesThisWeek  = Math.round(actRows[0].minutes || 0);
        gamesPlayed      = actRows[0].games || 0;
      } catch (_) { /* game_sessions not yet created */ }
    }

    // ── Last active per child ────────────────────────────────────────────────
    const childrenWithActivity = await Promise.all(children.map(async (child) => {
      let lastActive = null;
      let activeThisWeek = false;
      try {
        const [childNumericRow] = await pool.query(
          'SELECT id FROM children WHERE public_id = ? LIMIT 1', [child.id]
        );
        if (childNumericRow.length) {
          const numId = childNumericRow[0].id;
          const [sessRow] = await pool.query(
            `SELECT started_at FROM game_sessions
             WHERE child_id = ? ORDER BY started_at DESC LIMIT 1`,
            [numId]
          );
          if (sessRow.length) {
            lastActive = sessRow[0].started_at;
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            activeThisWeek = new Date(lastActive) >= weekAgo;
          }
        }
      } catch (_) { /* no sessions table yet */ }
      return { ...child, lastActive, activeThisWeek };
    }));

    res.json({
      children: childrenWithActivity,
      summary: {
        total_children: children.length,
        licence_type:   licenceType,
        seats_used:     seatsUsed,
        seats_total:    seatsTotal,
        member_since:   memberSince,
      },
      weekly_activity: {
        sessions_this_week: sessionsThisWeek,
        minutes_this_week:  minutesThisWeek,
        games_played:       gamesPlayed,
        badges_earned:      badgesEarned,
      },
    });
  } catch (err) {
    console.error('[dashboard/summary]', err.message);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// ── POST /api/sessions/start ──────────────────────────────────────────────────
// Creates a new game session row. Returns session public_id to the client.
router.post('/sessions/start', verifyToken, async (req, res) => {
  const { child_id: childPublicId, game_id, game_category } = req.body;

  if (!childPublicId || !game_id || !game_category) {
    return res.status(400).json({ error: 'child_id, game_id, and game_category are required.' });
  }

  try {
    // Verify child belongs to this parent
    const [childRows] = await pool.query(
      `SELECT c.id FROM children c
       WHERE c.public_id = ? AND c.parent_user_id = ? AND c.deleted_at IS NULL
       LIMIT 1`,
      [childPublicId, req.user.id]
    );
    if (!childRows.length) {
      return res.status(403).json({ error: 'Child not found or does not belong to this account.' });
    }

    const childNumericId = childRows[0].id;
    const publicId       = generatePublicId();
    const sessionHour    = new Date().getHours();

    await pool.query(
      `INSERT INTO game_sessions (public_id, child_id, game_id, game_category, session_hour)
       VALUES (?, ?, ?, ?, ?)`,
      [publicId, childNumericId, game_id, game_category, sessionHour]
    );

    res.status(201).json({ session_id: publicId, started_at: new Date().toISOString() });
  } catch (err) {
    console.error('[sessions/start]', err.message);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// ── POST /api/sessions/end ────────────────────────────────────────────────────
// Closes session, computes integrity score, inserts integrity_events if needed.
router.post('/sessions/end', verifyToken, async (req, res) => {
  const {
    session_id,
    score             = 0,
    max_score         = 100,
    hints_used        = 0,
    retries           = 0,
    questions_total   = 0,
    questions_correct = 0,
    completion_status = 'completed',
  } = req.body;

  if (!session_id) return res.status(400).json({ error: 'session_id is required.' });

  try {
    // Fetch the open session + verify it belongs to a child of this parent
    const [sessRows] = await pool.query(
      `SELECT gs.id, gs.child_id, gs.started_at, gs.session_hour,
              gs.game_id, gs.game_category
       FROM game_sessions gs
       JOIN children c ON c.id = gs.child_id
       WHERE gs.public_id = ? AND c.parent_user_id = ? AND gs.ended_at IS NULL
       LIMIT 1`,
      [session_id, req.user.id]
    );
    if (!sessRows.length) {
      return res.status(404).json({ error: 'Session not found or already closed.' });
    }

    const sess            = sessRows[0];
    const now             = new Date();
    const startedAt       = new Date(sess.started_at);
    const durationSeconds = Math.round((now - startedAt) / 1000);
    const scorePercent    = max_score > 0 ? Math.round((score / max_score) * 100 * 100) / 100 : 0;

    // ── Integrity scoring ─────────────────────────────────────────────────
    const { score: integrityScore, flags } = computeIntegrityScore({
      duration_seconds:  durationSeconds,
      score_percent:     scorePercent,
      hints_used,
      retries,
      questions_total,
      questions_correct,
      session_hour:      sess.session_hour,
      average_duration:  300,
    });

    // ── Update session row ────────────────────────────────────────────────
    await pool.query(
      `UPDATE game_sessions SET
         ended_at          = NOW(),
         duration_seconds  = ?,
         score             = ?,
         max_score         = ?,
         score_percent     = ?,
         hints_used        = ?,
         retries           = ?,
         questions_total   = ?,
         questions_correct = ?,
         completion_status = ?,
         integrity_score   = ?,
         integrity_flags   = ?
       WHERE id = ?`,
      [
        durationSeconds, score, max_score, scorePercent,
        hints_used, retries, questions_total, questions_correct,
        completion_status, integrityScore,
        flags.length ? JSON.stringify(flags) : null,
        sess.id,
      ]
    );

    // ── Insert integrity_events if score < 60 ─────────────────────────────
    if (integrityScore < 60 && flags.length) {
      const severity = integrityScore < 30 ? 'high' : 'medium';
      for (const flag of flags) {
        const descriptions = {
          RAPID_COMPLETION: 'Game completed in less than 20% of average time',
          PERFECT_RETRY:    '100% score with no hints or retries (suspiciously perfect)',
          LATE_NIGHT:       'Session played between midnight and 5am',
          HIGH_RETRY_RATE:  'Retries exceeded 50% of total questions',
        };
        await pool.query(
          `INSERT INTO integrity_events (session_id, child_id, flag_code, flag_description, severity)
           VALUES (?, ?, ?, ?, ?)`,
          [sess.id, sess.child_id, flag, descriptions[flag] || flag, severity]
        );
      }
    }

    const label = getIntegrityLabel(integrityScore);
    console.log(`[sessions/end] session=${session_id} integrity=${integrityScore} flags=${flags.join(',') || 'none'}`);

    res.json({
      success:         true,
      score_percent:   scorePercent,
      integrity_score: integrityScore,
      integrity_label: label,         // for parent dashboard only — caller must not send to child
    });
  } catch (err) {
    console.error('[sessions/end]', err.message);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ── GET /api/sessions/child/:childId ─────────────────────────────────────────
// Returns last 20 sessions for a child.
// Integrity data is included only because requester is the authenticated parent.
router.get('/sessions/child/:childId', verifyToken, async (req, res) => {
  try {
    // Verify child belongs to this parent
    const [childRows] = await pool.query(
      `SELECT c.id FROM children c
       WHERE c.public_id = ? AND c.parent_user_id = ? AND c.deleted_at IS NULL
       LIMIT 1`,
      [req.params.childId, req.user.id]
    );
    if (!childRows.length) {
      return res.status(403).json({ error: 'Child not found or access denied.' });
    }

    const [sessions] = await pool.query(
      `SELECT public_id, game_id, game_category, started_at, ended_at,
              duration_seconds, score_percent, completion_status,
              hints_used, retries, questions_total, questions_correct,
              integrity_score, integrity_flags
       FROM game_sessions
       WHERE child_id = ?
       ORDER BY started_at DESC
       LIMIT 20`,
      [childRows[0].id]
    );

    // Attach integrity label to each session
    const sessionsWithLabels = sessions.map(s => ({
      ...s,
      integrity_label: getIntegrityLabel(s.integrity_score),
    }));

    res.json({ sessions: sessionsWithLabels });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json({ sessions: [] });
    console.error('[sessions/child]', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ── POST /api/competitions/:id/enter ─────────────────────────────────────────
// Enter a child into a competition. Validates age band.
router.post('/competitions/:id/enter', verifyToken, async (req, res) => {
  const { child_id: childPublicId } = req.body;
  if (!childPublicId) return res.status(400).json({ error: 'child_id is required.' });

  try {
    // Fetch competition
    const [compRows] = await pool.query(
      `SELECT id, age_band, status, max_participants FROM competitions
       WHERE public_id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!compRows.length) return res.status(404).json({ error: 'Competition not found.' });

    const comp = compRows[0];
    if (comp.status !== 'active') {
      return res.status(400).json({ error: 'This competition is not currently active.' });
    }

    // Verify child belongs to this parent + get age
    const [childRows] = await pool.query(
      `SELECT c.id, c.age, c.name FROM children c
       WHERE c.public_id = ? AND c.parent_user_id = ? AND c.deleted_at IS NULL
       LIMIT 1`,
      [childPublicId, req.user.id]
    );
    if (!childRows.length) {
      return res.status(403).json({ error: 'Child not found or does not belong to this account.' });
    }

    const child = childRows[0];

    // Validate age band
    if (comp.age_band !== 'all') {
      const [minAge, maxAge] = comp.age_band.split('-').map(Number);
      if (child.age < minAge || child.age > maxAge) {
        return res.status(400).json({
          error: `This competition is for ages ${comp.age_band}. ${child.name} is ${child.age}.`,
        });
      }
    }

    // Check capacity
    if (comp.max_participants) {
      const [countRow] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM competition_entries WHERE competition_id = ?',
        [comp.id]
      );
      if (countRow[0].cnt >= comp.max_participants) {
        return res.status(400).json({ error: 'This competition is full.' });
      }
    }

    // Insert entry (IGNORE = idempotent — safe to call twice)
    await pool.query(
      'INSERT IGNORE INTO competition_entries (competition_id, child_id) VALUES (?, ?)',
      [comp.id, child.id]
    );

    res.status(201).json({ success: true, message: 'Entered! Good luck! 🏆' });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(503).json({ error: 'Competitions not yet available. Check back soon!' });
    }
    console.error('[competitions/enter]', err.message);
    res.status(500).json({ error: 'Failed to enter competition' });
  }
});

module.exports = router;
