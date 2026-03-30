/**
 * AdminAnalytics.jsx — BrindaWorld Internal Analytics Dashboard
 * Phase 3 S7: Revenue, usage, quiz breakdown, growth metrics.
 */
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const T = { primary: '#d63384', secondary: '#7b2ff7', text: '#2d1b69', light: '#888', bg: '#fff0f5' };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (!key) { setError('Admin key required. Use ?key=YOUR_KEY'); setLoading(false); return; }

    fetch(`${API_BASE}/admin/analytics`, { headers: { 'x-admin-key': key } })
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.primary }}>Loading analytics...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>{error}</div>;

  const s = data?.stats || {};

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <header style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, padding: '1.5rem 2rem' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>BrindaWorld Analytics 📊</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Internal dashboard — {new Date().toLocaleDateString('en-CA')}</p>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: s.total_users || 0, icon: '👥' },
            { label: 'Total Children', value: s.total_children || 0, icon: '👧' },
            { label: 'Total Sessions', value: s.total_sessions || 0, icon: '🎮' },
            { label: 'Total Teachers', value: s.total_teachers || 0, icon: '🏫' },
            { label: 'Active This Week', value: s.active_this_week || 0, icon: '⚡' },
            { label: 'Avg Session (min)', value: s.avg_session_min || 0, icon: '⏱' },
          ].map(k => (
            <div key={k.label} style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #f0c0d8', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>{k.icon}</span>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: T.primary, margin: '0.25rem 0' }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', color: T.light, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Games breakdown */}
        {s.games_breakdown && (
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #f0c0d8' }}>
            <h3 style={{ color: T.text, margin: '0 0 1rem', fontWeight: 700 }}>Sessions by Game</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead><tr style={{ background: T.bg }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Game</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>Sessions</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>Avg Score</th></tr></thead>
              <tbody>
                {s.games_breakdown.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0c0d8' }}>
                    <td style={{ padding: '0.5rem' }}>{g.game_id}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600 }}>{g.count}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{Math.round(g.avg_score || 0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signups over time */}
        {s.signups_by_day && (
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', border: '1px solid #f0c0d8' }}>
            <h3 style={{ color: T.text, margin: '0 0 1rem', fontWeight: 700 }}>Signups (Last 30 Days)</h3>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 80 }}>
              {s.signups_by_day.map((d, i) => {
                const max = Math.max(...s.signups_by_day.map(x => x.count), 1);
                const h = (d.count / max) * 70 + 10;
                return (
                  <div key={i} title={`${d.date}: ${d.count}`} style={{ flex: 1, height: h, background: `linear-gradient(to top, ${T.primary}, ${T.secondary})`, borderRadius: '3px 3px 0 0' }} />
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
