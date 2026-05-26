import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCandidate } from '../utils/api';
import CandidateForm from '../components/admin/CandidateForm';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function EditCandidatePage() {
  const { indexNumber } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCandidate(indexNumber)
      .then(r => setCandidate(r.data))
      .catch(() => setError('Candidate not found.'))
      .finally(() => setLoading(false));
  }, [indexNumber]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link to="/admin/candidates" className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
          Edit Candidate
          {candidate && (
            <span style={{ fontWeight: 400, color: 'var(--clr-text-muted)', marginLeft: 10, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {candidate.index_number}
            </span>
          )}
        </h2>
      </div>

      {loading && <LoadingSpinner text="Loading candidate..." />}
      {error && <div className="alert alert-error">{error}</div>}
      {candidate && <CandidateForm existing={candidate} />}
    </div>
  );
}