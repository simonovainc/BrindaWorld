/**
 * Home.jsx — BrindaWorld Homepage
 * Sections: Hero · Categories · SheCanBe · BrindaFavorites · Testimonials · Email · Footer
 * Fully responsive. Pure inline styles — no CSS library required.
 */

import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  heroGrad:   'linear-gradient(135deg, #2D0022 0%, #6B0057 50%, #9C27B0 100%)',
  pink:       '#FF1493',
  purple:     '#6B0057',
  darkPurple: '#2D1B69',
  lightPurple:'#F8F0FF',
  dark:       '#1A0014',
  white:      '#FFFFFF',
  grey:       '#666',
  lightGrey:  '#f5f5f5',
};

const CATEGORIES = [
  { emoji: '♛', label: 'Chess',      bg: '#FFF3CD', id: 'chess'      },
  { emoji: '💻', label: 'Coding',     bg: '#D1ECF1', id: 'coding'     },
  { emoji: '🌍', label: 'Geography',  bg: '#D4EDDA', id: 'geography'  },
  { emoji: '🌸', label: 'Wellness',   bg: '#F8D7DA', id: 'wellness'   },
  { emoji: '🎨', label: 'Creativity', bg: '#E2D9F3', id: 'creativity' },
  { emoji: '🏛️', label: 'Leadership', bg: '#FFF3E0', id: 'leadership' },
];

const PROFESSIONS = [
  {
    emoji: '⚖️', title: 'Judge', category: 'Justice',
    roleModel: 'Inspired by Rosalie Abella, Supreme Court of Canada',
    quiz: ['What does a judge do?', 'What is a courtroom?', 'What is fairness?'],
  },
  {
    emoji: '🎖️', title: 'Military Officer / Defence Forces', category: 'Leadership',
    roleModel: 'Inspired by General Jennie Carignan, Chief of Defence Staff, Canadian Armed Forces',
    quiz: ['What does the military do to protect a country?', 'What does a general command?', 'What is the difference between army, navy and air force?'],
  },
  {
    emoji: '🏛️', title: 'Member of Parliament / Senator', category: 'Leadership',
    roleModel: 'Inspired by the Rt. Hon. Kim Campbell, First Female Prime Minister of Canada',
    quiz: ['What is Parliament?', 'How do you become an MP?', 'What does the Prime Minister do?'],
  },
  {
    emoji: '🩺', title: 'Doctor', category: 'Health',
    roleModel: 'Inspired by Dr. Roberta Bondar, Astronaut & Neurologist',
    quiz: ['How does the heart work?', 'What do doctors study?', 'What is a diagnosis?'],
  },
  {
    emoji: '🚀', title: 'Astronaut', category: 'STEM',
    roleModel: 'Inspired by Julie Payette, Canadian Astronaut',
    quiz: ['How do rockets work?', 'What is gravity?', 'How long to reach the moon?'],
  },
  {
    emoji: '💻', title: 'Engineer', category: 'STEM',
    roleModel: 'Inspired by Gitanjali Rao, Inventor & Engineer',
    quiz: ['What do engineers build?', 'What is a blueprint?', 'What is coding?'],
  },
  {
    emoji: '🌿', title: 'Climate Scientist', category: 'Environment',
    roleModel: 'Inspired by Wangari Maathai, Nobel Peace Prize',
    quiz: ['What is climate change?', 'What is carbon?', 'How do trees help?'],
  },
  {
    emoji: '📖', title: 'Author', category: 'Arts',
    roleModel: 'Inspired by Chimamanda Ngozi Adichie, Author',
    quiz: ['How do you write a story?', 'What is a novel?', 'What is fiction?'],
  },
  {
    emoji: '🚀', title: 'CEO / Entrepreneur', category: 'Business',
    roleModel: 'Inspired by Oprah Winfrey, Entrepreneur & Media CEO',
    quiz: ['What is a business?', 'What is profit?', 'What does a CEO do?'],
  },
  {
    emoji: '🎓', title: 'Teacher / Professor', category: 'Education',
    roleModel: 'Inspired by Malala Yousafzai, Education Activist',
    quiz: ['Why is school important?', 'What does a professor teach?', 'What is a university?'],
  },
  {
    emoji: '🕊️', title: 'Diplomat / Ambassador', category: 'Leadership',
    roleModel: 'Inspired by Louise Arbour, UN High Commissioner',
    quiz: ['What is a country?', 'What is an ambassador?', 'What is the United Nations?'],
  },
  {
    emoji: '🏥', title: 'Public Health Officer', category: 'Health',
    roleModel: 'Inspired by Dr. Theresa Tam, Chief Public Health Officer of Canada',
    quiz: ['What is public health?', 'What is a vaccine?', 'How do diseases spread?'],
  },
];

