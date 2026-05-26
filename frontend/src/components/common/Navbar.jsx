import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header style={{
      background: 'var(--clr-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--clr-accent)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--clr-primary)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '1.05rem', color: '#fff', lineHeight: 1.2
            }}>KNEC Results</div>
            <div style={{
              fontSize: '0.62rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)'
            }}>Kenya National Examinations Council</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {[
            { to: '/', label: 'Home' },
            { to: '/results', label: 'Check Results' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: '0.88rem',
              fontWeight: 500,
              color: pathname === to ? '#fff' : 'rgba(255,255,255,0.72)',
              background: pathname === to ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all 0.2s',
              textDecoration: 'none',
            }}
              onMouseEnter={e => { if (pathname !== to) e.target.style.color = '#fff'; }}
              onMouseLeave={e => { if (pathname !== to) e.target.style.color = 'rgba(255,255,255,0.72)'; }}
            >{label}</Link>
          ))}
          <Link to="/admin/login" style={{
            marginLeft: 8,
            padding: '8px 18px',
            borderRadius: 6,
            fontSize: '0.85rem',
            fontWeight: 600,
            background: 'var(--clr-accent)',
            color: 'var(--clr-primary)',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}>Admin</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-menu-btn"
          style={{
            display: 'none', background: 'none', border: 'none',
            color: '#fff', cursor: 'pointer', padding: 8
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          background: 'var(--clr-primary-mid)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 0',
        }}>
          {[
            { to: '/', label: 'Home' },
            { to: '/results', label: 'Check Results' },
            { to: '/admin/login', label: 'Admin Portal' },
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '12px 24px',
                color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >{label}</Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}