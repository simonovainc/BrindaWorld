import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const T = {
  primary:   '#d63384',
  secondary: '#7b2ff7',
  bg:        '#fff0f5',
  text:      '#2d1b69',
  light:     '#888',
  border:    '#f0c0d8',
};

const inputStyle = {
  width: '100%', padding: '0.68rem 0.85rem',
  border: `1.5px solid ${T.border}`, borderRadius: 9,
  fontSize: '0.95rem', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit', color: T.text,
};

function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: 'parent', agreedToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key) => (e) => {
    setError('');   // clear error as soon as user edits anything
    setForm(p => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.password, form.firstName, form.lastName, form.role);
      navigate('/dashboard');
    } catch (err) {
      // AuthContext.register() always throws a plain Error with the server message
      setError(err.message || 'Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem 1rem', fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 490 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3.2rem', lineHeight: 1 }}>👑</div>
          <h1 style={{ color: T.text, margin: '0.3rem 0 0', fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            BrindaWorld
          </h1>
          <p style={{ color: T.light, margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
            Create your free account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 18, padding: '2rem 2.2rem',
          boxShadow: '0 6px 32px rgba(214,51,132,0.13)',
          border: `1px solid ${T.border}`,
        }}>

          <h2 style={{ color: T.text, margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
            Create your account
          </h2>

          {error && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              color: '#991b1b', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 9,
              padding: '0.75rem 1rem', marginBottom: '1.25rem',
              fontSize: '0.88rem', lineHeight: 1.5,
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* First / Last name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([field, label]) => (
                <div key={field}>
                  <label style={{ display: 'block', color: T.text, fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    {label} *
                  </label>
                  <input type="text" value={form[field]} onChange={set(field)} required style={inputStyle} />
                </div>
              ))}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', color: T.text, fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Email *
              </label>
              <input type="email" value={form.email} onChange={set('email')} required style={inputStyle} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', color: T.text, fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Password * <span style={{ color: T.light, fontWeight: 400 }}>(min 8 characters)</span>
              </label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={8} style={inputStyle} />
            </div>

            {/* Role toggle */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: T.text, fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                I am a *
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[['parent', '👨‍👩‍👧 Parent'], ['teacher', '🎓 Teacher']].map(([val, label]) => (
                  <label key={val} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.4rem', padding: '0.6rem',
                    border: `2px solid ${form.role === val ? T.primary : T.border}`,
                    borderRadius: 9, cursor: 'pointer',
                    background: form.role === val ? '#fff0f5' : 'white',
                    color: form.role === val ? T.primary : T.text,
                    fontWeight: form.role === val ? 700 : 400,
                    fontSize: '0.9rem', transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="role" value={val} checked={form.role === val}
                      onChange={set('role')} style={{ display: 'none' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* COPPA notice */}
            <div style={{
              background: '#f0f8ff', border: '1px solid #bee3f8',
              borderRadius: 9, padding: '0.75rem 1rem',
              marginBottom: '0.85rem', fontSize: '0.82rem', color: '#2c5282',
            }}>
              🔒 <strong>Child Data Protection (COPPA / PIPEDA):</strong> By registering, you confirm
              you are 18 or older and agree to our child data protection policy. We never sell
              children's personal data.
            </div>

            {/* Terms checkbox */}
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
              marginBottom: '1.3rem', cursor: 'pointer',
              fontSize: '0.85rem', color: T.text, lineHeight: 1.5,
            }}>
              <input
                type="checkbox" checked={form.agreedToTerms} onChange={set('agreedToTerms')}
                style={{ marginTop: 3, accentColor: T.primary, width: 15, height: 15 }}
              />
              I agree to the{' '}
              <a href="#" style={{ color: T.primary, textDecoration: 'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: T.primary, textDecoration: 'none' }}>Privacy Policy</a>
            </label>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '0.82rem',
                background: loading ? '#ccc' : `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: '1rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Creating account…' : 'Create Account 🚀'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.4rem', fontSize: '0.88rem', color: T.light }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: T.primary, fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
