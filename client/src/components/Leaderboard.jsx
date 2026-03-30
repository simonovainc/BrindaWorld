/**
 * Leaderboard.jsx — BrindaWorld Competition Leaderboard
 * Phase 2 P4: Shows top players for a competition.
 */

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const T = {
  primary: '#d63384', secondary: '#7b2ff7',
  text: '#2d1b69', light: '#888', border: '#f0c0d8',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ competitionId, childPublicId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) return;
    setLoading(true);
    fetch(`${API_BASE}/competitions/${competitionId}/leaderboard`)
      .then(r => r.json())
      .then(data => setEntries(data.leaderboard || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [competitionId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '1rem', color: T.light }}>Loading leaderboard...</div>;

  return (
    <div style={{ background: 'white', border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', marginTop: '1rem' }}>
      <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, padding: '0.9rem 1.25rem' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 700 }}>🏆 Leaderboard</h3>
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: T.light, fontSize: '0.9rem' }}>
          No entries yet. Play to be the first on the board!
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff0f5' }}>
              <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: T.text, width: 50 }}>Rank</th>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: T.text }}>Player</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: T.text, width: 80 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isMe = childPublicId && entry.child_public_id === childPublicId;
              return (
                <tr key={i} style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: isMe ? '#fff0f5' : 'white',
                }}>
                  <td style={{ padding: '0.55rem', textAlign: 'center', fontSize: '1rem' }}>
                    {MEDALS[entry.rank - 1] || entry.rank}
                  </td>
                  <td style={{ padding: '0.55rem', fontSize: '0.88rem', color: T.text, fontWeight: isMe ? 700 : 400 }}>
                    {entry.display_name}
                    {entry.province_code && <span style={{ color: T.light, fontSize: '0.75rem', marginLeft: '0.4rem' }}>{entry.province_code}</span>}
                    {isMe && <span style={{ color: T.primary, fontSize: '0.75rem', marginLeft: '0.4rem', fontWeight: 700 }}>YOU</span>}
                  </td>
                  <td style={{ padding: '0.55rem', textAlign: 'center', fontWeight: 700, color: T.primary, fontSize: '0.95rem' }}>
                    {entry.score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
