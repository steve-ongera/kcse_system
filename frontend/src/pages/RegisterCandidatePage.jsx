import { Link } from 'react-router-dom';
import CandidateForm from '../components/admin/CandidateForm';

export default function RegisterCandidatePage() {
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
          Register New Candidate
        </h2>
      </div>
      <CandidateForm />
    </div>
  );
}