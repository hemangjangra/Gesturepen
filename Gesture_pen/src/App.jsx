import { useEffect, useRef, useState } from 'react';
import './index.css';
import LiveDemo from './components/LiveDemo';

/* =====================================================================
   HERO CANVAS SVG — Animated Drawing Illustration
   ===================================================================== */
function HeroCanvas() {
  return (
    <div className="hero__canvas-wrap">
      <div className="hero__canvas-bg" />
      {/* Floating glow orbs */}
      <div className="hero__glow-orb hero__glow-orb--1" />
      <div className="hero__glow-orb hero__glow-orb--2" />
      <div className="hero__glow-orb hero__glow-orb--3" />

      {/* Floating shape chips */}
      <div className="shape-chip shape-chip--1">
        <span>▭</span> Rectangle
      </div>
      <div className="shape-chip shape-chip--2">
        <span>◯</span> Circle
      </div>
      <div className="shape-chip shape-chip--3">
        <span>△</span> Triangle
      </div>

      {/* Main SVG Canvas */}
      <svg
        className="hero__canvas-svg"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="strokeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="strokeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="strokeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#7c5cfc" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid dots */}
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 8 }).map((_, c) => (
            <circle
              key={`${r}-${c}`}
              cx={30 + c * 50}
              cy={30 + r * 50}
              r="1.5"
              fill="rgba(124,92,252,0.25)"
            />
          ))
        )}

        {/* Main drawing path - free form gesture */}
        <path
          className="draw-path-1"
          d="M 60 300 C 80 260, 100 200, 140 170 C 170 148, 200 160, 220 140 C 250 115, 260 80, 290 70 C 320 58, 350 90, 360 120"
          stroke="url(#strokeGrad1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
        />

        {/* Rectangle shape */}
        <rect
          className="draw-path-2"
          x="60" y="60"
          width="110" height="80"
          rx="8"
          stroke="url(#strokeGrad2)"
          strokeWidth="2.5"
          fill="rgba(34,211,238,0.04)"
          strokeDasharray="400"
          strokeDashoffset="400"
          style={{ animation: 'wand-draw 2s cubic-bezier(0.4,0,0.2,1) 2s forwards' }}
        />

        {/* Circle shape */}
        <circle
          cx="310"
          cy="270"
          r="55"
          stroke="url(#strokeGrad3)"
          strokeWidth="2.5"
          fill="rgba(244,114,182,0.04)"
          strokeDasharray="350"
          strokeDashoffset="350"
          style={{ animation: 'wand-draw 1.5s cubic-bezier(0.4,0,0.2,1) 3.2s forwards' }}
        />

        {/* Star / polygon shape */}
        <path
          d="M 200 210 L 215 250 L 255 250 L 223 273 L 234 315 L 200 290 L 166 315 L 177 273 L 145 250 L 185 250 Z"
          stroke="url(#strokeGrad1)"
          strokeWidth="2"
          fill="rgba(124,92,252,0.06)"
          strokeDasharray="300"
          strokeDashoffset="300"
          style={{ animation: 'wand-draw 1.5s cubic-bezier(0.4,0,0.2,1) 4s forwards' }}
        />

        {/* Finger cursor point */}
        <circle
          cx="290"
          cy="70"
          r="6"
          fill="#7c5cfc"
          filter="url(#glow)"
        />
        <circle
          cx="290"
          cy="70"
          r="14"
          fill="rgba(124,92,252,0.2)"
          style={{ animation: 'ping 1.5s ease-out infinite 4.5s' }}
        />

        {/* Trailing dots on the gesture path */}
        {[
          [100, 250], [130, 185], [160, 162], [190, 155]
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={3 - i * 0.4}
            fill="#22d3ee"
            opacity={0.8 - i * 0.15}
            style={{
              animation: `trail 1.5s ease-out ${2.5 + i * 0.2}s infinite`
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/* =====================================================================
   SHAPES CANVAS
   ===================================================================== */
function ShapesCanvas() {
  const shapes = [
    {
      label: 'Circle',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c5cfc" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="30" stroke="url(#g1)" strokeWidth="2.5" fill="rgba(124,92,252,0.08)" />
          <circle cx="40" cy="40" r="4" fill="#7c5cfc" />
        </svg>
      ),
    },
    {
      label: 'Rectangle',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <rect x="10" y="22" width="60" height="36" rx="5" stroke="url(#g2)" strokeWidth="2.5" fill="rgba(34,211,238,0.08)" />
        </svg>
      ),
    },
    {
      label: 'Triangle',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#7c5cfc" />
            </linearGradient>
          </defs>
          <polygon points="40,10 70,68 10,68" stroke="url(#g3)" strokeWidth="2.5" fill="rgba(244,114,182,0.08)" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Square',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <rect x="15" y="15" width="50" height="50" rx="4" stroke="url(#g4)" strokeWidth="2.5" fill="rgba(52,211,153,0.08)" />
        </svg>
      ),
    },
    {
      label: 'Star',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <polygon
            points="40,10 47,32 70,32 52,47 59,70 40,56 21,70 28,47 10,32 33,32"
            stroke="url(#g5)" strokeWidth="2.5" fill="rgba(251,191,36,0.08)"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: 'Ellipse',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#7c5cfc" />
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="40" rx="35" ry="22" stroke="url(#g6)" strokeWidth="2.5" fill="rgba(96,165,250,0.08)" />
        </svg>
      ),
    },
    {
      label: 'Pentagon',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <polygon
            points="40,10 68,32 57,65 23,65 12,32"
            stroke="url(#g7)" strokeWidth="2.5" fill="rgba(244,114,182,0.08)"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: 'Arrow',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <path
            d="M 12 40 L 52 40 M 40 24 L 58 40 L 40 56"
            stroke="url(#g8)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </svg>
      ),
    },
    {
      label: 'Spiral',
      svg: (
        <svg viewBox="0 0 80 80" width="70" height="70">
          <defs>
            <linearGradient id="g9" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c5cfc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <path
            d="M 40 40 C 40 30 50 28 55 35 C 60 44 52 58 40 60 C 26 62 14 50 14 36 C 14 20 28 8 46 10"
            stroke="url(#g9)" strokeWidth="2.5" strokeLinecap="round" fill="none"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="shapes-canvas">
      {shapes.map((s, i) => (
        <div className="shape-item" key={i}>
          <div className="shape-item__svg">{s.svg}</div>
          <span className="shape-item__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   PHONE SVG for Demo section
   ===================================================================== */
function PhoneScreen() {
  return (
    <svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ph1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="ph2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      {/* Background dots */}
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 5 }).map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={20 + c * 40}
            cy={20 + r * 75}
            r="1"
            fill="rgba(124,92,252,0.2)"
          />
        ))
      )}
      {/* Gesture trail */}
      <path
        d="M 30 320 C 50 280, 70 220, 100 180 C 120 155, 155 160, 170 130"
        stroke="url(#ph1)" strokeWidth="3" strokeLinecap="round" fill="none"
        strokeDasharray="400"
        strokeDashoffset="400"
        style={{ animation: 'wand-draw 2.5s ease 0.5s forwards' }}
      />
      {/* Rectangle */}
      <rect x="20" y="40" width="80" height="55" rx="6"
        stroke="url(#ph2)" strokeWidth="2" fill="rgba(34,211,238,0.05)"
        strokeDasharray="300" strokeDashoffset="300"
        style={{ animation: 'wand-draw 1.5s ease 2s forwards' }}
      />
      {/* Circle */}
      <circle cx="155" cy="90" r="35"
        stroke="url(#ph1)" strokeWidth="2" fill="rgba(124,92,252,0.05)"
        strokeDasharray="220" strokeDashoffset="220"
        style={{ animation: 'wand-draw 1.5s ease 3s forwards' }}
      />
      {/* Finger dot */}
      <circle cx="170" cy="130" r="5" fill="#7c5cfc" />
      <circle cx="170" cy="130" r="10" fill="rgba(124,92,252,0.2)"
        style={{ animation: 'ping 1.5s ease-out infinite 3.5s' }}
      />
    </svg>
  );
}

/* =====================================================================
   CUSTOM HOOK — useScrollReveal
   ===================================================================== */
function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* =====================================================================
   CUSTOM HOOK — useNavbarScroll
   ===================================================================== */
function useNavbarScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrolled;
}

