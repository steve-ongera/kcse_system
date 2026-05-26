import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      background: 'var(--clr-primary)',
      color: 'rgba(255,255,255,0.65)',
      padding: '40px 0 24px',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
          marginBottom: 32,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '1.1rem', color: '#fff', marginBottom: 8
            }}>KNEC</div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
              Kenya National Examinations Council.<br />
              Providing quality examination services since 1980.
            </p>
          </div>
          <div>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)', marginBottom: 12
            }}>Quick Links</div>
            {[
              { to: '/', label: 'Home' },
              { to: '/results', label: 'Check KCSE Results' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                display: 'block', fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.65)', marginBottom: 6,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--clr-accent)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
              >{label}</Link>
            ))}
          </div>
          <div>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)', marginBottom: 12
            }}>Contact</div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
              Upper Hill Road, Nairobi<br />
              P.O. Box 73598-00200<br />
              info@knec.ac.ke
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 20,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
        }}>
          <span style={{ fontSize: '0.78rem' }}>
            © {year} Kenya National Examinations Council. All rights reserved.
          </span>
          <span style={{ fontSize: '0.78rem' }}>
            KCSE Results Portal
          </span>
        </div>
      </div>
    </footer>
  );
}