/**
 * PrivacyPage.jsx — BrindaWorld Privacy Policy (COPPA + PIPEDA)
 * Phase 3 S5
 */
import { Link } from 'react-router-dom';

const T = { primary: '#d63384', text: '#2d1b69', light: '#888', bg: '#fff0f5' };

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <Link to="/" style={{ color: T.primary, fontWeight: 700, fontSize: '0.88rem' }}>← Back to Home</Link>
        <h1 style={{ color: T.text, fontSize: '2rem', fontWeight: 800, margin: '1rem 0 0.5rem' }}>Privacy Policy</h1>
        <p style={{ color: T.light, marginBottom: '2rem' }}>Last updated: March 2026 | Simonova Inc., New Brunswick, Canada</p>

        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', lineHeight: 1.8, color: T.text }}>
          <h2 style={{ color: T.primary }}>1. Overview</h2>
          <p>BrindaWorld is operated by Simonova Inc. We are committed to protecting the privacy of children and families using our platform. This policy complies with COPPA (Children's Online Privacy Protection Act) and PIPEDA (Personal Information Protection and Electronic Documents Act).</p>

          <h2 style={{ color: T.primary }}>2. Information We Collect</h2>
          <p><strong>Parents:</strong> Email, first name, last name (required for registration). Optional: province, school name.</p>
          <p><strong>Children:</strong> First name, age, avatar selection (provided by parent). We do NOT collect email addresses from children.</p>
          <p><strong>Gameplay:</strong> Session duration, game scores, quiz responses — used to generate progress reports for parents and teachers.</p>

          <h2 style={{ color: T.primary }}>3. Parental Consent (COPPA)</h2>
          <p>We obtain verifiable parental consent before collecting any information about children under 13. Parents create child profiles and control all child data. Parents can review, modify, or delete their child's data at any time from the Dashboard.</p>

          <h2 style={{ color: T.primary }}>4. How We Use Information</h2>
          <ul>
            <li>To provide educational content and track learning progress</li>
            <li>To generate progress reports for parents and authorized teachers</li>
            <li>To send account-related emails (welcome, weekly reports)</li>
            <li>To improve our platform and develop new educational content</li>
          </ul>

          <h2 style={{ color: T.primary }}>5. Data Sharing</h2>
          <p>We do NOT sell, rent, or trade children's personal information. Data is shared only with:</p>
          <ul>
            <li>Teachers who have been granted access by the parent via class join codes</li>
            <li>Service providers (Supabase for auth, Hostinger for hosting, Stripe for payments)</li>
          </ul>

          <h2 style={{ color: T.primary }}>6. Data Retention & Deletion</h2>
          <p>Parents can delete child profiles at any time. Account deletion requests can be sent to hello@brindaworld.ca and will be processed within 48 hours.</p>

          <h2 style={{ color: T.primary }}>7. PIPEDA Compliance</h2>
          <p>As a Canadian company, we comply with PIPEDA. Individuals have the right to access, correct, and request deletion of their personal information. Contact our Privacy Officer at hello@brindaworld.ca.</p>

          <h2 style={{ color: T.primary }}>8. Contact</h2>
          <p>Privacy Officer: Simonova Inc.<br />Email: hello@brindaworld.ca<br />Location: New Brunswick, Canada</p>
        </div>
      </div>
    </div>
  );
}