/* =====================================================================
   NAVBAR COMPONENT
   ===================================================================== */
function Navbar({ menuOpen, setMenuOpen }) {
  const scrolled = useNavbarScroll();
  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <div className="navbar__inner">
            <div className="navbar__logo">
              <img src="/logo.png" alt="GesturePen Logo" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
              <span className="gradient-text" style={{ marginLeft: '10px' }}>GesturePen</span>
            </div>
            <ul className="navbar__nav">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it Works</a></li>
              <li><a href="#shapes">Shapes</a></li>
              <li><a href="#live-demo">Live Demo</a></li>
              <li><a href="#testimonials">Reviews</a></li>
            </ul>
            <a href="#cta" className="navbar__cta">Get Started Free</a>
            <button
              className="navbar__hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              id="hamburger-btn"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <button
          className="mobile-menu__close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          id="close-menu-btn"
        >✕</button>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it Works</a>
        <a href="#shapes" onClick={() => setMenuOpen(false)}>Shapes</a>
        <a href="#live-demo" onClick={() => setMenuOpen(false)}>Live Demo</a>
        <a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a>
        <a href="#cta" className="btn-primary" onClick={() => setMenuOpen(false)}>Get Started Free</a>
      </div>
    </>
  );
}

/* =====================================================================
   FEATURES DATA
   ===================================================================== */
