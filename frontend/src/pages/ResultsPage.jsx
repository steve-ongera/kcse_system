import ResultsLookup from '../components/results/ResultsLookup';

export default function ResultsPage() {
  return (
    <main className="main-content">
      <div className="container">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--clr-primary-muted)',
              borderRadius: 99, padding: '5px 14px',
              fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--clr-primary)', marginBottom: 14,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              KCSE Results Lookup
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700, color: 'var(--clr-text)',
              lineHeight: 1.2, marginBottom: 10,
            }}>
              Check Your KCSE Results
            </h1>
            <p style={{
              fontSize: '0.95rem', color: 'var(--clr-text-muted)',
              maxWidth: 480, margin: '0 auto', lineHeight: 1.7,
            }}>
              Enter your KNEC index number and registered name to retrieve your official examination results.
            </p>
          </div>

          {/* Lookup form card */}
          <div className="card" style={{ padding: '32px 36px' }}>
            <ResultsLookup />
          </div>
        </div>
      </div>
    </main>
  );
}