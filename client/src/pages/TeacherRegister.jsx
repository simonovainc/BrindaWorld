/**
 * TeacherRegister.jsx — BrindaWorld Teacher Registration
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

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', schoolName: '', province: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/teachers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('teacher_token', data.token);
      localStorage.setItem('teacher_user', JSON.stringify(data.teacher));
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: T.card, borderRadius: 20, padding: '2.5rem', maxWidth: 440, width: '100%', boxShadow: '0 6px 32px rgba(214,51,132,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🏫</span>
          <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Teacher Registration</h1>
          <p style={{ color: T.light, fontSize: '0.88rem', margin: 0 }}>Join BrindaWorld to track your students' progress</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '0.7rem', fontSize: '0.86rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>First Name *</label>
              <input type="text" required value={form.firstName} onChange={set('firstName')} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>Last Name *</label>
              <input type="text" required value={form.lastName} onChange={set('lastName')} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>Email *</label>
            <input type="email" required value={form.email} onChange={set('email')} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>Password * (min 8 chars)</label>
            <input type="password" required minLength={8} value={form.password} onChange={set('password')} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>School Name</label>
              <input type="text" value={form.schoolName} onChange={set('schoolName')} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: '0.3rem' }}>Province</label>
              <input type="text" value={form.province} onChange={set('province')} style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.75rem',
            background: loading ? '#ccc' : `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
            color: 'white', border: 'none', borderRadius: 10,
            fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Creating Account...' : 'Create Teacher Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: T.light, fontSize: '0.88rem' }}>
          Already have an account? <Link to="/teacher/login" style={{ color: T.primary, fontWeight: 700 }}>Sign In</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', color: T.light, fontSize: '0.82rem' }}>
          <Link to="/" style={{ color: T.light }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
