/**
 * AboutPage.jsx — BrindaWorld About / Mission
 * Phase 3 S5
 */
import { Link } from 'react-router-dom';

const T = { primary: '#d63384', secondary: '#7b2ff7', text: '#2d1b69', light: '#888', bg: '#fff0f5' };

const PROFESSIONS = [
  'Judge', 'Military Officer', 'Prime Minister', 'Doctor', 'Astronaut', 'Engineer',
  'Climate Scientist', 'Author', 'CEO', 'Teacher', 'Diplomat', 'Public Health Officer',
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Empowering the Next Generation of Women Leaders</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto' }}>
          Every girl deserves to see herself as a judge, astronaut, Prime Minister — and anything else she dreams of being.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Mission */}
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: T.primary, fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem' }}>Our Mission</h2>
          <p style={{ color: T.text, lineHeight: 1.8 }}>
            BrindaWorld was created with one simple belief: when girls see women who look like them in positions of power, leadership, and excellence, they begin to believe they can get there too.
          </p>
          <p style={{ color: T.text, lineHeight: 1.8, marginTop: '0.75rem' }}>
            Through chess, coding, geography, and our "She Can Be" role model program, we build the confidence, curiosity, and skills that girls need to lead.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
          {[
            { value: '12', label: 'Professions to Explore' },
            { value: '195', label: 'Countries in Geography' },
            { value: 'EN/FR', label: 'Bilingual Support' },
            { value: 'Free', label: 'To Start' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem', textAlign: 'center', minWidth: 130, border: '1px solid #f0c0d8' }}>
              <div style={{ color: T.primary, fontWeight: 800, fontSize: '1.5rem' }}>{s.value}</div>
              <div style={{ color: T.light, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* She Can Be */}
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: T.primary, fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem' }}>The "She Can Be" Vision</h2>
          <p style={{ color: T.text, lineHeight: 1.8, marginBottom: '1rem' }}>
            Our 12 profession role models feature real Canadian women who broke barriers:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PROFESSIONS.map(p => (
              <span key={p} style={{ background: T.bg, border: '1px solid #f0c0d8', borderRadius: 20, padding: '0.35rem 0.85rem', fontSize: '0.82rem', color: T.text, fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        </div>

        {/* Founder */}
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: T.primary, fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem' }}>Built in Canada 🍁</h2>
          <p style={{ color: T.text, lineHeight: 1.8 }}>
            BrindaWorld is built by Simonova Inc. in New Brunswick, Canada. We believe Canadian girls deserve world-class educational technology that reflects their values, languages, and role models.
          </p>
        </div>

        {/* Contact */}
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: T.light }}>Questions? <a href="mailto:hello@brindaworld.ca" style={{ color: T.primary, fontWeight: 700 }}>hello@brindaworld.ca</a></p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ color: T.light, fontSize: '0.88rem' }}>Privacy</Link>
            <Link to="/teachers" style={{ color: T.light, fontSize: '0.88rem' }}>Teachers</Link>
            <Link to="/" style={{ color: T.light, fontSize: '0.88rem' }}>Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
