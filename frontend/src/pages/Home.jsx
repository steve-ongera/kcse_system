import { Link } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    title: 'Enter Index Number',
    desc: 'Your 14-digit KNEC index number is on your examination admission letter.',
  },
  {
    n: '02',
    title: 'Provide Your Name',
    desc: 'Enter your full name exactly as registered with KNEC to verify identity.',
  },
  {
    n: '03',
    title: 'View Your Results',
    desc: 'Your official KCSE result slip loads instantly — save or print it.',
  },
];

const FAQS = [
  {
    q: 'I forgot my index number. What do I do?',
    a: 'Contact your school principal or the sub-county education office. Your index number is also on your KNEC admission letter.',
  },
  {
    q: 'My name doesn\'t match — what should I enter?',
    a: 'Enter your name exactly as it appears on your birth certificate / school registration form. Order matters; try different arrangements if needed.',
  },
  {
    q: 'Results show "Withheld" — what does this mean?',
    a: 'Withheld results are under review by KNEC. Contact your school or KNEC directly for assistance.',
  },
  {
    q: 'Can I check results for a previous year?',
    a: 'Yes. Select the relevant year from the examination year dropdown on the results page.',
  },
];

export default function Home() {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--clr-primary) 0%, #1e7a4e 60%, #2e9668 100%)',
        padding: '80px 0 100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{
          position: 'absolute', right: -80, top: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(200,168,75,0.15)',
        }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 99, padding: '6px 16px',
            fontSize: '0.78rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-accent)', display: 'inline-block' }} />
            Official KNEC Results Portal
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700, color: '#fff',
            lineHeight: 1.15, marginBottom: 20,
            maxWidth: 700, margin: '0 auto 20px',
          }}>
            Check Your KCSE<br />Results Instantly
          </h1>

          <p style={{
            fontSize: '1.05rem', color: 'rgba(255,255,255,0.78)',
            maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7,
          }}>
            Official Kenya Certificate of Secondary Education results.
            Secure, fast, and available 24/7.
          </p>

          <Link to="/results" className="btn btn-accent btn-lg" style={{
            fontSize: '1rem', padding: '14px 36px',
            boxShadow: '0 4px 20px rgba(200,168,75,0.4)',
          }}>
            Check My Results →
          </Link>
        </div>
      </section>

      {/* Wave divider */}
      <div style={{ background: 'var(--clr-primary)', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="var(--clr-bg)" />
        </svg>
      </div>

      {/* How it works */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--clr-primary)', marginBottom: 8
            }}>Simple Process</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 700, color: 'var(--clr-text)'
            }}>How to Check Your Results</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="card animate-fade-up"
                style={{ animationDelay: `${i * 100}ms`, padding: 28 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '2.5rem',
                  fontWeight: 700, color: 'var(--clr-primary-muted)',
                  lineHeight: 1, marginBottom: 16,
                }}>{s.n}</div>
                <h3 style={{
                  fontWeight: 700, fontSize: '1rem',
                  color: 'var(--clr-text)', marginBottom: 8
                }}>{s.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ padding: '0 0 60px' }}>
        <div className="container">
          <div style={{
            background: 'var(--clr-primary)',
            borderRadius: 20,
            padding: '44px 48px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
          }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.6rem',
                fontWeight: 700, color: '#fff', marginBottom: 8
              }}>Ready to check your results?</h2>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)' }}>
                Have your index number and full name ready.
              </p>
            </div>
            <Link to="/results" className="btn btn-accent" style={{ flexShrink: 0 }}>
              Check Results Now →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={{ padding: '20px 0 80px' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem',
              fontWeight: 700, color: 'var(--clr-text)'
            }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <details style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border-subtle)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      <summary style={{
        padding: '16px 20px',
        fontWeight: 600, fontSize: '0.92rem',
        color: 'var(--clr-text)', cursor: 'pointer',
        listStyle: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        userSelect: 'none',
      }}>
        {q}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, marginLeft: 12 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div style={{
        padding: '0 20px 16px',
        fontSize: '0.88rem', color: 'var(--clr-text-muted)', lineHeight: 1.7,
      }}>{a}</div>
    </details>
  );
}