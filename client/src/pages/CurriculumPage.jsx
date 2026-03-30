/**
 * CurriculumPage.jsx — NB Curriculum Alignment
 * Phase 3 S6: Printable curriculum document.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const T = { primary: '#d63384', secondary: '#7b2ff7', text: '#2d1b69', light: '#888', bg: '#fff0f5' };

export default function CurriculumPage() {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/curriculum`)
      .then(r => r.json())
      .then(data => setCurriculum(data.curriculum))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.primary }}>Loading curriculum...</div>;

  const subjects = curriculum?.subjects || {};

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="no-print" style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, padding: '2rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>NB Curriculum Alignment</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0.5rem 0 1rem' }}>How BrindaWorld maps to New Brunswick curriculum outcomes</p>
        <button onClick={() => window.print()} style={{ background: 'white', color: T.primary, border: 'none', borderRadius: 10, padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}>
          Download as PDF 🖨️
        </button>
      </div>

      <div style={{ maxWidth: 850, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Print header */}
        <div style={{ display: 'none' }} className="print-only">
          <h1 style={{ color: T.text }}>BrindaWorld — NB Curriculum Alignment</h1>
          <p>Province: New Brunswick | Updated: {curriculum?.lastUpdated}</p>
        </div>

        {Object.entries(subjects).map(([key, sub]) => (
          <div key={key} style={{ background: 'white', borderRadius: 16, padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid #f0c0d8', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>{sub.icon}</span>
              <div>
                <h2 style={{ color: T.text, margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{sub.title}</h2>
                <p style={{ color: T.light, margin: 0, fontSize: '0.82rem' }}>
                  NB Subjects: {sub.nbSubjects.join(', ')} | Grades: {sub.gradeRange}
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700, color: T.text, width: 100 }}>Grade Band</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700, color: T.text }}>Learning Outcomes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sub.outcomes).map(([band, outcomes]) => (
                  <tr key={band} style={{ borderBottom: '1px solid #f0c0d8' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: T.primary }}>{band}</td>
                    <td style={{ padding: '0.5rem', color: T.text }}>{outcomes.join(' | ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* School Board Contact */}
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', textAlign: 'center', border: '1px solid #f0c0d8' }}>
          <h3 style={{ color: T.text, fontWeight: 700, marginBottom: '0.5rem' }}>Interested in BrindaWorld for your school?</h3>
          <p style={{ color: T.light, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Contact us for school licensing, district pricing, and curriculum integration support.
          </p>
          <a href="mailto:hello@brindaworld.ca" style={{ color: T.primary, fontWeight: 700, fontSize: '1rem' }}>hello@brindaworld.ca</a>
        </div>

        <p className="no-print" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/teachers" style={{ color: T.light }}>← Back to Teachers</Link>
          {' | '}
          <Link to="/" style={{ color: T.light }}>Home</Link>
        </p>
      </div>
    </div>
  );
}
