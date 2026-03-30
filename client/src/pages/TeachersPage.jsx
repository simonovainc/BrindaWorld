/**
 * TeachersPage.jsx — BrindaWorld Teacher Landing Page
 * Phase 3 S5
 */
import { Link } from 'react-router-dom';

const T = { primary: '#d63384', secondary: '#7b2ff7', text: '#2d1b69', light: '#888', bg: '#fff0f5' };

export default function TeachersPage() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${T.secondary}, ${T.primary})`, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>BrindaWorld for Teachers 🏫</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 2rem' }}>
          Free tools to track student progress, align with NB curriculum, and inspire the next generation of women leaders.
        </p>
        <Link to="/teacher/register" style={{ display: 'inline-block', background: 'white', color: T.primary, fontWeight: 700, padding: '0.75rem 2rem', borderRadius: 12, fontSize: '1rem', textDecoration: 'none' }}>
          Create Free Teacher Account
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Features */}
        <h2 style={{ color: T.text, fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>What You Get</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {[
            { emoji: '📚', title: 'Class Management', desc: 'Create classes, share join codes with parents, manage enrollments' },
            { emoji: '📊', title: 'Student Progress', desc: 'Track sessions, time spent, games played, and quiz scores per student' },
            { emoji: '🖨️', title: 'Printable Reports', desc: 'Generate professional progress reports for parent-teacher meetings' },
            { emoji: '📝', title: 'Teacher Notes', desc: 'Add private notes about each student\'s learning journey' },
            { emoji: '🏆', title: 'Competitions', desc: 'Run class competitions with leaderboards to motivate students' },
            { emoji: '🗺️', title: 'NB Curriculum', desc: 'Content aligned with New Brunswick curriculum outcomes by grade' },
          ].map(f => (
            <div key={f.title} style={{ background: 'white', borderRadius: 14, padding: '1.5rem', border: '1px solid #f0c0d8' }}>
              <span style={{ fontSize: '2rem' }}>{f.emoji}</span>
              <h3 style={{ color: T.text, fontSize: '1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>{f.title}</h3>
              <p style={{ color: T.light, fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <h2 style={{ color: T.text, fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>How It Works</h2>
        <div style={{ background: 'white', borderRadius: 14, padding: '2rem', marginBottom: '3rem' }}>
          {[
            '1. Create your free teacher account',
            '2. Set up a class and get a 6-character join code',
            '3. Share the code with parents — they join their children to your class',
            '4. Track progress, write notes, print reports, run competitions',
          ].map(step => (
            <p key={step} style={{ color: T.text, fontSize: '1rem', lineHeight: 2, margin: 0 }}>{step}</p>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 14, border: '1px solid #f0c0d8' }}>
          <h3 style={{ color: T.text, fontWeight: 700, marginBottom: '0.5rem' }}>Ready to get started?</h3>
          <p style={{ color: T.light, marginBottom: '1rem' }}>It's completely free for teachers.</p>
          <Link to="/teacher/register" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, color: 'white', fontWeight: 700, padding: '0.75rem 2rem', borderRadius: 12, textDecoration: 'none' }}>
            Create Teacher Account
          </Link>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/curriculum" style={{ color: T.primary, fontWeight: 600 }}>Download Curriculum Alignment Document →</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem' }}><Link to="/" style={{ color: T.light }}>← Back to Home</Link></p>
      </div>
    </div>
  );
}