const features = [
  {
    icon: '✋',
    iconClass: 'icon-purple',
    title: 'Finger Gesture Drawing',
    desc: 'Simply raise your finger and Gesture Pen instantly tracks your movement, turning it into smooth digital strokes in real-time.',
    cornerColor: '#7c5cfc',
  },
  {
    icon: '📐',
    iconClass: 'icon-cyan',
    title: 'Smart Shape Detection',
    desc: 'Draw approximate shapes and our AI instantly snaps them into perfect squares, circles, triangles, and more.',
    cornerColor: '#22d3ee',
  },
  {
    icon: '🎨',
    iconClass: 'icon-pink',
    title: 'Color & Style Palette',
    desc: 'Choose from an infinite color palette. Adjust brush size, opacity, and style to match your creative vision.',
    cornerColor: '#f472b6',
  },
  {
    icon: '⚡',
    iconClass: 'icon-green',
    title: 'Zero Latency',
    desc: 'Our optimized rendering engine delivers sub-10ms response times, making your drawings feel completely natural and fluid.',
    cornerColor: '#34d399',
  },
  {
    icon: '📁',
    iconClass: 'icon-orange',
    title: 'Export Anywhere',
    desc: 'Export your creations as PNG, SVG, or PDF with a single gesture. Share directly to social media or cloud storage.',
    cornerColor: '#fb923c',
  },
  {
    icon: '🤖',
    iconClass: 'icon-blue',
    title: 'AI Pattern Generator',
    desc: 'Speak your idea and our AI generates complex patterns and templates that you can edit and customize freely.',
    cornerColor: '#60a5fa',
  },
];

/* =====================================================================
   HOW IT WORKS STEPS
   ===================================================================== */
const steps = [
  { num: '01', icon: '🌐', title: 'Launch Web App', desc: 'Click Start Session to instantly connect your browser camera without any downloads.' },
  { num: '02', icon: '✋', title: 'Raise Your Finger', desc: 'The app instantly detects your hand and highlights your drawing finger with a live cursor.' },
  { num: '03', icon: '✏️', title: 'Draw Freely', desc: 'Move your finger in the air to draw. Gestures automatically snap to shapes or stay as freeform strokes.' },
  { num: '04', icon: '💾', title: 'Save & Share', desc: 'Instantly export your masterpiece in any format and share it directly from the app.' },
];

/* =====================================================================
   TESTIMONIALS DATA
   ===================================================================== */