const GAMES = [
  { emoji: '💅', title: 'Nail Art Studio',    desc: 'Design and paint the perfect nails',          id: 'nail-art'    },
  { emoji: '🧁', title: 'Baking Kitchen',     desc: 'Bake and decorate delicious treats',          id: 'baking'      },
  { emoji: '💇', title: 'Glam Hair Salon',    desc: 'Style hair and create amazing looks',         id: 'hair-salon'  },
];

const TESTIMONIALS = [
  {
    quote: 'My daughter spent two hours on chess without us asking her once. BrindaWorld made learning feel like play.',
    name: 'Priya M.', role: 'Parent of 3', location: 'Toronto, ON',
  },
  {
    quote: 'The She Can Be section sparked a real conversation about careers. She now says she wants to be a judge!',
    name: 'Amara K.', role: 'Parent', location: 'Halifax, NS',
  },
  {
    quote: 'Finally a platform where my students see themselves as future leaders. The geography games are curriculum-aligned and genuinely fun.',
    name: 'Ms. Chen', role: 'Grade 4 Teacher', location: 'Ottawa, ON',
  },
];

// ── Responsive helpers via CSS-in-JS media queries ────────────────────────────
// We inject a single <style> block for pseudo-classes and media queries.
const GLOBAL_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  a { text-decoration: none; color: inherit; }

  .cat-card:hover { transform: scale(1.07) !important; box-shadow: 0 8px 28px rgba(0,0,0,0.15) !important; }
  .prof-card:hover { border: 2px solid #FF1493 !important; }
  .cta-primary:hover { background: #cc0070 !important; transform: translateY(-2px); }
  .cta-secondary:hover { background: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
  .game-card:hover { transform: translateY(-4px); box-shadow: 0 10px 32px rgba(214,51,132,0.18) !important; }
  .footer-link:hover { color: #FF1493 !important; }
  .nav-link:hover { color: #FF1493 !important; }

  @media (max-width: 768px) {
    .hero-inner { flex-direction: column !important; }
    .hero-left  { width: 100% !important; text-align: center !important; }
    .hero-right { width: 100% !important; justify-content: center !important; margin-top: 2rem; }
    .hero-h1    { font-size: 2.4rem !important; }
    .hero-ctas  { justify-content: center !important; }
    .trust-bar  { justify-content: center !important; flex-wrap: wrap !important; gap: 0.75rem !important; }
    .cat-strip  { justify-content: flex-start !important; overflow-x: auto !important; padding-bottom: 1rem; }
    .prof-grid  { grid-template-columns: repeat(2, 1fr) !important; }
    .game-grid  { grid-template-columns: 1fr !important; }
    .test-grid  { flex-direction: column !important; }
    .footer-cols{ flex-direction: column !important; gap: 2rem !important; }
  }
  @media (max-width: 480px) {
    .prof-grid  { grid-template-columns: 1fr !important; }
    .hero-h1    { font-size: 2rem !important; }
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────
function Home() {
  const sheCanBeRef = useRef(null);
  const [apiDown, setApiDown] = useState(false);

  // Probe health endpoint once on mount — used to show offline badge
  useEffect(() => {
    api.get('/health')
      .then(res => setApiDown(res.data?.status !== 'ok'))
      .catch(() => setApiDown(true));
  }, []);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.heroGrad, minHeight: '90vh', padding: '0 1.5rem', display: 'flex', alignItems: 'center' }}>
        <div className="hero-inner" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '3rem', padding: '5rem 0' }}>

          {/* Left */}
          <div className="hero-left" style={{ flex: '0 0 60%', width: '60%' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.15)',
              color: C.white, borderRadius: 50, padding: '0.4rem 1.1rem',
              fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              🍁 Trusted by girls in 15+ countries
            </div>

            {/* H1 */}
            <h1 className="hero-h1" style={{
              color: C.white, fontSize: '4rem', fontWeight: 900,
              lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '1.1rem',
            }}>
              Where girls learn to lead.
            </h1>

            {/* Subtitle */}
            <p style={{
              color: C.white, opacity: 0.9, fontSize: '1.3rem',
              marginBottom: '2rem', lineHeight: 1.5,
            }}>
              Chess · Coding · Geography · Confidence · Leadership
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{ display: 'flex', gap: '1rem', marginBottom: '2.25rem', flexWrap: 'wrap' }}>
              <Link to="/register">
                <button className="cta-primary" style={{
                  background: C.pink, color: C.white, border: 'none',
                  borderRadius: 50, padding: '14px 32px',
                  fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(255,20,147,0.4)',
                }}>
                  Start Free — No credit card
                </button>
              </Link>
              <Link to="/login">
                <button className="cta-secondary" style={{
                  background: 'transparent', color: C.white,
                  border: '2px solid white', borderRadius: 50,
                  padding: '14px 32px', fontSize: '1rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  Sign In
                </button>
              </Link>
            </div>

            {/* Trust bar */}
            <div className="trust-bar" style={{ display: 'flex', gap: '1.5rem' }}>
              {['🔒 COPPA & PIPEDA compliant', '🎓 Ontario + NB curriculum aligned', '⭐ Free forever, no credit card'].map(t => (
                <span key={t} style={{ color: C.white, opacity: 0.85, fontSize: '0.82rem', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Right — emoji grid */}
          <div className="hero-right" style={{ flex: '0 0 40%', width: '40%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
              background: 'rgba(255,255,255,0.08)', borderRadius: 28,
              padding: '2rem', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {['♛','💻','🌍','👑','🎨','💪','🏆','📚','🌟'].map((e, i) => (
                <div key={i} style={{
                  fontSize: '3.5rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  width: 80, height: 80, borderRadius: 18,
                  background: 'rgba(255,255,255,0.08)',
                  transition: 'transform 0.2s',
                }}>
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — CATEGORY STRIP
          ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.white, padding: '60px 1.5rem' }}>
        <h2 style={{ textAlign: 'center', color: C.darkPurple, fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>
          Explore by Category
        </h2>
        <div className="cat-strip" style={{
          display: 'flex', gap: '1.25rem', justifyContent: 'center',
          flexWrap: 'nowrap', maxWidth: 1100, margin: '0 auto',
        }}>
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="cat-card"
              onClick={() => scrollTo(sheCanBeRef)}
              style={{
                width: 160, minWidth: 140, height: 160,
                background: cat.bg, borderRadius: 20,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.6rem', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}
            >
              <span style={{ fontSize: '3rem' }}>{cat.emoji}</span>
              <span style={{ color: C.darkPurple, fontWeight: 700, fontSize: '0.92rem' }}>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — SHE CAN BE A LEADER
          ══════════════════════════════════════════════════════════════ */}
      <section ref={sheCanBeRef} style={{ background: C.lightPurple, padding: '70px 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: C.darkPurple, fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.6rem' }}>
            She Can Be…
          </h2>
          <p style={{ textAlign: 'center', color: C.grey, fontSize: '1.05rem', marginBottom: '3rem' }}>
            Every girl deserves to see herself in these roles.
          </p>

          <div className="prof-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
          }}>
            {PROFESSIONS.map(prof => (
              <div
                key={prof.title}
                className="prof-card"
                style={{
                  background: C.white, borderRadius: 16, padding: '1.6rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '2px solid transparent',
                  transition: 'border 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>{prof.emoji}</div>
                <div style={{ color: C.darkPurple, fontWeight: 800, fontSize: '1.05rem' }}>{prof.title}</div>

                {/* Category pill */}
                <span style={{
                  display: 'inline-block', background: C.lightPurple,
                  color: C.purple, borderRadius: 50, padding: '0.2rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: 700, width: 'fit-content',
                }}>
                  {prof.category}
                </span>

                <div style={{ color: C.purple, fontSize: '0.82rem', fontStyle: 'italic' }}>{prof.roleModel}</div>

                {/* Quiz questions */}
                <ul style={{ paddingLeft: '1rem', margin: '0.25rem 0' }}>
                  {prof.quiz.map(q => (
                    <li key={q} style={{ color: C.grey, fontSize: '0.8rem', marginBottom: '0.2rem' }}>{q}</li>
                  ))}
                </ul>

                <Link to="/register" style={{ marginTop: 'auto' }}>
                  <button style={{
                    background: C.pink, color: C.white, border: 'none',
                    borderRadius: 8, padding: '0.5rem 1rem',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    width: '100%', transition: 'background 0.2s',
                  }}>
                    Explore This Career 👑
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — BRINDA FAVORITES
          ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.white, padding: '60px 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ color: C.darkPurple, fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Brinda's Favourites 🎮
            </h2>
            {apiDown && (
              <span style={{
                display:      'inline-block',
                background:   '#1e3a5f',
                color:        'white',
                borderRadius: 50,
                padding:      '0.25rem 0.9rem',
                fontSize:     '0.78rem',
                fontWeight:   600,
                letterSpacing:'0.02em',
              }}>
                🎮 Playing offline mode — all free games still available
              </span>
            )}
          </div>

          <div className="game-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
            marginBottom: '1.75rem',
          }}>
            {GAMES.map(game => (
              <Link to="/register" key={game.id}>
                <div className="game-card" style={{
                  background: C.lightPurple, borderRadius: 20,
                  padding: '2rem 1.5rem', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.25s',
                  boxShadow: '0 3px 16px rgba(214,51,132,0.09)',
                  border: '1.5px solid #EDD9FF',
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{game.emoji}</div>
                  <div style={{ color: C.darkPurple, fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                    {game.title}
                  </div>
                  <div style={{ color: C.grey, fontSize: '0.88rem' }}>{game.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link to="/register" style={{ color: C.pink, fontWeight: 700, fontSize: '0.92rem' }}>
              See All Games →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — TESTIMONIALS
          ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.heroGrad, padding: '70px 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: C.white, fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>
            What Families Are Saying 💬
          </h2>
          <div className="test-grid" style={{ display: 'flex', gap: '1.5rem' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: C.white, borderRadius: 16, padding: '1.75rem',
                flex: 1, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              }}>
                <p style={{
                  color: C.darkPurple, fontSize: '0.97rem', lineHeight: 1.7,
                  fontStyle: 'italic', marginBottom: '1.1rem',
                }}>
                  "{t.quote}"
                </p>
                <div style={{ color: C.purple, fontWeight: 700, fontSize: '0.88rem' }}>
                  — {t.name}, {t.role} · {t.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — EMAIL SIGNUP BANNER
          ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.pink, padding: '60px 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: C.white, fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.6rem' }}>
          Join 500+ girls learning to lead 🌟
        </h2>
        <p style={{ color: C.white, opacity: 0.9, marginBottom: '1.75rem', fontSize: '1rem' }}>
          Get free learning resources, game updates and confidence-building tips.
        </p>

        {/* Mailchimp inline form */}
        <form
          action="https://brindaworld.us11.list-manage.com/subscribe/post?u=ff7d6cf0ce5d289b96376c072&id=079f449129&f_id=00bc97e0f0"
          method="post"
          target="_blank"
          noValidate
          style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <input
            type="email"
            name="EMAIL"
            placeholder="Your email address"
            required
            style={{
              padding: '0.85rem 1.4rem', borderRadius: 50,
              border: 'none', fontSize: '1rem',
              minWidth: 280, outline: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
          />
          {/* Mailchimp anti-bot field */}
          <div style={{ position: 'absolute', left: -5000 }} aria-hidden="true">
            <input type="text" name="b_ff7d6cf0ce5d289b96376c072_079f449129" tabIndex="-1" defaultValue="" readOnly />
          </div>
          <button
            type="submit"
            style={{
              background: C.darkPurple, color: C.white,
              border: 'none', borderRadius: 50,
              padding: '0.85rem 2rem', fontSize: '1rem',
              fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            Join Free 🚀
          </button>
        </form>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7 — FOOTER
          ══════════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.dark, padding: '50px 1.5rem 24px', color: 'rgba(255,255,255,0.75)' }}>
        <div className="footer-cols" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: '3rem', marginBottom: '2.5rem' }}>

          {/* About */}
          <div style={{ flex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.6rem' }}>👑</span>
              <span style={{ color: C.white, fontSize: '1.2rem', fontWeight: 800 }}>BrindaWorld</span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 340 }}>
              BrindaWorld is a New Brunswick, Canada company dedicated to empowering
              girls aged 6–14 through chess, coding, geography, and leadership.
            </p>
          </div>

          {/* Quick Links */}
          <div style={{ flex: 1 }}>
            <h4 style={{ color: C.white, fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Links
            </h4>
            {[
              ['Home', '/'], ['Register', '/register'], ['Sign In', '/login'],
              ['Teachers', '/register'], ['About', '/register'], ['Contact', '/register'],
            ].map(([label, href]) => (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <Link to={href} className="footer-link" style={{ fontSize: '0.88rem', transition: 'color 0.15s' }}>
                  {label}
                </Link>
              </div>
            ))}
          </div>

          {/* Legal */}
          <div style={{ flex: 1 }}>
            <h4 style={{ color: C.white, fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Legal
            </h4>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'COPPA Notice'].map(item => (
              <div key={item} style={{ marginBottom: '0.5rem' }}>
                <Link to="/register" className="footer-link" style={{ fontSize: '0.88rem', transition: 'color 0.15s' }}>
                  {item}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '1.25rem', textAlign: 'center',
          fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)',
        }}>
          © 2025 Simonova Inc. All rights reserved. 🍁 New Brunswick, Canada
        </div>
      </footer>
    </>
  );
}

export default Home;
