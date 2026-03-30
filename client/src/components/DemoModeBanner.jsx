/**
 * DemoModeBanner.jsx — BrindaWorld School Board Demo Mode
 * Phase 2 P6: Activated via ?demo=true or localStorage.demo_mode=true
 */

import { useState, useEffect } from 'react';

// ── Demo data — realistic sample for school board pitches ────────────────────
export const DEMO_DATA = {
  children: [
    { id: 'demo-1', name: 'Ananya', displayName: 'Ananya', age: 8, avatar: '👧', activeThisWeek: true, lastActive: new Date().toISOString() },
    { id: 'demo-2', name: 'Priya',  displayName: 'Priya',  age: 10, avatar: '🧒', activeThisWeek: true, lastActive: new Date(Date.now() - 86400000).toISOString() },
    { id: 'demo-3', name: 'Sara',   displayName: 'Sara',   age: 7, avatar: '🌟', activeThisWeek: false, lastActive: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],
  summary: {
    total_children: 3,
    licence_type: 'FAMILY',
    seats_used: 3,
    seats_total: 6,
    member_since: '2024-09-01',
  },
  weekly_activity: {
    sessions_this_week: 14,
    minutes_this_week: 187,
    games_played: 5,
    badges_earned: 3,
  },
};

export function isDemoMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'true') {
    localStorage.setItem('demo_mode', 'true');
    return true;
  }
  return localStorage.getItem('demo_mode') === 'true';
}

export default function DemoModeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isDemoMode());
  }, []);

  const exitDemo = () => {
    localStorage.removeItem('demo_mode');
    window.location.href = '/';
  };

  if (!visible) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      color: 'white',
      padding: '0.55rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.85rem',
      fontWeight: 600,
      zIndex: 9999,
      position: 'sticky',
      top: 0,
    }}>
      <span>🏫 DEMO MODE — Sample data for school board demonstration</span>
      <button onClick={exitDemo} style={{
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 6,
        padding: '0.25rem 0.75rem',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 700,
      }}>
        Exit Demo
      </button>
    </div>
  );
}
