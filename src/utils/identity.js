/**
 * identity.js  –  BrindaWorld identity / sanitisation utilities
 * CMMI Level 5 standard: portable, fully documented, zero external deps.
 *
 * Exports
 * ───────
 *   generatePublicId()       → RFC-4122 v4 UUID string
 *   validateChildName(name)  → { valid: bool, error: string|null }
 *   sanitizeForDisplay(str)  → trimmed, collapsed-whitespace string
 *   maskEmail(email)         → "a***@example.com" (PIPEDA-safe logging)
 *   suggestChildName(name, existingNames) → alternative nickname string
 */

'use strict';

const { randomUUID } = require('crypto'); // Node 14.17+ built-in

// ─────────────────────────────────────────────────────────────────────────────
// generatePublicId
// Returns a cryptographically random RFC-4122 v4 UUID.
// Used as the stable external identifier for children records.
// ─────────────────────────────────────────────────────────────────────────────
function generatePublicId() {
  return randomUUID();
}

// ─────────────────────────────────────────────────────────────────────────────
// validateChildName
// Rules:
//   • Required (non-empty after trim)
//   • 2 – 50 characters
//   • Letters, spaces, hyphens, apostrophes only (unicode letters OK)
//   • Cannot be only whitespace / punctuation
// ─────────────────────────────────────────────────────────────────────────────
function validateChildName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Name is required.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long.' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or fewer.' };
  }

  // Allow unicode letters (\p{L}), digits, spaces, hyphens, apostrophes
  // Reject anything else (e.g. <script>, emoji injection, SQL fragments)
  const allowed = /^[\p{L}\p{N} '\-]+$/u;
  if (!allowed.test(trimmed)) {
    return { valid: false, error: "Name may only contain letters, numbers, spaces, hyphens, and apostrophes." };
  }

  return { valid: true, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeForDisplay
// Trims leading/trailing whitespace and collapses internal runs of whitespace
// to a single space.  Safe for display in UI and logging.
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeForDisplay(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// maskEmail
// Masks the local part of an email address for PIPEDA-safe logging.
// "alice@example.com"  →  "a***@example.com"
// "ab@x.com"           →  "a***@x.com"
// ─────────────────────────────────────────────────────────────────────────────
function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local.charAt(0)}***@${domain}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// suggestChildName
// When a parent tries to add a child whose name already exists (active), this
// function generates a friendly nickname suggestion that does NOT appear in
// existingNames.
//
// Strategy (in order):
//   1. "<name> Jr."
//   2. "<name> 2", "<name> 3", … (up to 9)
//   3. "<name> Little"
//   4. "Little <name>"
// ─────────────────────────────────────────────────────────────────────────────
function suggestChildName(name, existingNames = []) {
  const existing = new Set(
    existingNames.map(n => (typeof n === 'string' ? n.trim().toLowerCase() : ''))
  );

  const candidates = [
    `${name} Jr.`,
    ...Array.from({ length: 8 }, (_, i) => `${name} ${i + 2}`),
    `${name} Little`,
    `Little ${name}`,
  ];

  for (const candidate of candidates) {
    if (!existing.has(candidate.trim().toLowerCase())) {
      return candidate;
    }
  }

  // Last-resort: append random 4-digit suffix
  return `${name} ${Math.floor(1000 + Math.random() * 9000)}`;
}

module.exports = {
  generatePublicId,
  validateChildName,
  sanitizeForDisplay,
  maskEmail,
  suggestChildName,
};
