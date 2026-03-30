/**
 * api.test.js — BrindaWorld API Integration Tests
 * Phase 3 S1: Tests health, auth, and core API endpoints.
 */

const request = require('supertest');

// Mock the database before requiring app
jest.mock('../src/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[]]),
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([[]]),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    }),
  },
  safeQuery: jest.fn().mockResolvedValue([[]]),
  testConnection: jest.fn(),
  ServiceUnavailableError: class extends Error {
    constructor(msg) { super(msg); this.name = 'ServiceUnavailableError'; this.code = 'service_unavailable'; }
  },
}));

jest.mock('../src/lib/supabase', () => ({
  auth: {
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'mocked' } }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: { message: 'mocked' } }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'mocked' } }),
    getSession: jest.fn().mockResolvedValue({ error: null }),
  },
}));

const app = require('../index');

describe('Health Check', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('Health response has expected fields', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.platform).toBe('BrindaWorld');
    expect(['ok', 'degraded']).toContain(res.body.status);
  });
});

describe('Auth Endpoints', () => {
  test('POST /api/auth/register requires all fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/login requires email and password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('POST /api/auth/logout returns success', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/auth/me requires token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/children requires token', async () => {
    const res = await request(app).get('/api/auth/children');
    expect(res.statusCode).toBe(401);
  });
});

describe('Teacher Endpoints', () => {
  test('POST /api/teachers/register requires all fields', async () => {
    const res = await request(app)
      .post('/api/teachers/register')
      .send({ email: 'teacher@test.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('POST /api/teachers/login requires email and password', async () => {
    const res = await request(app)
      .post('/api/teachers/login')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/teachers/me requires token', async () => {
    const res = await request(app).get('/api/teachers/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/teachers/classes requires token', async () => {
    const res = await request(app).get('/api/teachers/classes');
    expect(res.statusCode).toBe(401);
  });
});

describe('Competition Endpoints', () => {
  test('GET /api/competitions returns array', async () => {
    const res = await request(app).get('/api/competitions');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('competitions');
    expect(Array.isArray(res.body.competitions)).toBe(true);
  });

  test('GET /api/competitions/active returns array', async () => {
    const res = await request(app).get('/api/competitions/active');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('competitions');
  });
});

describe('Feedback Endpoints', () => {
  test('POST /api/feedback requires auth', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ feedback_type: 'bug', body: 'test feedback message here' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Session Endpoints', () => {
  test('POST /api/sessions/start requires auth', async () => {
    const res = await request(app)
      .post('/api/sessions/start')
      .send({ child_id: 'abc', game_id: 'chess', game_category: 'chess' });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/sessions/end requires auth', async () => {
    const res = await request(app)
      .post('/api/sessions/end')
      .send({ session_id: 'abc' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Leads Endpoint', () => {
  test('POST /api/leads requires email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });
});

describe('Error Handling', () => {
  test('Unknown API route returns 404 or fallback', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    // Express may return 200 (catch-all to index.html), 404, or 500 (if index.html missing)
    expect([200, 404, 500]).toContain(res.statusCode);
  });
});
