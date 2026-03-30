const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const {
  generatePublicId,
  validateChildName,
  sanitizeForDisplay,
  suggestChildName,
} = require('../utils/identity');

// ─────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────

// Map Supabase error codes / messages → user-friendly text + HTTP status
function mapSupabaseRegisterError(error) {
  const code = error?.code || '';
  const msg  = (error?.message || '').toLowerCase();

  if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already been registered')) {
    return { status: 409, message: 'An account with this email address already exists. Please sign in instead.' };
  }
  if (code === 'email_address_invalid' || msg.includes('invalid email') || msg.includes('valid email')) {
    return { status: 400, message: 'Please enter a valid email address.' };
  }
  if (code === 'weak_password' || msg.includes('weak password') || msg.includes('at least') || msg.includes('password should')) {
    return { status: 400, message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.' };
  }
  if (msg.includes('password') && (msg.includes('characters') || msg.includes('short'))) {
    return { status: 400, message: 'Password must be at least 8 characters long.' };
  }
  return { status: 400, message: error.message };
}

router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  console.log('[register] Incoming request:', { email, firstName, lastName, role });

  // ── Validation ───────────────────────────────────────────
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }
  if (!['parent', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  try {
    // ── Step 0: Check MySQL first ────────────────────────
    // If the user is already fully registered, tell them to sign in.
    console.log('[register] Checking MySQL for existing email...');
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email]
    );
    if (existing.length) {
      console.log('[register] Email already in MySQL — returning 409');
      return res.status(409).json({
        error: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // ── Step 1: Create user in Supabase Auth ─────────────
    console.log('[register] Creating Supabase user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName, role } },
    });

    let supaUser, session;

    if (error) {
      const code = error?.code || '';
      const msg  = (error?.message || '').toLowerCase();
      const isAlreadyExists =
        code === 'user_already_exists' ||
        msg.includes('already registered') ||
        msg.includes('already been registered');

      if (isAlreadyExists) {
        // Supabase user exists but MySQL insert previously failed — recover.
        // Sign in to obtain the existing user's ID and a fresh session.
        console.log('[register] Supabase user exists but MySQL row missing — recovering via sign-in...');
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          // Wrong password or other sign-in failure — not our partial-insert case
          console.error('[register] Recovery sign-in failed:', JSON.stringify(signInError, null, 2));
          return res.status(409).json({
            error: 'An account with this email address already exists. Please sign in instead.',
          });
        }

        supaUser = signInData.user;
        session  = signInData.session;
        console.log('[register] Recovery: obtained Supabase user via sign-in:', supaUser.id);
      } else {
        console.error('[register] Supabase error (full):', JSON.stringify(error, null, 2));
        const mapped = mapSupabaseRegisterError(error);
        return res.status(mapped.status).json({ error: mapped.message });
      }
    } else {
      supaUser = data.user;
      session  = data.session;

      if (!supaUser) {
        console.error('[register] Supabase returned no user. data:', JSON.stringify(data, null, 2));
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      console.log('[register] Supabase user created:', supaUser.id);
    }

    // ── Step 2: Insert into MySQL (idempotent) ────────────
    // Guard against the case where supabase_id already has a row
    // (e.g. a second recovery attempt after a partial failure).
    console.log('[register] Checking MySQL for existing supabase_id...');
    const [existingBySupaId] = await pool.query(
      'SELECT id, email, role, first_name, last_name FROM users WHERE supabase_id = ? LIMIT 1',
      [supaUser.id]
    );

    let user;

    if (existingBySupaId.length) {
      // Row already exists — return it as a success (idempotent)
      console.log('[register] MySQL row already exists for supabase_id — returning existing record');
      const u = existingBySupaId[0];
      user = { id: u.id, email: u.email, role: u.role, firstName: u.first_name, lastName: u.last_name, supabaseId: supaUser.id };
    } else {
      console.log('[register] Inserting MySQL user...');
      const [result] = await pool.query(
        `INSERT INTO users
           (email, role, first_name, last_name, supabase_id, email_verified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, role, firstName, lastName, supaUser.id,
         supaUser.email_confirmed_at ? 1 : 0]
      );
      user = { id: result.insertId, email, role, firstName, lastName, supabaseId: supaUser.id };
      console.log('[register] Done. MySQL user id:', result.insertId);
    }

    res.status(201).json({ user, session });

    // Non-blocking welcome email (Phase 3 S2)
    try {
      const { sendWelcomeEmail } = require('../services/emailService');
      sendWelcomeEmail({ email: user.email, firstName: user.firstName }).catch(e => console.error('[Email]', e.message));
    } catch (_) { /* emailService not available */ }

  } catch (err) {
    console.error('[register] Caught exception (full):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please sign in instead.',
      });
    }
    res.status(500).json({ error: 'Something went wrong. Please try again in a moment.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Sign in via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const code = error?.code || '';
      const msg  = (error?.message || '').toLowerCase();

      if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
        // Supabase returns the same code for wrong password and unknown email.
        // We probe MySQL to distinguish the two cases.
        const [emailRows] = await pool.query(
          'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
          [email]
        ).catch(() => [[]]);

        if (!emailRows.length) {
          return res.status(401).json({ error: 'No account found with this email. Please register.' });
        }
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }

      if (code === 'email_not_confirmed' || msg.includes('email not confirmed') || msg.includes('not verified')) {
        return res.status(401).json({
          error: 'Please verify your email before signing in. Check your inbox for the confirmation link.',
        });
      }

      return res.status(401).json({ error: 'Sign in failed. Please try again.' });
    }

    const supaUser = data.user;
    const session  = data.session;

    // 2. Fetch MySQL user record
    let [rows] = await pool.query(
      `SELECT id, email, role, first_name, last_name
       FROM users
       WHERE supabase_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [supaUser.id]
    );

    // 3. Auto-recover: Supabase user exists but MySQL row is missing
    //    (can happen after a partial registration). Insert silently.
    if (!rows.length) {
      console.log('[login] MySQL user missing for supabase_id', supaUser.id, '— auto-inserting');
      const meta      = supaUser.user_metadata || {};
      const firstName = meta.first_name || meta.firstName || '';
      const lastName  = meta.last_name  || meta.lastName  || '';
      await pool.query(
        `INSERT INTO users (supabase_id, email, first_name, last_name, role)
         VALUES (?, ?, ?, ?, 'parent')
         ON DUPLICATE KEY UPDATE last_login_at = NOW()`,
        [supaUser.id, supaUser.email, firstName, lastName]
      );
      const [recovered] = await pool.query(
        'SELECT id, email, role, first_name, last_name FROM users WHERE supabase_id = ? LIMIT 1',
        [supaUser.id]
      );
      rows = recovered;
    }

    // 4. Update last_login_at
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE supabase_id = ?',
      [supaUser.id]
    );

    const u = rows[0];
    res.json({
      user: {
        id:        u.id,
        email:     u.email,
        role:      u.role,
        firstName: u.first_name,
        lastName:  u.last_name,
      },
      session,
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  // Client clears the token; server just confirms
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.created_at,
              s.plan_type, s.status AS subscription_status
       FROM users u
       LEFT JOIN subscriptions s
         ON s.user_id = u.id AND s.status IN ('active', 'trialing')
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = rows[0];
    res.json({
      user: {
        id:                 u.id,
        email:              u.email,
        role:               u.role,
        firstName:          u.first_name,
        lastName:           u.last_name,
        createdAt:          u.created_at,
        planType:           u.plan_type || 'free',
        subscriptionStatus: u.subscription_status || null,
      },
    });
  } catch (err) {
    console.error('[me]', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/auth/child  (protected — parent only)
// Creates child profile + COPPA parental consent record.
//
// Business rules (CMMI Level 5):
//   • Name validated via identity.validateChildName()
//   • Duplicate active name → 409 with nickname suggestion
//   • Soft-deleted name may be re-added (new row, fresh public_id)
//   • public_id UUID generated here; never expose internal id
// ─────────────────────────────────────────────────────────
router.post('/child', verifyToken, async (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Only parents can add children' });
  }

  const { name, age, avatar } = req.body;

  // ── Name validation ──────────────────────────────────
  const nameCheck = validateChildName(name);
  if (!nameCheck.valid) {
    return res.status(400).json({ error: nameCheck.error });
  }

  const cleanName = sanitizeForDisplay(name);

  if (!age) {
    return res.status(400).json({ error: 'Age is required.' });
  }

  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 3 || ageNum > 14) {
    return res.status(400).json({ error: 'Age must be between 3 and 14.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Duplicate name check (active children only) ──
    const [activeRows] = await conn.query(
      `SELECT name FROM children
       WHERE parent_user_id = ? AND deleted_at IS NULL`,
      [req.user.id]
    );
    const activeNames = activeRows.map(r => r.name);

    const isDuplicate = activeNames.some(
      n => n.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (isDuplicate) {
      await conn.rollback();
      const suggestion = suggestChildName(cleanName, activeNames);
      return res.status(409).json({
        error: `You already have a child named "${cleanName}". Try a nickname like "${suggestion}".`,
        suggestion,
      });
    }

    // ── Generate stable external UUID ───────────────
    const publicId = generatePublicId();

    // ── Insert child record ──────────────────────────
    const [childResult] = await conn.query(
      `INSERT INTO children (public_id, parent_user_id, name, age, avatar)
       VALUES (?, ?, ?, ?, ?)`,
      [publicId, req.user.id, cleanName, ageNum, avatar || '🧒']
    );
    const childId = childResult.insertId;

    // ── COPPA parental consent record ───────────────
    await conn.query(
      `INSERT INTO parental_consents
         (parent_user_id, child_id, consent_type, consent_version, verification_method)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, childId, 'coppa_child_profile', '1.0', 'email']
    );

    await conn.commit();

    res.status(201).json({
      child: {
        id:     publicId,   // ← UUID, never the internal numeric id
        name:   cleanName,
        age:    ageNum,
        avatar: avatar || '🧒',
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('[addChild]', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A child with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to add child' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/auth/children  (protected)
// Returns children with public_id exposed as `id`.
// Internal numeric id is NEVER sent to the client.
// ─────────────────────────────────────────────────────────
router.get('/children', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT public_id, name, display_name, age, avatar, created_at
       FROM children
       WHERE parent_user_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    const children = rows.map(r => ({
      id:          r.public_id,                            // UUID — stable external id
      name:        r.name,
      displayName: r.display_name || r.name,              // fallback to name if no nickname
      age:         r.age,
      avatar:      r.avatar,
      createdAt:   r.created_at,
    }));

    res.json({ children });
  } catch (err) {
    console.error('[children]', err.message);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/auth/child/:id  (protected)
// Soft-deletes a child record by setting deleted_at.
// Also sets active_sentinel to timestamp so the name can be
// reused by a future INSERT (idempotent uniqueness pattern).
//
// :id may be either:
//   • UUID string  (public_id)  — preferred
//   • numeric string            — legacy fallback
// ─────────────────────────────────────────────────────────
router.delete('/child/:id', verifyToken, async (req, res) => {
  const rawId   = req.params.id;
  const isUuid  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
  const isNumeric = /^\d+$/.test(rawId);

  if (!isUuid && !isNumeric) {
    return res.status(400).json({ error: 'Invalid child identifier.' });
  }

  try {
    const whereClause = isUuid
      ? 'public_id = ? AND parent_user_id = ? AND deleted_at IS NULL'
      : 'id = ?        AND parent_user_id = ? AND deleted_at IS NULL';

    const [result] = await pool.query(
      `UPDATE children
       SET deleted_at     = NOW(),
           active_sentinel = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')
       WHERE ${whereClause}`,
      [rawId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[deleteChild]', err.message);
    res.status(500).json({ error: 'Failed to remove child' });
  }
});

module.exports = router;
