import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary:   '#d63384',
  secondary: '#7b2ff7',
  bg:        '#fff0f5',
  card:      '#ffffff',
  text:      '#2d1b69',
  light:     '#888',
  border:    '#f0c0d8',
};

const AVATARS = ['🧒', '👧', '🧒‍♀️', '👱‍♀️', '🌟', '💎', '👑', '🦋'];

const SERVICE_OPTIONS = [
  'Personal Chess Tutor (1-on-1 coaching)',
  'Coding Mentor',
  'Geography Study Group',
  'Confidence and Leadership Coach',
  'Homework Help',
  'Tournament Preparation',
  'School Curriculum Support',
  'Special Needs Accommodation',
  'Other',
];

const FEEDBACK_TYPES = [
  'Bug Report',
  'Feature Suggestion',
  'Complaint',
  'Praise',
  'General Question',
];

// ── Shared input style (mirrors Register.jsx) ────────────────────────────────
const inputStyle = {
  width: '100%', padding: '0.62rem 0.8rem',
  border: `1.5px solid ${T.border}`, borderRadius: 8,
  fontSize: '0.93rem', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit', color: T.text,
  background: 'white',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical', minHeight: 90, lineHeight: 1.55,
};

const labelStyle = {
  display: 'block', color: T.text,
  fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem',
};

