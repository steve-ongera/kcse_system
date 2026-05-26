import { useState } from 'react';
import { enterMarks, approveMarks } from '../../utils/api';

const EMPTY = {
  candidate_index: '',
  subject_code: '',
  examination_year: '',
  paper1_score: '',
  paper2_score: '',
  paper3_score: '',
  practical_score: '',
};

export default function MarksEntry() {
  const [form, setForm] = useState(EMPTY);
  const [approveId, setApproveId] = useState('');
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }
  const [approveMsg, setApproveMsg] = useState(null);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // Note: the API expects candidate (id), subject (id), examination_year (id)
      // In a real app you'd resolve these from the index / code.
      // Here we submit the raw values and let the server validate.
      const payload = {
        candidate: form.candidate_index,
        subject: form.subject_code,
        examination_year: form.examination_year,
        ...(form.paper1_score !== '' && { paper1_score: parseFloat(form.paper1_score) }),
        ...(form.paper2_score !== '' && { paper2_score: parseFloat(form.paper2_score) }),
        ...(form.paper3_score !== '' && { paper3_score: parseFloat(form.paper3_score) }),
        ...(form.practical_score !== '' && { practical_score: parseFloat(form.practical_score) }),
      };
      await enterMarks(payload);
      setMessage({ type: 'success', text: 'Marks entered successfully.' });
      setForm(EMPTY);
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? (typeof data === 'string' ? data : JSON.stringify(data))
        : 'Failed to enter marks. Please try again.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveId.trim()) return;
    setApproveLoading(true);
    setApproveMsg(null);
    try {
      const { data } = await approveMarks(approveId.trim());
      setApproveMsg({ type: 'success', text: data.message || 'Marks approved.' });
      setApproveId('');
    } catch (err) {
      setApproveMsg({
        type: 'error',
        text: err.response?.data?.message || 'Approval failed.',
      });
    } finally {
      setApproveLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
      {/* Enter marks panel */}
      <div className="form-section" style={{ height: 'fit-content' }}>
        <div className="form-section-title">Enter Subject Marks</div>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: 20 }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Candidate (ID or Index Number)</label>
            <input className="form-control" placeholder="e.g. 12345678901001"
              value={form.candidate_index}
              onChange={e => set('candidate_index', e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subject (ID)</label>
            <input className="form-control" placeholder="Subject ID"
              value={form.subject_code}
              onChange={e => set('subject_code', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Examination Year (ID)</label>
            <input className="form-control" placeholder="Year ID"
              value={form.examination_year}
              onChange={e => set('examination_year', e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border-subtle)', paddingTop: 16 }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--clr-text-muted)', marginBottom: 14
            }}>Paper Scores (0 – 100)</div>
            <div className="marks-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[
                { field: 'paper1_score', label: 'Paper 1' },
                { field: 'paper2_score', label: 'Paper 2' },
                { field: 'paper3_score', label: 'Paper 3' },
                { field: 'practical_score', label: 'Practical' },
              ].map(({ field, label }) => (
                <div key={field} className="marks-input-card">
                  <div className="marks-input-label">{label}</div>
                  <input
                    type="number" min="0" max="100" step="0.01"
                    className="marks-input"
                    placeholder="—"
                    value={form[field]}
                    onChange={e => set(field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Enter Marks'}
          </button>
        </form>
      </div>

      {/* Approve marks panel */}
      <div>
        <div className="form-section" style={{ height: 'fit-content' }}>
          <div className="form-section-title">Approve Marks</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Once approved, marks are locked and cannot be modified without admin intervention.
            Enter the SubjectResult UUID to approve.
          </p>

          {approveMsg && (
            <div className={`alert ${approveMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}
              style={{ marginBottom: 16 }}>
              {approveMsg.text}
            </div>
          )}

          <form onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">SubjectResult UUID</label>
              <input className="form-control"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={approveId}
                onChange={e => setApproveId(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>
            <button type="submit" className="btn btn-accent" disabled={approveLoading || !approveId.trim()}>
              {approveLoading ? 'Approving...' : 'Approve Marks'}
            </button>
          </form>
        </div>

        {/* Info card */}
        <div style={{
          marginTop: 16, padding: 16,
          background: 'var(--clr-warning-bg)',
          border: '1px solid #f5dfa5',
          borderRadius: 'var(--r-md)',
          fontSize: '0.82rem', color: 'var(--clr-warning)',
          lineHeight: 1.6,
        }}>
          <strong>Note:</strong> Only results with status ENTERED, VALIDATED, or MODERATED can be approved.
          Approving locks the marks and triggers grade computation.
        </div>
      </div>
    </div>
  );
}