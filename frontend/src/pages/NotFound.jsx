import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="main-content">
      <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(5rem, 15vw, 9rem)',
          fontWeight: 700,
          color: 'var(--clr-primary-muted)',
          lineHeight: 1,
          marginBottom: 16,
        }}>404</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: 'var(--clr-text)',
          marginBottom: 12,
        }}>Page Not Found</h1>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--clr-text-muted)',
          maxWidth: 400,
          margin: '0 auto 32px',
          lineHeight: 1.7,
        }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/results" className="btn btn-secondary">Check Results</Link>
        </div>
      </div>
    </main>
  );
}