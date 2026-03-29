# BrindaWorld Platform Architecture

## Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React + Vite | Hostinger (built to `public_html`) |
| Backend | Express.js (Node.js) | Hostinger Node.js app |
| Database | MySQL 8 | Hostinger managed MySQL |
| Auth | Supabase (JWT only) | Supabase cloud |
| Payments | Stripe (Session 16 — not yet built) | — |
| Email | Resend (Session 18 — not yet built) | — |

---

## Directory Structure

```
brindaworld/
├── client/                   React + Vite frontend
│   └── src/
│       ├── api.js            Axios instance + Bearer token interceptor
│       ├── context/
│       │   └── AuthContext.jsx   Session lifecycle, children state
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Home.jsx          Homepage (hero, categories, professions)
│           ├── Register.jsx
│           ├── Login.jsx
│           └── Dashboard.jsx     Parent KPI dashboard
├── src/                      Express.js backend
│   ├── db.js                 MySQL connection pool (mysql2/promise)
│   ├── lib/
│   │   ├── supabase.js       Backend Supabase client
│   │   └── integrity.js      Anti-cheat scoring engine
│   ├── middleware/
│   │   └── auth.js           JWT verification middleware
│   ├── routes/
│   │   ├── auth.js           Auth + children CRUD (/api/auth/*)
│   │   └── api.js            All other routes (/api/*)
│   ├── utils/
│   │   └── identity.js       UUID, name validation, email masking
│   └── migrate.js            Runs all SQL migrations in order
├── migrations/               SQL migration files (source of truth)
│   ├── 001_operational.sql
│   ├── 002_compliance.sql
│   ├── 003_analytics.sql
│   ├── 004_learning.sql
│   ├── 005_warehouse.sql
│   ├── 006_governance.sql
│   ├── 007_auth.sql
│   ├── 009_children_identity.sql
│   ├── 010_pricing_v2.sql
│   ├── 011_feedback.sql
│   ├── 012_integrity.sql
│   └── 013_competitions.sql
├── server/migrations/        Copy of migrations (Hostinger deploy target)
├── index.js                  Express entry point
└── ARCHITECTURE.md           This file
```

---

## Module Map

| Module | File | Responsibility |
|---|---|---|
| Auth middleware | `src/middleware/auth.js` | JWT validation via Supabase; attaches `req.user` |
| Auth routes | `src/routes/auth.js` | Register, login, logout, me, children CRUD |
| API routes | `src/routes/api.js` | Feedback, dashboard summary, sessions, competitions |
| MySQL pool | `src/db.js` | Shared connection pool — never create ad-hoc connections |
| Supabase client | `src/lib/supabase.js` | Backend-only Supabase auth client |
| Integrity engine | `src/lib/integrity.js` | Anti-cheat scoring (never exposed to child) |
| Identity utils | `src/utils/identity.js` | UUID generation, name validation, email masking |

---

## Database Layers

| Migration | Tables | Purpose |
|---|---|---|
| 001 | 12 | Operational (users, children, subscriptions, classes) |
| 002 | 11 | Compliance (COPPA, consent records, audit log) |
| 003 | 22 | Analytics and growth metrics |
| 004 | 16 | Learning and pedagogy (curricula, progress) |
| 005 | 18 | Data warehouse (aggregated reporting) |
| 006 | 24 | AI governance (model cards, safety logs) |
| 007 | 0 | Auth integration (adds `supabase_id` column to users) |
| 008 | — | (skipped — use 010 for pricing) |
| 009 | 0 | Children identity hardening (public_id UUID, active_sentinel) |
| 010 | 1 | Pricing v2 seed (licence_types, 15 tiers) |
| 011 | 1 | Feedback and services marketplace (user_feedback) |
| 012 | 2 | Anti-cheat (game_sessions, integrity_events) |
| 013 | 3 | Group competitions (competitions, entries, leaderboard) |
| **TOTAL** | **110+** | |

---

## Auth Flow

```
User visits /register
  → client calls POST /api/auth/register
  → server calls supabase.auth.signUp()
  → Supabase creates auth user, sends verification email
  → server inserts row into MySQL users table
  → returns { token, user } to client
  → client stores token in localStorage as 'brinda_token'

Every protected API call:
  → client sends Authorization: Bearer <jwt>
  → src/middleware/auth.js calls supabase.auth.getUser(token)
  → Supabase validates JWT → returns supabase user id
  → middleware queries MySQL: SELECT * FROM users WHERE supabase_id = ?
  → attaches req.user = { id, email, role, firstName, lastName }
  → route handler runs
```

---

## Pricing Tiers

| Code | Name | Children | Price CAD | Cycle |
|---|---|---|---|---|
| FREE | Explorer | 2 | $0 | — |
| FAMILY_M | Family | 6 | $4.99 | Monthly |
| FAMILY_A | Family Annual | 6 | $39.99 | Annual |
| FAMILY_PLUS_M | Family Plus | 10 | $7.99 | Monthly |
| FAMILY_PLUS_A | Family Plus Annual | 10 | $59.99 | Annual |
| GIFT_3M / 6M / 12M | Gift Cards | 6 | $14.99–$39.99 | One-time |
| GROUP | Group | 20 | $149 | Annual |
| SCHOOL_S | School Starter | 30 | $99 | Annual |
| SCHOOL_M | School Standard | 150 | $299 | Annual |
| SCHOOL_L | School Unlimited | ∞ | $999 | Annual |
| DISTRICT / PROVINCE / NGO | Institutional | ∞ | Custom | Custom |

---

## API Reference

### Public endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/competitions` | Active competitions list |
| GET | `/api/competitions/:id/leaderboard` | Top 20 leaderboard (COPPA-safe) |

### Protected endpoints (Bearer JWT required)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/child` | Add child profile |
| GET | `/api/auth/children` | List children |
| DELETE | `/api/auth/child/:id` | Soft-delete child |
| GET | `/api/dashboard/summary` | KPIs + children + weekly activity |
| POST | `/api/feedback` | Submit feedback / service request |
| GET | `/api/feedback` | User's feedback history (last 10) |
| POST | `/api/sessions/start` | Start game session |
| POST | `/api/sessions/end` | End session + compute integrity score |
| GET | `/api/sessions/child/:childId` | Session history for child |
| POST | `/api/competitions/:id/enter` | Enter child in competition |

---

## Integrity Scoring

The anti-cheat engine (`src/lib/integrity.js`) computes a 0–100 score per session:

| Flag | Deduction | Trigger |
|---|---|---|
| RAPID_COMPLETION | –20 | Duration < 20% of average |
| PERFECT_RETRY | –15 | 100% score, 0 retries, 0 hints, >3 questions |
| LATE_NIGHT | –25 | Session hour 00:00–04:59 |
| HIGH_RETRY_RATE | –10 | Retries > 50% of questions |

Score labels:
- 80–100: Excellent (silent — don't show to parent unless they ask)
- 60–79: Review Recommended (yellow)
- 0–59: Needs Review (red) — auto-creates `integrity_events` rows

**Rule: integrity scores and flags are NEVER sent to the child's session.**

---

## Deployment Checklist (Owner)

1. Run `ALL_PENDING_MIGRATIONS.sql` in phpMyAdmin
2. Redeploy Hostinger Node.js app
3. Visit https://lemonchiffon-gnat-615577.hostingersite.com
4. Test: register → dashboard → add child → submit feedback
