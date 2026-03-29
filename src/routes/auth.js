const express = require('express');
const router  = express.Router();
const supabase = require('../lib/supabase');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');

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
    // ── Step 1: Create user in Supabase Auth ─────────────
    console.log('[register] Creating Supabase user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName, role } },
    });

    if (error) {
      console.error('[register] Supabase error (full):', JSON.stringify(error, null, 2));
      const mapped = mapSupabaseRegisterError(error);
      return res.status(mapped.status).json({ error: mapped.message });
    }

    const supaUser = data.user;
    const session  = data.session;

    // Supabase returns user but no session when email confirmation is required
    if (!supaUser) {
      console.error('[register] Supabase returned no user. data:', JSON.stringify(data, null, 2));
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    console.log('[register] Supabase user created:', supaUser.id);

    // ── Step 2: Insert into MySQL users table ────────────
    console.log('[register] Inserting MySQL user...');
    const [result] = await pool.query(
      `INSERT INTO users
         (email, role, first_name, last_name, supabase_id, email_verified)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, role, firstName, lastName, supaUser.id,
       supaUser.email_confirmed_at ? 1 : 0]
    );

    const user = {
      id:         result.insertId,
      email,
      role,
      firstName,
      lastName,
      supabaseId: supaUser.id,
    };

    console.log('[register] Done. MySQL user id:', result.insertId);
    res.status(201).json({ user, session });

  } catch (err) {
    console.error('[register] Caught exception (full):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

    // MySQL duplicate entry (email already in users table but not Supabase — edge case)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
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
      return res.status(401).json({ error: error.message });
    }

    const supaUser = data.user;
    const session  = data.session;

    // 2. Update last_login_at in MySQL
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE supabase_id = ?',
      [supaUser.id]
    );

    // 3. Fetch MySQL user record
    const [rows] = await pool.query(
      `SELECT id, email, role, first_name, last_name
       FROM users
       WHERE supabase_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [supaUser.id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'User not found in database' });
    }

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
    res.status(500).json({ error: 'Login failed' });
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
// Creates child profile + COPPA parental consent record
// ─────────────────────────────────────────────────────────
router.post('/child', verifyToken, async (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Only parents can add children' });
  }

  const { name, age, avatar } = req.body;

  if (!name || !age) {
    return res.status(400).json({ error: 'Name and age are required' });
  }

  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 3 || ageNum > 14) {
    return res.status(400).json({ error: 'Age must be between 3 and 14' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert child record
    const [childResult] = await conn.query(
      'INSERT INTO children (parent_user_id, name, age, avatar) VALUES (?, ?, ?, ?)',
      [req.user.id, name.trim(), ageNum, avatar || '🧒']
    );
    const childId = childResult.insertId;

    // 2. Create parental consent record (COPPA compliance)
    await conn.query(
      `INSERT INTO parental_consents
         (parent_user_id, child_id, consent_type, consent_version, verification_method)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, childId, 'coppa_child_profile', '1.0', 'email']
    );

    await conn.commit();

    res.status(201).json({
      child: {
        id:           childId,
        parentUserId: req.user.id,
        name:         name.trim(),
        age:          ageNum,
        avatar:       avatar || '🧒',
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('[addChild]', err.message);
    res.status(500).json({ error: 'Failed to add child' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/auth/children  (protected)
// ─────────────────────────────────────────────────────────
router.get('/children', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, age, avatar, created_at
       FROM children
       WHERE parent_user_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [req.user.id]
    );
    res.json({ children: rows });
  } catch (err) {
    console.error('[children]', err.message);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/auth/child/:id  (protected)
// Soft-deletes by setting deleted_at
// ─────────────────────────────────────────────────────────
router.delete('/child/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE children
       SET deleted_at = NOW()
       WHERE id = ? AND parent_user_id = ? AND deleted_at IS NULL`,
      [req.params.id, req.user.id]
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