const testimonials = [
  {
    stars: 5,
    text: "Gesture Pen blew my mind. I used it to sketch wireframes in a meeting on the fly — no stylus, no tablet needed. Pure magic!",
    avatar: '🎨',
    name: 'Priya Sharma',
    role: 'UI/UX Designer, Bangalore',
  },
  {
    stars: 5,
    text: "As an art teacher, I now use GesturePen for live demonstrations. Students love watching shapes appear out of thin air. Revolutionary!",
    avatar: '👩‍🏫',
    name: 'Ananya Verma',
    role: 'Art Educator, Mumbai',
  },
  {
    stars: 5,
    text: "The shape-snapping feature is insanely accurate. I drew a rough pentagon and it instantly perfected it. The zero-latency claim is real.",
    avatar: '🧑‍💻',
    name: 'Rohit Gupta',
    role: 'Software Developer, Delhi',
  },
];

/* =====================================================================
   DEMO FEATURES LIST
   ===================================================================== */
const demoFeatures = [
  {
    dot: '#7c5cfc',
    title: 'Real-time finger tracking',
    desc: 'Tracks your index finger at 60fps with MediaPipe and custom ML models for buttery-smooth drawing.',
  },
  {
    dot: '#22d3ee',
    title: 'Multi-gesture commands',
    desc: 'Use two-finger pinch to zoom, three-finger swipe to undo, and open palm to clear the canvas.',
  },
  {
    dot: '#f472b6',
    title: 'Works everywhere',
    desc: 'Draw on walls, desks, whiteboards — any surface. Your phone camera is your only tool.',
  },
];

/* =====================================================================
   SHAPE TAGS
   ===================================================================== */
const shapeTags = [
  '⬜ Square', '⬛ Rectangle', '⭕ Circle', '🔺 Triangle',
  '⬡ Hexagon', '⭐ Star', '➡️ Arrow', '〰️ Spiral',
  '🔷 Diamond', '🔶 Pentagon', '⬬ Ellipse', '〇 Custom',
];

