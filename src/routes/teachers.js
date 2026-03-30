/**
 * teachers.js — BrindaWorld Teacher Portal API
 * Phase 2 P1: Registration, login, class management, student progress.
 *
 * Routes (public)
 *   POST /api/teachers/register
 *   POST /api/teachers/login
 *
 * Routes (protected — teacher JWT)
 *   GET  /api/teachers/me
 *   GET  /api/teachers/classes
 *   POST /api/teachers/classes
 *   GET  /api/teachers/classes/:class_id/students
 *   GET  /api/teachers/classes/:class_id/student/:child_public_id
 *   POST /api/teachers/notes
 *   POST /api/teachers/assignments
 *   POST /api/teachers/classes/:join_code/join   (parent-facing)
 */

'use strict';

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { safeQuery } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'brinda_teacher_secret_change_me';

// ── Teacher auth middleware ──────────────────────────────────────────────────
function authenticateTeacher(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ error: 'Not a teacher token' });
    }
    req.teacher = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Helper: generate 6-char join code ────────────────────────────────────────
function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Helper: generate UUID ────────────────────────────────────────────────────
function generatePublicId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── POST /register ───────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, schoolName, province } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const [existing] = await safeQuery(
      'SELECT id FROM teachers WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const publicId = generatePublicId();

    const [result] = await safeQuery(
      `INSERT INTO teachers (public_id, email, password_hash, first_name, last_name, school_name, province)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [publicId, email.trim().toLowerCase(), passwordHash, firstName, lastName, schoolName || null, province || null]
    );

    const token = jwt.sign(
      { id: result.insertId, publicId, email: email.trim().toLowerCase(), role: 'teacher' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      teacher: { id: publicId, email: email.trim().toLowerCase(), firstName, lastName },
      token,
    });

    // Non-blocking welcome email (Phase 3 S2)
    try {
      const { sendTeacherWelcomeEmail } = require('../services/emailService');
      sendTeacherWelcomeEmail({ email: email.trim().toLowerCase(), firstName, schoolName }).catch(e => console.error('[Teacher Email]', e.message));
    } catch (_) { /* emailService not available */ }

  } catch (err) {
    console.error('[teacher/register]', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await safeQuery(
      'SELECT id, public_id, email, password_hash, first_name, last_name FROM teachers WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    const teacher = rows[0];
    const valid = await bcrypt.compare(password, teacher.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: teacher.id, publicId: teacher.public_id, email: teacher.email, role: 'teacher' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      teacher: { id: teacher.public_id, email: teacher.email, firstName: teacher.first_name, lastName: teacher.last_name },
      token,
    });
  } catch (err) {
    console.error('[teacher/login]', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — all require authenticateTeacher
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /me ──────────────────────────────────────────────────────────────────
router.get('/me', authenticateTeacher, async (req, res) => {
  try {
    const [rows] = await safeQuery(
      'SELECT public_id, email, first_name, last_name, school_name, province, created_at FROM teachers WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [req.teacher.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Teacher not found' });
    const t = rows[0];
    res.json({ teacher: { id: t.public_id, email: t.email, firstName: t.first_name, lastName: t.last_name, schoolName: t.school_name, province: t.province, createdAt: t.created_at } });
  } catch (err) {
    console.error('[teacher/me]', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── GET /classes ─────────────────────────────────────────────────────────────
router.get('/classes', authenticateTeacher, async (req, res) => {
  try {
    const [rows] = await safeQuery(
      `SELECT tc.id, tc.class_name, tc.grade_level, tc.join_code, tc.created_at,
              COUNT(ce.id) AS student_count
       FROM teacher_classes tc
       LEFT JOIN class_enrollments ce ON ce.class_id = tc.id
       WHERE tc.teacher_id = ?
       GROUP BY tc.id
       ORDER BY tc.created_at DESC`,
      [req.teacher.id]
    );
    res.json({ classes: rows });
  } catch (err) {
    console.error('[teacher/classes]', err.message);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// ── POST /classes ────────────────────────────────────────────────────────────
router.post('/classes', authenticateTeacher, async (req, res) => {
  const { className, gradeLevel } = req.body;
  if (!className) return res.status(400).json({ error: 'Class name is required.' });

  try {
    let joinCode;
    let attempts = 0;
    // Generate unique join code
    while (attempts < 10) {
      joinCode = generateJoinCode();
      const [existing] = await safeQuery('SELECT id FROM teacher_classes WHERE join_code = ?', [joinCode]);
      if (!existing.length) break;
      attempts++;
    }

    const [result] = await safeQuery(
      'INSERT INTO teacher_classes (teacher_id, class_name, grade_level, join_code) VALUES (?, ?, ?, ?)',
      [req.teacher.id, className, gradeLevel || null, joinCode]
    );

    res.status(201).json({
      class: { id: result.insertId, className, gradeLevel, joinCode, studentCount: 0 },
    });
  } catch (err) {
    console.error('[teacher/classes/create]', err.message);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// ── GET /classes/:class_id/students ──────────────────────────────────────────
router.get('/classes/:class_id/students', authenticateTeacher, async (req, res) => {
  try {
    // Verify class belongs to teacher
    const [cls] = await safeQuery(
      'SELECT id FROM teacher_classes WHERE id = ? AND teacher_id = ?',
      [req.params.class_id, req.teacher.id]
    );
    if (!cls.length) return res.status(404).json({ error: 'Class not found' });

    const [students] = await safeQuery(
      `SELECT c.public_id, c.name, c.age, c.avatar, ce.enrolled_at,
              (SELECT COUNT(*) FROM game_sessions gs WHERE gs.child_id = c.id AND gs.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS sessions_this_week,
              (SELECT COALESCE(SUM(gs.duration_seconds),0) FROM game_sessions gs WHERE gs.child_id = c.id) AS total_seconds,
              (SELECT MAX(gs.started_at) FROM game_sessions gs WHERE gs.child_id = c.id) AS last_active
       FROM class_enrollments ce
       JOIN children c ON c.id = ce.child_id AND c.deleted_at IS NULL
       WHERE ce.class_id = ?
       ORDER BY c.name ASC`,
      [req.params.class_id]
    );

    res.json({ students });
  } catch (err) {
    console.error('[teacher/students]', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ── GET /classes/:class_id/student/:child_public_id ──────────────────────────
router.get('/classes/:class_id/student/:child_public_id', authenticateTeacher, async (req, res) => {
  try {
    const [cls] = await safeQuery(
      'SELECT id FROM teacher_classes WHERE id = ? AND teacher_id = ?',
      [req.params.class_id, req.teacher.id]
    );
    if (!cls.length) return res.status(404).json({ error: 'Class not found' });

    const [childRows] = await safeQuery(
      'SELECT id, public_id, name, age, avatar FROM children WHERE public_id = ? AND deleted_at IS NULL LIMIT 1',
      [req.params.child_public_id]
    );
    if (!childRows.length) return res.status(404).json({ error: 'Student not found' });

    const child = childRows[0];

    // Verify enrolled
    const [enrolled] = await safeQuery(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND child_id = ?',
      [req.params.class_id, child.id]
    );
    if (!enrolled.length) return res.status(403).json({ error: 'Student not in this class' });

    // Sessions
    const [sessions] = await safeQuery(
      `SELECT game_id, game_category, started_at, duration_seconds, score_percent, completion_status
       FROM game_sessions WHERE child_id = ? ORDER BY started_at DESC LIMIT 30`,
      [child.id]
    );

    // Notes
    const [notes] = await safeQuery(
      `SELECT note_text, created_at FROM teacher_notes WHERE teacher_id = ? AND child_id = ? ORDER BY created_at DESC LIMIT 10`,
      [req.teacher.id, child.id]
    );

    // Aggregates
    const [agg] = await safeQuery(
      `SELECT COUNT(*) AS total_sessions,
              COALESCE(SUM(duration_seconds),0) AS total_seconds,
              COUNT(DISTINCT game_id) AS games_played,
              AVG(score_percent) AS avg_score
       FROM game_sessions WHERE child_id = ?`,
      [child.id]
    );

    res.json({
      student: { publicId: child.public_id, name: child.name, age: child.age, avatar: child.avatar },
      stats: agg[0],
      sessions,
      notes,
    });
  } catch (err) {
    console.error('[teacher/student-detail]', err.message);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// ── POST /notes ──────────────────────────────────────────────────────────────
router.post('/notes', authenticateTeacher, async (req, res) => {
  const { childPublicId, noteText } = req.body;
  if (!childPublicId || !noteText) return res.status(400).json({ error: 'childPublicId and noteText are required.' });

  try {
    const [childRows] = await safeQuery(
      'SELECT id FROM children WHERE public_id = ? AND deleted_at IS NULL LIMIT 1',
      [childPublicId]
    );
    if (!childRows.length) return res.status(404).json({ error: 'Student not found' });

    await safeQuery(
      'INSERT INTO teacher_notes (teacher_id, child_id, note_text) VALUES (?, ?, ?)',
      [req.teacher.id, childRows[0].id, noteText.trim()]
    );

    res.status(201).json({ success: true, message: 'Note saved.' });
  } catch (err) {
    console.error('[teacher/notes]', err.message);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// ── POST /assignments ────────────────────────────────────────────────────────
router.post('/assignments', authenticateTeacher, async (req, res) => {
  const { classId, title, description, gameId, dueDate } = req.body;
  if (!classId || !title) return res.status(400).json({ error: 'classId and title are required.' });

  try {
    const [cls] = await safeQuery(
      'SELECT id FROM teacher_classes WHERE id = ? AND teacher_id = ?',
      [classId, req.teacher.id]
    );
    if (!cls.length) return res.status(404).json({ error: 'Class not found' });

    await safeQuery(
      'INSERT INTO teacher_assignments (teacher_id, class_id, title, description, game_id, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.teacher.id, classId, title, description || null, gameId || null, dueDate || null]
    );

    res.status(201).json({ success: true, message: 'Assignment created.' });
  } catch (err) {
    console.error('[teacher/assignments]', err.message);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// TODO: Cron job — every Sunday at 8am send weekly class summary to teacher
// Data: students active this week, badges earned, top performer
// Use Mailchimp transactional or Nodemailer (SMTP via Hostinger)

// ── POST /classes/:join_code/join (PARENT-FACING — uses parent auth) ─────────
// This route uses the parent's Supabase token, not teacher JWT.
const { verifyToken } = require('../middleware/auth');

router.post('/classes/:join_code/join', verifyToken, async (req, res) => {
  const { childPublicId } = req.body;
  if (!childPublicId) return res.status(400).json({ error: 'childPublicId is required.' });

  try {
    const [cls] = await safeQuery(
      'SELECT id, class_name FROM teacher_classes WHERE join_code = ?',
      [req.params.join_code.toUpperCase()]
    );
    if (!cls.length) return res.status(404).json({ error: 'Invalid class code.' });

    const [childRows] = await safeQuery(
      'SELECT id, name FROM children WHERE public_id = ? AND parent_user_id = ? AND deleted_at IS NULL LIMIT 1',
      [childPublicId, req.user.id]
    );
    if (!childRows.length) return res.status(403).json({ error: 'Child not found or does not belong to this account.' });

    await safeQuery(
      'INSERT IGNORE INTO class_enrollments (class_id, child_id) VALUES (?, ?)',
      [cls[0].id, childRows[0].id]
    );

    res.status(201).json({
      success: true,
      message: `${childRows[0].name} has joined ${cls[0].class_name}!`,
    });
  } catch (err) {
    console.error('[teacher/join-class]', err.message);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

module.exports = { router, authenticateTeacher };