// ── Small reusable alert box ─────────────────────────────────────────────────
function Alert({ type, children }) {
  const styles = {
    success: { bg: '#f0fff4', border: '#9ae6b4', color: '#276749' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
  }[type] || {};
  return (
    <div style={{
      background: styles.bg, border: `1px solid ${styles.border}`,
      color: styles.color, borderRadius: 8,
      padding: '0.7rem 0.9rem', fontSize: '0.86rem', lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Dashboard() {
  const { user, children, loading, logout, addChild, removeChild, fetchChildren } = useAuth();
  const navigate = useNavigate();

  // ── Plan ──
  const [planType, setPlanType] = useState('free');

  // ── Add child ──
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newChild,      setNewChild]      = useState({ name: '', age: '', avatar: '🧒' });
  const [addLoading,    setAddLoading]    = useState(false);
  const [addError,      setAddError]      = useState('');
  const [suggestion,    setSuggestion]    = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Feedback widget (header) ──
  const [showFeedback,   setShowFeedback]   = useState(false);
  const [fbType,         setFbType]         = useState('');
  const [fbBody,         setFbBody]         = useState('');
  const [fbLoading,      setFbLoading]      = useState(false);
  const [fbStatus,       setFbStatus]       = useState(null);  // 'success' | 'error' | null

  // ── Services section ──
  const [svcSelected,   setSvcSelected]   = useState('');
  const [svcNote,       setSvcNote]       = useState('');
  const [svcLoading,    setSvcLoading]    = useState(false);
  const [svcStatus,     setSvcStatus]     = useState(null);   // 'success' | 'error' | null

  // ── Load data ──
  useEffect(() => {
    if (!user) return;
    fetchChildren().catch(console.error);
    api.get('/auth/me')
      .then(res => setPlanType(res.data.user.planType || 'free'))
      .catch(console.error);
  }, [user]);

  // ─────────────────────── Children handlers ────────────────────────────────
  const handleAddChild = async (e) => {
    e.preventDefault();
    setAddError('');
    setSuggestion('');
    if (!newChild.name.trim() || !newChild.age) {
      setAddError('Name and age are required.');
      return;
    }
    setAddLoading(true);
    try {
      await addChild(newChild.name.trim(), parseInt(newChild.age, 10), newChild.avatar);
      setNewChild({ name: '', age: '', avatar: '🧒' });
      setShowAddForm(false);
    } catch (err) {
      const serverError    = err.response?.data?.error || 'Failed to add child.';
      const serverSuggestion = err.response?.data?.suggestion || '';
      setAddError(serverError);
      if (err.response?.status === 409 && serverSuggestion) setSuggestion(serverSuggestion);
    } finally {
      setAddLoading(false);
    }
  };

  const applySuggestion = () => {
    setNewChild(p => ({ ...p, name: suggestion }));
    setAddError('');
    setSuggestion('');
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try { await removeChild(confirmDelete.id); }
    catch (err) { console.error('[deleteChild]', err.message); }
    finally     { setConfirmDelete(null); }
  };

  // ─────────────────────── Feedback widget ─────────────────────────────────
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFbStatus(null);
    if (!fbType) return;
    if (fbBody.trim().length < 10) {
      setFbStatus('error');
      return;
    }
    setFbLoading(true);
    try {
      await api.post('/feedback', {
        feedback_type: fbType,
        body:          fbBody.trim(),
      });
      setFbStatus('success');
      setFbType('');
      setFbBody('');
      setTimeout(() => { setShowFeedback(false); setFbStatus(null); }, 3500);
    } catch {
      setFbStatus('error');
    } finally {
      setFbLoading(false);
    }
  };

  // ─────────────────────── Services request ────────────────────────────────
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setSvcStatus(null);
    if (!svcSelected) return;
    setSvcLoading(true);
    try {
      await api.post('/feedback', {
        feedback_type:     'service_request',
        service_requested: svcSelected,
        body:              svcNote.trim() || `Service requested: ${svcSelected}`,
      });
      setSvcStatus('success');
      setSvcSelected('');
      setSvcNote('');
    } catch {
      setSvcStatus('error');
    } finally {
      setSvcLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading || !user) return null;

  const planLabel = planType.charAt(0).toUpperCase() + planType.slice(1);

  // ── Shared button styles ──
  const btnPrimary = (disabled) => ({
    background: disabled
      ? '#ccc'
      : `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
    color: 'white', border: 'none', borderRadius: 9,
    padding: '0.6rem 1.5rem', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontSize: '0.92rem',
  });

  const btnGhost = {
    background: 'transparent', color: 'white',
    border: '1.5px solid rgba(255,255,255,0.55)',
    borderRadius: 9, padding: '0.42rem 1rem',
    cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ════════════════ HEADER ════════════════ */}
      <header style={{
        background: `linear-gradient(135deg, ${T.primary} 0%, ${T.secondary} 100%)`,
        padding: '1rem 2rem',
        boxShadow: '0 3px 16px rgba(214,51,132,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.9rem' }}>👑</span>
            <span style={{ color: 'white', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
              BrindaWorld
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {/* Feedback toggle button */}
            <button
              onClick={() => { setShowFeedback(v => !v); setFbStatus(null); }}
              style={btnGhost}
              title="Give Feedback"
            >
              💬 {showFeedback ? 'Close' : 'Give Feedback'}
            </button>
            <button onClick={handleLogout} style={btnGhost}>Logout</button>
          </div>
        </div>

        {/* ── Inline feedback form (expands below header nav) ── */}
        {showFeedback && (
          <div style={{
            marginTop: '1rem',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '1.1rem 1.25rem',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            {fbStatus === 'success' ? (
              <p style={{ color: 'white', margin: 0, fontWeight: 600, fontSize: '0.93rem' }}>
                Thank you for your feedback! 🙏
              </p>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.85)' }}>
                      Feedback type
                    </label>
                    <select
                      value={fbType}
                      onChange={e => setFbType(e.target.value)}
                      required
                      style={{ ...selectStyle, minWidth: 180 }}
                    >
                      <option value="" disabled>-- Select type --</option>
                      {FEEDBACK_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '2 1 260px' }}>
                    <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.85)' }}>
                      Your message <span style={{ fontWeight: 400, fontSize: '0.78rem' }}>(min 10 chars)</span>
                    </label>
                    <textarea
                      value={fbBody}
                      onChange={e => { setFbBody(e.target.value); setFbStatus(null); }}
                      placeholder="Tell us what's on your mind…"
                      required
                      style={{ ...textareaStyle, minHeight: 68 }}
                    />
                  </div>
                  <div style={{ paddingBottom: '0.1rem' }}>
                    <button type="submit" disabled={fbLoading} style={btnPrimary(fbLoading)}>
                      {fbLoading ? 'Sending…' : 'Send 💬'}
                    </button>
                  </div>
                </div>
                {fbStatus === 'error' && (
                  <p style={{ color: '#fecaca', margin: '0.5rem 0 0', fontSize: '0.83rem' }}>
                    Message must be at least 10 characters. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </header>

      {/* ════════════════ MAIN ════════════════ */}
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '2.25rem 1.25rem' }}>

        {/* ── Welcome ── */}
        <h1 style={{ color: T.text, fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.5px' }}>
          Welcome back, {user.firstName}! 👑
        </h1>
        <p style={{ color: T.light, margin: '0 0 2rem', fontSize: '0.95rem' }}>
          Manage your children's learning adventures below.
        </p>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.25rem', flexWrap: 'wrap' }}>
          {[
            { icon: '💎', label: 'Plan',     value: planLabel },
            { icon: '👧', label: 'Children', value: children.length },
            { icon: '🎮', label: 'Role',     value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
          ].map(stat => (
            <div key={stat.label} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: '1rem 1.4rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              minWidth: 130, boxShadow: '0 2px 10px rgba(214,51,132,0.07)',
            }}>
              <span style={{ fontSize: '1.9rem' }}>{stat.icon}</span>
              <div>
                <div style={{ color: T.light, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  {stat.label}
                </div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: '1.1rem' }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════ CHILDREN CARD ════════════════ */}
        <div style={{
          background: T.card, borderRadius: 18,
          border: `1px solid ${T.border}`,
          padding: '1.75rem',
          boxShadow: '0 3px 18px rgba(214,51,132,0.08)',
          marginBottom: '1.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: T.text, margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Your Children</h2>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setAddError(''); setSuggestion(''); }}
              style={btnPrimary(false)}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Child'}
            </button>
          </div>

          {/* ── Add child form ── */}
          {showAddForm && (
            <div style={{
              background: T.bg, borderRadius: 13, padding: '1.5rem',
              marginBottom: '1.75rem', border: `1px solid ${T.border}`,
            }}>
              <h3 style={{ color: T.text, margin: '0 0 1.1rem', fontSize: '1rem', fontWeight: 700 }}>
                Add New Child
              </h3>

              {addError && (
                <div style={{ marginBottom: '0.6rem' }}>
                  <Alert type="error">{addError}</Alert>
                </div>
              )}

              {suggestion && (
                <div style={{
                  background: '#f0fff4', border: '1px solid #9ae6b4',
                  borderRadius: 8, padding: '0.65rem 0.9rem',
                  marginBottom: '1rem', fontSize: '0.86rem', color: '#276749',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                }}>
                  <span>💡 Try the nickname <strong>"{suggestion}"</strong> instead?</span>
                  <button type="button" onClick={applySuggestion} style={{
                    background: '#276749', color: 'white', border: 'none',
                    borderRadius: 6, padding: '0.3rem 0.75rem',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
                  }}>Use it</button>
                </div>
              )}

              <form onSubmit={handleAddChild}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input
                      type="text" placeholder="Child's name"
                      value={newChild.name}
                      onChange={e => { setNewChild(p => ({ ...p, name: e.target.value })); setAddError(''); setSuggestion(''); }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Age (3 – 14) *</label>
                    <input
                      type="number" min={3} max={14} placeholder="Age"
                      value={newChild.age}
                      onChange={e => setNewChild(p => ({ ...p, age: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={labelStyle}>Avatar</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {AVATARS.map(emoji => (
                      <button
                        key={emoji} type="button"
                        onClick={() => setNewChild(p => ({ ...p, avatar: emoji }))}
                        style={{
                          fontSize: '1.75rem', width: 52, height: 52,
                          border: `2.5px solid ${newChild.avatar === emoji ? T.primary : T.border}`,
                          borderRadius: 12, cursor: 'pointer',
                          background: newChild.avatar === emoji ? '#fff0f5' : 'white',
                          transition: 'border-color 0.15s',
                        }}
                      >{emoji}</button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={addLoading} style={btnPrimary(addLoading)}>
                  {addLoading ? 'Adding…' : 'Add Child ✓'}
                </button>
              </form>
            </div>
          )}

          {/* ── Children cards ── */}
          {children.length === 0 && !showAddForm ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: T.light }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.6rem' }}>👧</div>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                No children added yet. Click <strong style={{ color: T.primary }}>+ Add Child</strong> to get started!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '1rem' }}>
              {children.map(child => (
                <div key={child.id} style={{
                  background: T.bg, border: `1px solid ${T.border}`,
                  borderRadius: 15, padding: '1.35rem', textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(214,51,132,0.06)',
                }}>
                  <div style={{ fontSize: '3.2rem', marginBottom: '0.5rem' }}>{child.avatar || '🧒'}</div>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                    {child.displayName || child.name}
                  </div>
                  <div style={{ color: T.light, fontSize: '0.82rem', marginBottom: '1rem' }}>Age {child.age}</div>
                  <button style={{ ...btnPrimary(false), padding: '0.42rem 0', width: '100%', borderRadius: 8, marginBottom: '0.45rem' }}>
                    Play Now 🎮
                  </button>
                  <button
                    onClick={() => setConfirmDelete(child)}
                    style={{
                      background: 'transparent', color: T.light,
                      border: `1px solid ${T.border}`, borderRadius: 8,
                      padding: '0.35rem 0', cursor: 'pointer',
                      fontSize: '0.78rem', width: '100%',
                    }}
                  >Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ════════════════ SERVICES CARD ════════════════ */}
        <div style={{
          background: T.card, borderRadius: 18,
          border: `1px solid ${T.border}`,
          borderLeft: '5px solid #FFD700',           // gold accent = premium/upsell
          padding: '1.75rem',
          boxShadow: '0 3px 18px rgba(214,51,132,0.08)',
        }}>
          <div style={{ marginBottom: '1.1rem' }}>
            <h2 style={{ color: T.text, margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 700 }}>
              Looking for More? 🌟
            </h2>
            <p style={{ color: T.light, margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
              Tell us what your child needs and we will find the right match.
            </p>
          </div>

          {svcStatus === 'success' ? (
            <Alert type="success">
              Thank you! We will be in touch within 48 hours. 💌
            </Alert>
          ) : (
            <form onSubmit={handleServiceSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>I am looking for:</label>
                <select
                  value={svcSelected}
                  onChange={e => { setSvcSelected(e.target.value); setSvcStatus(null); }}
                  required
                  style={selectStyle}
                >
                  <option value="" disabled>-- Select a service --</option>
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle}>Tell us more (optional):</label>
                <textarea
                  value={svcNote}
                  onChange={e => setSvcNote(e.target.value)}
                  placeholder="e.g. My daughter is 9, loves chess but needs help with openings. Available weekends."
                  style={textareaStyle}
                />
              </div>

              {svcStatus === 'error' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <Alert type="error">Something went wrong. Please try again.</Alert>
                </div>
              )}

              <button type="submit" disabled={svcLoading || !svcSelected} style={btnPrimary(svcLoading || !svcSelected)}>
                {svcLoading ? 'Sending…' : 'Send Request 🚀'}
              </button>
            </form>
          )}
        </div>

      </main>

      {/* ════════════════ DELETE CONFIRMATION MODAL ════════════════ */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '1rem',
        }}>
          <div style={{
            background: 'white', borderRadius: 18,
            padding: '2rem 2.2rem', maxWidth: 380, width: '100%',
            boxShadow: '0 12px 48px rgba(0,0,0,0.2)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{confirmDelete.avatar || '🧒'}</div>
            <h3 style={{ color: T.text, margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
              Remove {confirmDelete.displayName || confirmDelete.name}?
            </h3>
            <p style={{ color: T.light, fontSize: '0.88rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This will remove <strong>{confirmDelete.displayName || confirmDelete.name}</strong> from your account.
              You can always add them back later.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '0.65rem',
                  background: 'white', color: T.text,
                  border: `1.5px solid ${T.border}`, borderRadius: 10,
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem',
                }}
              >Cancel</button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1, padding: '0.65rem',
                  background: '#dc2626', color: 'white',
                  border: 'none', borderRadius: 10,
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem',
                }}
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
