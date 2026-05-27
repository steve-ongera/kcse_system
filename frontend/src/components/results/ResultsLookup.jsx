// components/results/ResultsLookup.jsx
import { useState, useEffect } from 'react';
import { useResults } from '../../hooks/useResults';
import ResultSlip from './ResultSlip';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ResultsLookup() {
  const { result, loading, error, lookup, reset, years, loadYears } = useResults();
  const [form, setForm] = useState({ index_number: '', full_name: '', examination_year: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { loadYears(); }, [loadYears]);

  // Normalise whatever useResults gives us into a plain array
  const safeYears = Array.isArray(years)
    ? years
    : Array.isArray(years?.results)
      ? years.results
      : [];

  const validate = () => {
    const errs = {};
    const idx = form.index_number.replace(/\s/g, '');
    if (!idx) errs.index_number = 'Index number is required.';
    else if (!/^\d{14}$/.test(idx)) errs.index_number = 'Must be exactly 14 digits.';
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
    else if (form.full_name.trim().split(/\s+/).length < 2) errs.full_name = 'Enter at least two names.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    const payload = {
      index_number: form.index_number.replace(/\s/g, ''),
      full_name: form.full_name.trim().toUpperCase(),
    };
    if (form.examination_year) payload.examination_year = parseInt(form.examination_year);
    lookup(payload);
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors(f => ({ ...f, [e.target.name]: '' }));
  };

  if (result) {
    return (
      <div>
        <button className="btn btn-ghost no-print" onClick={reset}
          style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Search again
        </button>
        <ResultSlip result={result} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Index number */}
          <div className="form-group">
            <label className="form-label" htmlFor="index_number">
              KNEC Index Number
            </label>
            <input
              id="index_number"
              name="index_number"
              className={`form-control ${fieldErrors.index_number ? 'error' : ''}`}
              placeholder="e.g. 12345678901001"
              value={form.index_number}
              onChange={handleChange}
              maxLength={14}
              inputMode="numeric"
              autoComplete="off"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontSize: '1.05rem' }}
            />
            {fieldErrors.index_number && (
              <span className="form-error">{fieldErrors.index_number}</span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              14-digit number on your KNEC admission letter
            </span>
          </div>

          {/* Full name */}
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              className={`form-control ${fieldErrors.full_name ? 'error' : ''}`}
              placeholder="As registered with KNEC"
              value={form.full_name}
              onChange={handleChange}
              autoComplete="name"
            />
            {fieldErrors.full_name && (
              <span className="form-error">{fieldErrors.full_name}</span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              Enter your name exactly as on your birth certificate / school registration
            </span>
          </div>

          {/* Examination year */}
          <div className="form-group">
            <label className="form-label" htmlFor="examination_year">
              Examination Year{' '}
              <span style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              id="examination_year"
              name="examination_year"
              className="form-control"
              value={form.examination_year}
              onChange={handleChange}
            >
              <option value="">Latest available year</option>
              {safeYears.map(y => (
                <option key={y.id} value={y.year}>{y.year}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ alignSelf: 'stretch', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Check Results
              </>
            )}
          </button>
        </div>
      </form>

      {/* Privacy note */}
      <div style={{
        marginTop: 28, padding: '14px 16px',
        background: 'var(--clr-surface-2)',
        border: '1px solid var(--clr-border-subtle)',
        borderRadius: 'var(--r-md)',
        fontSize: '0.78rem', color: 'var(--clr-text-muted)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Your query is logged for security. Results are only shown when both the index number and name match KNEC records.
      </div>
    </div>
  );
}