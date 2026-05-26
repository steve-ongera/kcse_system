import { useState, useEffect } from 'react';
import { registerCandidate, updateCandidate, fetchActiveYears } from '../../utils/api';
import api from '../../utils/api';

const EMPTY_FORM = {
  index_number: '', kcpe_index_number: '', birth_certificate_number: '',
  first_name: '', middle_name: '', last_name: '', full_name: '',
  gender: '', date_of_birth: '', nationality: 'Kenyan',
  school: '', examination_year: '',
  has_special_needs: false, special_needs_details: '',
  subject_codes: [],
};

export default function CandidateForm({ existing = null, onSuccess }) {
  const [form, setForm] = useState(existing ? mapToForm(existing) : EMPTY_FORM);
  const [years, setYears] = useState([]);
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchActiveYears().then(r => setYears(r.data)).catch(() => {});
    api.get('/reference/grading-scale/').catch(() => {});
    // Fetch schools & subjects via admin endpoints
    api.get('/admin/candidates/?page_size=1').catch(() => {});
    // Subjects list — fetch from admin if available
    api.get('/reference/subjects/').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const toggleSubject = (code) => {
    setForm(f => ({
      ...f,
      subject_codes: f.subject_codes.includes(code)
        ? f.subject_codes.filter(c => c !== code)
        : [...f.subject_codes, code],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');
    try {
      if (existing) {
        await updateCandidate(existing.index_number, form);
      } else {
        await registerCandidate(form);
      }
      setSuccess(existing ? 'Candidate updated successfully.' : 'Candidate registered successfully.');
      if (!existing) setForm(EMPTY_FORM);
      onSuccess?.();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') setErrors(data);
      else setErrors({ non_field: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-page" noValidate>
      {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>{success}</div>}
      {errors.non_field && <div className="alert alert-error" style={{ marginBottom: 20 }}>{errors.non_field}</div>}

      {/* Identification */}
      <div className="form-section">
        <div className="form-section-title">Identification</div>
        <div className="form-grid">
          <Field label="KNEC Index Number" error={errors.index_number}>
            <input className={`form-control ${errors.index_number ? 'error' : ''}`}
              placeholder="14-digit index number"
              value={form.index_number}
              onChange={e => set('index_number', e.target.value)}
              maxLength={14} inputMode="numeric"
              style={{ fontFamily: 'var(--font-mono)' }}
              disabled={!!existing}
            />
          </Field>
          <Field label="KCPE Index Number" error={errors.kcpe_index_number}>
            <input className={`form-control ${errors.kcpe_index_number ? 'error' : ''}`}
              placeholder="10–12 digits"
              value={form.kcpe_index_number}
              onChange={e => set('kcpe_index_number', e.target.value)}
              maxLength={12} inputMode="numeric"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </Field>
          <Field label="Birth Certificate No." error={errors.birth_certificate_number}>
            <input className="form-control"
              placeholder="Optional"
              value={form.birth_certificate_number}
              onChange={e => set('birth_certificate_number', e.target.value)}
            />
          </Field>
          <Field label="Nationality" error={errors.nationality}>
            <input className="form-control"
              value={form.nationality}
              onChange={e => set('nationality', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Personal info */}
      <div className="form-section">
        <div className="form-section-title">Personal Information</div>
        <div className="form-grid">
          <Field label="First Name" error={errors.first_name}>
            <input className={`form-control ${errors.first_name ? 'error' : ''}`}
              value={form.first_name}
              onChange={e => set('first_name', e.target.value)}
            />
          </Field>
          <Field label="Middle Name">
            <input className="form-control" placeholder="Optional"
              value={form.middle_name}
              onChange={e => set('middle_name', e.target.value)}
            />
          </Field>
          <Field label="Last Name" error={errors.last_name}>
            <input className={`form-control ${errors.last_name ? 'error' : ''}`}
              value={form.last_name}
              onChange={e => set('last_name', e.target.value)}
            />
          </Field>
          <Field label="Gender" error={errors.gender}>
            <select className="form-control" value={form.gender}
              onChange={e => set('gender', e.target.value)}>
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Date of Birth" error={errors.date_of_birth}>
            <input type="date" className="form-control"
              value={form.date_of_birth}
              onChange={e => set('date_of_birth', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* School & Year */}
      <div className="form-section">
        <div className="form-section-title">School & Examination</div>
        <div className="form-grid">
          <Field label="School (ID)" error={errors.school}>
            <input className="form-control" placeholder="School ID"
              value={form.school}
              onChange={e => set('school', e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="Examination Year" error={errors.examination_year}>
            <select className="form-control" value={form.examination_year}
              onChange={e => set('examination_year', e.target.value)}>
              <option value="">Select year</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div className="form-section">
          <div className="form-section-title">Registered Subjects</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {subjects.map(s => {
              const checked = form.subject_codes.includes(s.code);
              return (
                <label key={s.code} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px',
                  background: checked ? 'var(--clr-primary-muted)' : 'var(--clr-surface-2)',
                  border: `1.5px solid ${checked ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer', fontSize: '0.85rem',
                  color: checked ? 'var(--clr-primary)' : 'var(--clr-text-mid)',
                  fontWeight: checked ? 600 : 400,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}>
                  <input type="checkbox" style={{ display: 'none' }}
                    checked={checked}
                    onChange={() => toggleSubject(s.code)}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{s.code}</span>
                  {s.name}
                </label>
              );
            })}
          </div>
          {form.subject_codes.length > 0 && (
            <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              {form.subject_codes.length} subject{form.subject_codes.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      {/* Special needs */}
      <div className="form-section">
        <div className="form-section-title">Special Needs</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox"
            checked={form.has_special_needs}
            onChange={e => set('has_special_needs', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--clr-primary)' }}
          />
          <span style={{ fontSize: '0.9rem', color: 'var(--clr-text-mid)' }}>
            Candidate requires special examination arrangements
          </span>
        </label>
        {form.has_special_needs && (
          <textarea
            className="form-control"
            placeholder="Describe the special needs / required accommodations..."
            rows={3}
            value={form.special_needs_details}
            onChange={e => set('special_needs_details', e.target.value)}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : existing ? 'Update Candidate' : 'Register Candidate'}
        </button>
        {!existing && (
          <button type="button" className="btn btn-secondary"
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSuccess(''); }}>
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children, error }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {error && <span className="form-error">{Array.isArray(error) ? error[0] : error}</span>}
    </div>
  );
}

function mapToForm(c) {
  return {
    index_number: c.index_number || '',
    kcpe_index_number: c.kcpe_index_number || '',
    birth_certificate_number: c.birth_certificate_number || '',
    first_name: c.first_name || '',
    middle_name: c.middle_name || '',
    last_name: c.last_name || '',
    full_name: c.full_name || '',
    gender: c.gender || '',
    date_of_birth: c.date_of_birth || '',
    nationality: c.nationality || 'Kenyan',
    school: c.school || '',
    examination_year: c.examination_year || '',
    has_special_needs: c.has_special_needs || false,
    special_needs_details: c.special_needs_details || '',
    subject_codes: [],
  };
}