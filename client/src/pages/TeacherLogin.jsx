/**
 * TeacherLogin.jsx — BrindaWorld Teacher Sign In
 * Phase 2 P1
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const T = {
  primary: '#d63384', secondary: '#7b2ff7', bg: '#fff0f5',
  card: '#fff', text: '#2d1b69', light: '#888', border: '#f0c0d8',
};

const inputStyle = {
  width: '100%', padding: '0.7rem 0.9rem',
  border: `1.5px solid ${T.border}`, borderRadius: 8,
  fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit',
  outline: 'none', color: T.text, background: 'white',
};

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/teachers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('teacher_token', data.token);
      localStorage.setItem('teacher_user', JSON.stringify(data.teacher));
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: T.card, borderRadius: 20, padding: '2.5rem', maxWidth: 400, width: '100%', boxShadow: '0 6px 32px rgba(214,51,132,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🏫</span>
          <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Teacher Sign In</h1>
          <p style={{ color: T.light, fontSize: '0.88rem', margin: 0 }}>Access your BrindaWorld teacher dashboard</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '0.7rem', fontSize: '0.86rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.75rem',
            background: loading ? '#ccc' : `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
            color: 'white', border: 'none', borderRadius: 10,
            fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: T.light, fontSize: '0.88rem' }}>
          New teacher? <Link to="/teacher/register" style={{ color: T.primary, fontWeight: 700 }}>Create Account</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', color: T.light, fontSize: '0.82rem' }}>
          <Link to="/" style={{ color: T.light }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
