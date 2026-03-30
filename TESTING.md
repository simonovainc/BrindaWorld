# BrindaWorld — Testing Guide

## Running Tests

```bash
# Server API tests (Jest + Supertest)
npm test

# With coverage report
npm run test:coverage
```

## What's Tested

### API Tests (`tests/api.test.js`)
| Suite | Tests | Description |
|-------|-------|-------------|
| Health Check | 2 | GET /api/health returns 200, correct fields |
| Auth Endpoints | 5 | Register validation, login validation, logout, me/children require auth |
| Teacher Endpoints | 4 | Register/login validation, me/classes require auth |
| Competition Endpoints | 2 | GET /api/competitions and /active return arrays |
| Feedback Endpoints | 1 | POST /api/feedback requires auth |
| Session Endpoints | 2 | Start/end require auth |
| Leads Endpoint | 1 | POST /api/leads requires email |
| Error Handling | 1 | Unknown routes handled |
| **Total** | **18+** | |

## Adding New Tests

1. Create test file in `tests/` directory
2. Mock database calls using `jest.mock('../src/db', ...)`
3. Import the Express app: `const app = require('../index')`
4. Use `supertest` for HTTP assertions
5. Run `npm test` to verify

## Test Architecture

- Tests mock the MySQL database and Supabase client
- The Express app exports itself via `module.exports = app`
- `app.listen()` only fires when run directly (not when imported by tests)
- All tests are integration-level (HTTP request → response)