/* =====================================================================
   MAIN APP COMPONENT
   ===================================================================== */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  useScrollReveal();

  return (
    <>
      {/* Animated Background */}
      <div className="bg-mesh" />

      {/* Navbar */}
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ── HERO ── */}
      <section className="hero" id="hero">
        <div className="hero__grid-bg" />
        <div className="container">
          <div className="hero__inner">
            {/* Left Content */}
            <div className="hero__content">
              <div className="hero__badge">
                <span className="hero__badge-dot" />
                Now Available — Draw in Thin Air
              </div>
              <h1 className="hero__title">
                <span className="gradient-text">Draw With</span>
                <span className="gradient-text">Your Finger.</span>
                <span className="line-2">In The Air.</span>
              </h1>
              <p className="hero__desc">
                Gesture Pen turns your fingertip into a powerful digital pen.
                Trace, draw, and create stunning art — no stylus, no surface, just you and the air.
              </p>
              <div className="hero__actions">
                <a href="#cta" className="btn-primary" id="hero-cta-btn">
                  🚀 Start Drawing Free
                </a>
                <a href="#live-demo" className="btn-secondary" id="hero-learn-btn">
                  ▶ Live Demo
                </a>
              </div>
              <div className="hero__stats">
                <div className="hero__stat-item">
                  <span className="hero__stat-num">50K+</span>
                  <span className="hero__stat-label">Artists</span>
                </div>
                <div className="hero__stat-item">
                  <span className="hero__stat-num">99%</span>
                  <span className="hero__stat-label">Accuracy</span>
                </div>
                <div className="hero__stat-item">
                  <span className="hero__stat-num">&lt;10ms</span>
                  <span className="hero__stat-label">Latency</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="hero__visual">
              <HeroCanvas />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section__header reveal">
            <p className="section__tag">Features</p>
            <h2 className="section__title">
              Everything you need to <br />
              <span className="gradient-text">create without limits</span>
            </h2>
            <p className="section__desc">
              Gesture Pen combines cutting-edge computer vision with an intuitive interface
              so your creativity flows without friction.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div
                className={`feature-card reveal reveal-delay-${(i % 3) + 1}`}
                key={i}
                id={`feature-card-${i + 1}`}
              >
                <div className={`feature-card__icon ${f.iconClass}`}>{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
                <div
                  className="feature-card__corner"
                  style={{ background: f.cornerColor }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <div className="section__header--center reveal">
            <p className="section__tag">How It Works</p>
            <h2 className="section__title">
              Four steps to your <br />
              <span className="gradient-text">first gesture drawing</span>
            </h2>
            <p className="section__desc">
              Getting started is effortless. No setup, no hardware — just your smartphone and imagination.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div
                className={`step-card reveal reveal-delay-${i + 1}`}
                key={i}
                id={`step-card-${i + 1}`}
              >
                <div className="step-card__num">
                  <span>{s.num}</span>
                  <div className="step-card__icon">{s.icon}</div>
                </div>
                <h3 className="step-card__title">{s.title}</h3>
                <p className="step-card__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHAPES SHOWCASE ── */}
      <section className="section shapes-section" id="shapes">
        <div className="container">
          <div className="shapes-inner">
            <div className="shapes-visual reveal">
              <ShapesCanvas />
            </div>
            <div className="shapes-content reveal reveal-delay-2">
              <p className="section__tag">Shape Library</p>
              <h2 className="section__title">
                Draw any shape <br />
                <span className="gradient-text">in seconds</span>
              </h2>
              <p className="section__desc">
                Gesture Pen recognizes over 30 distinct shapes and patterns. Just make a rough gesture
                and our AI perfects it instantly — from simple squares to complex spirals.
              </p>
              <div className="shape-tag-list">
                {shapeTags.map((tag, i) => (
                  <span className="shape-tag" key={i}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO — Backend-Connected Section ── */}
      <LiveDemo />

      {/* ── TESTIMONIALS ── */}
      <section className="section testimonials" id="testimonials">
        <div className="container">
          <div className="section__header--center reveal">
            <p className="section__tag">Testimonials</p>
            <h2 className="section__title">
              Loved by <span className="gradient-text">creators worldwide</span>
            </h2>
            <p className="section__desc">
              Thousands of artists, educators, and designers are already drawing the future with Gesture Pen.
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div
                className={`testimonial-card reveal reveal-delay-${i + 1}`}
                key={i}
                id={`testimonial-${i + 1}`}
              >
                <div className="testimonial-card__stars">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j}>★</span>
                  ))}
                </div>
                <p className="testimonial-card__text">"{t.text}"</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.avatar}</div>
                  <div>
                    <p className="testimonial-card__name">{t.name}</p>
                    <p className="testimonial-card__role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="cta-section" id="cta">
        <div className="cta-bg" />
        <div className="hero__glow-orb hero__glow-orb--1" />
        <div className="hero__glow-orb hero__glow-orb--2" />
        <div className="container">
          <div className="cta-inner reveal">
            <h2 className="cta-title">
              Ready to draw <br />
              <span className="gradient-text">without limits?</span>
            </h2>
            <p className="cta-desc">
              Join 50,000+ artists, designers, and creators who already draw the future with just their finger.
              Free forever. No credit card required.
            </p>
            <div className="cta-actions">
              <a href="#live-demo" className="btn-primary" id="cta-launch-btn">
                🚀 Launch Web App
              </a>
              <a href="#features" className="btn-secondary" id="cta-docs-btn">
                📚 View Documentation
              </a>
            </div>
            <p className="cta-note">✓ Free forever &nbsp;&nbsp; ✓ No install required &nbsp;&nbsp; ✓ Runs in browser</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div>
              <div className="navbar__logo">
                <div className="navbar__logo-icon">✍️</div>
                <span className="gradient-text">GesturePen</span>
              </div>
              <p className="footer__brand-desc">
                The world's first air-drawing app powered by gesture recognition and AI.
                Draw anything, anywhere, anytime.
              </p>
            </div>
            <div>
              <p className="footer__col-title">Product</p>
              <ul className="footer__col-list">
                <li><a href="#features">Features</a></li>
                <li><a href="#shapes">Shapes</a></li>
                <li><a href="#live-demo">Demo</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Changelog</a></li>
              </ul>
            </div>
            <div>
              <p className="footer__col-title">Company</p>
              <ul className="footer__col-list">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press Kit</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="footer__col-title">Support</p>
              <ul className="footer__col-list">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Use</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <p className="footer__copy">
              © 2026 GesturePen. All rights reserved. Made with ✍️ in India.
            </p>
            <div className="footer__socials">
              {['𝕏', '▶', '📸', '💼', '🐙'].map((icon, i) => (
                <button key={i} className="social-btn" aria-label={`Social link ${i + 1}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
