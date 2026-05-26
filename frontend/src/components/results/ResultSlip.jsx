import { useRef } from 'react';
import GradeDisplay from './GradeDisplay';
import ResultCard from './ResultCard';

export default function ResultSlip({ result }) {
  const slipRef = useRef(null);
  const { overall_result: overall, subject_results: subjects } = result;

  const handlePrint = () => {
    const content = slipRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(`
      <html><head>
        <title>KCSE Result Slip – ${result.full_name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@500&display=swap" rel="stylesheet"/>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'DM Sans',sans-serif;color:#1a1814;background:#fff;padding:32px}
          .print-header{text-align:center;border-bottom:2px solid #0a4a2f;padding-bottom:20px;margin-bottom:20px}
          .print-title{font-family:'Playfair Display',serif;font-size:1.6rem;color:#0a4a2f;font-weight:700}
          .print-sub{font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin-top:4px}
          .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;margin-bottom:20px;font-size:0.88rem}
          .info-label{font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#666}
          .info-value{font-weight:500;color:#1a1814;margin-top:2px}
          table{width:100%;border-collapse:collapse;font-size:0.85rem}
          th{padding:8px 12px;text-align:left;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#666;background:#f0ede6;border-bottom:1px solid #d8d3c8}
          td{padding:10px 12px;border-bottom:1px solid #ece8e1;color:#4a4640}
          .grade-cell{font-family:'Playfair Display',serif;font-weight:700;font-size:1rem;color:#0a4a2f}
          .overall-box{margin-top:24px;padding:20px;border:2px solid #0a4a2f;border-radius:8px;display:flex;align-items:center;justify-content:space-between}
          .overall-label{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:#666}
          .overall-grade{font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#0a4a2f}
          .overall-pts{font-size:1.1rem;color:#4a4640;margin-top:4px}
          .footer{margin-top:24px;font-size:0.75rem;color:#aaa;text-align:center;border-top:1px solid #ece8e1;padding-top:16px}
          @media print{body{padding:16px}}
        </style>
      </head><body>
        <div class="print-header">
          <div class="print-title">Kenya National Examinations Council</div>
          <div class="print-sub">KCSE ${result.examination_year_value} — Official Result Slip</div>
        </div>
        ${content}
        <div class="footer">
          This is an official computer-generated result slip. Verify at knec.ac.ke
        </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease both' }}>
      {/* Actions bar */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'flex-end',
        gap: 12, marginBottom: 20,
      }}>
        <button className="btn btn-secondary" onClick={handlePrint}>
          <PrintIcon /> Print Result Slip
        </button>
      </div>

      {/* Printable content */}
      <div ref={slipRef}>
        {/* Header */}
        <div style={{
          background: 'var(--clr-primary)',
          borderRadius: '16px 16px 0 0',
          padding: '28px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.72rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)', marginBottom: 4
            }}>KCSE {result.examination_year_value} — Official Result</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.5rem',
              fontWeight: 700, color: '#fff', lineHeight: 1.2,
            }}>{result.full_name}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)', marginTop: 6
            }}>{result.index_number}</div>
          </div>
          {overall && (
            <div style={{ textAlign: 'right' }}>
              <GradeDisplay grade={overall.mean_grade_letter} points={overall.total_points} size="lg" />
            </div>
          )}
        </div>

        {/* Meta info */}
        <div style={{
          background: 'var(--clr-surface-2)',
          borderLeft: '1px solid var(--clr-border-subtle)',
          borderRight: '1px solid var(--clr-border-subtle)',
          padding: '16px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px 24px',
        }}>
          {[
            { label: 'Gender', value: result.gender_display },
            { label: 'School', value: result.school_name },
            { label: 'Center Code', value: result.school_center_code },
            { label: 'Sub County', value: result.sub_county },
            { label: 'County', value: result.county },
          ].map(({ label, value }) => value ? (
            <div key={label}>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--clr-text-muted)',
              }}>{label}</div>
              <div style={{
                fontSize: '0.88rem', fontWeight: 500,
                color: 'var(--clr-text)', marginTop: 2
              }}>{value}</div>
            </div>
          ) : null)}
        </div>

        {/* Subject results */}
        <div style={{
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border-subtle)',
          borderTop: 'none',
        }}>
          <div style={{
            padding: '14px 20px',
            background: 'var(--clr-surface-2)',
            borderBottom: '1px solid var(--clr-border)',
          }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--clr-text-muted)'
            }}>Subject Results</span>
          </div>

          {subjects && subjects.length > 0 ? (
            subjects.map((sr, i) => <ResultCard key={sr.subject_code} result={sr} index={i} />)
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
              No subject results available.
            </div>
          )}
        </div>

        {/* Overall summary */}
        {overall && (
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border-subtle)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            padding: '20px 32px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px 24px',
              alignItems: 'center',
            }}>
              <StatBlock label="Mean Grade" value={overall.mean_grade_letter} mono={false} large />
              <StatBlock label="Total Points" value={`${overall.total_points ?? '—'} pts`} />
              <StatBlock label="Subjects Sat" value={overall.subjects_sat} />
              {overall.school_rank && <StatBlock label="School Rank" value={`#${overall.school_rank}`} />}
              {overall.county_rank && <StatBlock label="County Rank" value={`#${overall.county_rank}`} />}
              {overall.national_rank && <StatBlock label="National Rank" value={`#${overall.national_rank}`} />}
            </div>
            {overall.remarks && (
              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: 'var(--clr-surface-2)',
                borderRadius: 8, fontSize: '0.85rem', color: 'var(--clr-text-mid)'
              }}>
                {overall.remarks}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value, mono = true, large = false }) {
  return (
    <div>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--clr-text-muted)', marginBottom: 4
      }}>{label}</div>
      <div style={{
        fontFamily: large ? 'var(--font-display)' : mono ? 'var(--font-mono)' : 'inherit',
        fontSize: large ? '1.8rem' : '1.1rem',
        fontWeight: 700,
        color: 'var(--clr-primary)',
      }}>{value ?? '—'}</div>
    </div>
  );
}

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}