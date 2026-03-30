/**
 * emailService.js — BrindaWorld Email Notification System
 * Phase 3 S2: Nodemailer SMTP, welcome emails, badge notifications, weekly reports.
 */

'use strict';

const nodemailer = require('nodemailer');

// ── SMTP Transport ───────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  tls: { rejectUnauthorized: false },
});

const FROM = process.env.SMTP_FROM || 'BrindaWorld <hello@brindaworld.ca>';

// ── Helpers ──────────────────────────────────────────────────────────────────
async function sendMail(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[Email] Sent: "${subject}" → ${to}`);
  } catch (err) {
    console.error(`[Email] Failed: "${subject}" → ${to}:`, err.message);
  }
}

// ── Welcome Email (Parent) ───────────────────────────────────────────────────
async function sendWelcomeEmail({ email, firstName }) {
  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#fff0f5;border-radius:16px;">
      <h1 style="color:#d63384;font-size:1.5rem;">Welcome to BrindaWorld, ${firstName}! 🌸</h1>
      <p style="color:#2d1b69;line-height:1.6;">
        Thank you for joining our community of parents raising confident, curious daughters.
      </p>
      <p style="color:#2d1b69;line-height:1.6;">Here's how to get started:</p>
      <ol style="color:#2d1b69;line-height:1.8;">
        <li>Add your daughter's profile in the <a href="https://brindaworld.ca/dashboard" style="color:#d63384;">Dashboard</a></li>
        <li>Explore Chess, Coding, Geography and the "She Can Be" quizzes</li>
        <li>Track her progress with weekly activity stats</li>
      </ol>
      <p style="color:#888;font-size:0.85rem;margin-top:2rem;">
        Questions? Reply to this email or visit <a href="https://brindaworld.ca/contact" style="color:#d63384;">brindaworld.ca/contact</a>
      </p>
      <p style="color:#888;font-size:0.8rem;">BrindaWorld — She Can Be Anything 👑</p>
    </div>
  `;
  return sendMail(email, 'Welcome to BrindaWorld! 🌸', html);
}

// ── Welcome Email (Teacher) ──────────────────────────────────────────────────
async function sendTeacherWelcomeEmail({ email, firstName, schoolName }) {
  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f0f5ff;border-radius:16px;">
      <h1 style="color:#7b2ff7;font-size:1.5rem;">Welcome, ${firstName}! 🏫</h1>
      <p style="color:#2d1b69;line-height:1.6;">
        Your BrindaWorld teacher account is ready${schoolName ? ` for ${schoolName}` : ''}.
      </p>
      <p style="color:#2d1b69;line-height:1.6;">Quick start:</p>
      <ol style="color:#2d1b69;line-height:1.8;">
        <li>Create a class in your <a href="https://brindaworld.ca/teacher/dashboard" style="color:#7b2ff7;">Teacher Dashboard</a></li>
        <li>Share the 6-character join code with parents</li>
        <li>Track student progress and print reports</li>
      </ol>
      <p style="color:#888;font-size:0.85rem;margin-top:2rem;">
        View our <a href="https://brindaworld.ca/curriculum" style="color:#7b2ff7;">NB Curriculum Alignment</a> document.
      </p>
      <p style="color:#888;font-size:0.8rem;">BrindaWorld Teacher Portal</p>
    </div>
  `;
  return sendMail(email, 'Your BrindaWorld Teacher Account is Ready! 🏫', html);
}

// ── Badge Notification ───────────────────────────────────────────────────────
async function sendBadgeNotification({ parentEmail, parentFirstName, childName, profession, score }) {
  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#fff0f5;border-radius:16px;">
      <h1 style="color:#d63384;font-size:1.4rem;">🏅 ${childName} earned a new badge!</h1>
      <p style="color:#2d1b69;line-height:1.6;">
        Hi ${parentFirstName}, great news! ${childName} completed the <strong>${profession}</strong> quiz
        with a score of <strong>${score}%</strong> and earned the ${profession} badge!
      </p>
      <p style="color:#2d1b69;line-height:1.6;">
        Keep the momentum going — there are 12 professions to explore in "She Can Be".
      </p>
      <p style="color:#888;font-size:0.8rem;margin-top:2rem;">BrindaWorld — She Can Be Anything 👑</p>
    </div>
  `;
  return sendMail(parentEmail, `🏅 ${childName} earned the ${profession} badge!`, html);
}

// ── Weekly Parent Report (Cron) ──────────────────────────────────────────────
async function runWeeklyParentReports(safeQuery) {
  console.log('[WeeklyReport] Starting...');
  try {
    const [parents] = await safeQuery(
      `SELECT u.id, u.email, u.first_name
       FROM users u
       WHERE u.role = 'parent' AND u.deleted_at IS NULL`
    );

    for (const parent of parents) {
      try {
        const [children] = await safeQuery(
          `SELECT c.name,
                  COUNT(gs.id) AS sessions,
                  COALESCE(SUM(gs.duration_seconds), 0) AS total_seconds,
                  COUNT(DISTINCT gs.game_id) AS games
           FROM children c
           LEFT JOIN game_sessions gs ON gs.child_id = c.id AND gs.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
           WHERE c.parent_user_id = ? AND c.deleted_at IS NULL
           GROUP BY c.id`,
          [parent.id]
        );

        if (!children.length) continue;

        const rows = children.map(c =>
          `<tr><td style="padding:0.4rem 0.8rem;">${c.name}</td><td style="text-align:center;padding:0.4rem;">${c.sessions}</td><td style="text-align:center;padding:0.4rem;">${Math.round(c.total_seconds / 60)}m</td><td style="text-align:center;padding:0.4rem;">${c.games}</td></tr>`
        ).join('');

        const html = `
          <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#fff0f5;border-radius:16px;">
            <h1 style="color:#d63384;font-size:1.3rem;">Weekly Activity Report 📊</h1>
            <p style="color:#2d1b69;">Hi ${parent.first_name}, here's what your daughters did this week:</p>
            <table style="width:100%;border-collapse:collapse;margin:1rem 0;background:white;border-radius:8px;overflow:hidden;">
              <thead><tr style="background:#fff0f5;"><th style="padding:0.5rem;">Child</th><th style="text-align:center;padding:0.5rem;">Sessions</th><th style="text-align:center;padding:0.5rem;">Time</th><th style="text-align:center;padding:0.5rem;">Games</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="color:#888;font-size:0.85rem;"><a href="https://brindaworld.ca/dashboard" style="color:#d63384;">View full details in your dashboard →</a></p>
            <p style="color:#888;font-size:0.75rem;margin-top:2rem;">BrindaWorld — She Can Be Anything 👑</p>
          </div>
        `;

        await sendMail(parent.email, 'Weekly Activity Report — BrindaWorld 📊', html);
      } catch (e) {
        console.error(`[WeeklyReport] Error for parent ${parent.id}:`, e.message);
      }
    }
    console.log(`[WeeklyReport] Done. Sent to ${parents.length} parents.`);
  } catch (err) {
    console.error('[WeeklyReport] Fatal:', err.message);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendTeacherWelcomeEmail,
  sendBadgeNotification,
  runWeeklyParentReports,
};
