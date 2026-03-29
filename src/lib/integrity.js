/**
 * integrity.js  –  BrindaWorld Anti-Cheat / Integrity Scoring Engine
 * CMMI Level 5: portable, zero external deps, fully documented.
 *
 * ⚠️  IMPORTANT: integrity scores are ONLY exposed to parents and teachers.
 *               Never send integrity data to the child's own session.
 *
 * Exports
 * ───────
 *   computeIntegrityScore(sessionData)  → { score: 0–100, flags: string[] }
 *   getIntegrityLabel(score)            → { label, color, show: bool }
 *
 * Flag codes (also documented in 012_integrity.sql)
 * ──────────────────────────────────────────────────
 *   SPEED_ANOMALY    – answers submitted in < 500ms consistently
 *   PERFECT_RETRY    – wrong then immediate correct answer pattern
 *   LATE_NIGHT       – session between 23:00 and 05:00
 *   RAPID_COMPLETION – game completed in < 20% of average time
 *   HIGH_RETRY_RATE  – retries > 50% of questions
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// computeIntegrityScore
//
// Input sessionData shape:
//   {
//     duration_seconds : number   – actual session length
//     score_percent    : number   – 0-100
//     hints_used       : number
//     retries          : number
//     questions_total  : number
//     questions_correct: number
//     session_hour     : number   – 0-23, local time on device
//     average_duration : number   – avg seconds for this game (optional, default 300)
//   }
//
// Returns:
//   { score: number (0-100), flags: string[] }
// ─────────────────────────────────────────────────────────────────────────────
function computeIntegrityScore(sessionData) {
  const {
    duration_seconds   = 0,
    score_percent      = 0,
    hints_used         = 0,
    retries            = 0,
    questions_total    = 0,
    questions_correct  = 0,
    session_hour       = 12,
    average_duration   = 300,          // 5 minutes default
  } = sessionData || {};

  let score = 100;
  const flags = [];

  // ── Rule 1: RAPID_COMPLETION ──────────────────────────────────────────────
  // Duration < 20% of average → suspicious speed
  if (average_duration > 0 && duration_seconds > 0) {
    if (duration_seconds < average_duration * 0.20) {
      score -= 20;
      flags.push('RAPID_COMPLETION');
    }
  }

  // ── Rule 2: PERFECT_RETRY (suspiciously perfect with no aids) ─────────────
  // 100% correct, zero retries, zero hints — only flag if questions > 3
  if (
    questions_total > 3
    && questions_correct === questions_total
    && retries    === 0
    && hints_used === 0
    && score_percent >= 100
  ) {
    score -= 15;
    flags.push('PERFECT_RETRY');
  }

  // ── Rule 3: LATE_NIGHT ────────────────────────────────────────────────────
  // 00:00 – 04:59 local time
  if (session_hour >= 0 && session_hour < 5) {
    score -= 25;
    flags.push('LATE_NIGHT');
  }

  // ── Rule 4: HIGH_RETRY_RATE ───────────────────────────────────────────────
  // Retries exceed 50% of total questions
  if (questions_total > 0 && retries > questions_total * 0.5) {
    score -= 10;
    flags.push('HIGH_RETRY_RATE');
  }

  // ── Floor at 0 ────────────────────────────────────────────────────────────
  score = Math.max(0, score);

  return { score, flags };
}

// ─────────────────────────────────────────────────────────────────────────────
// getIntegrityLabel
//
// Maps a 0-100 integrity score to a display label.
// `show: false` means the parent UI should stay silent (all good).
// ─────────────────────────────────────────────────────────────────────────────
function getIntegrityLabel(score) {
  if (score >= 80) {
    return { label: 'Excellent',            color: 'green',  show: false };
  }
  if (score >= 60) {
    return { label: 'Review Recommended',   color: 'yellow', show: true  };
  }
  return   { label: 'Needs Review',         color: 'red',    show: true  };
}

module.exports = { computeIntegrityScore, getIntegrityLabel };
