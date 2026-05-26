import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCandidates } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STATUS_COLORS = {
  DRAFT: 'status-draft',
  SUBMITTED: 'status-pending',
  SCHOOL_VERIFIED: 'status-pending',
  SUB_COUNTY_APPROVED: 'status-approved',
  COUNTY_APPROVED: 'status-approved',
  KNEC_VERIFIED: 'status-approved',
  REJECTED: 'status-rejected',
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', school: '', year: '' });
  const [search, setSearch] = useState({ name: '', school: '', year: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.name) params.name = search.name;
      if (search.school) params.school = search.school;
      if (search.year) params.year = search.year;
      const { data } = await fetchCandidates(params);
      setCandidates(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ ...filters });
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
          All Candidates
        </h2>
        <Link to="/admin/candidates/register" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Register New Candidate
        </Link>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch}>
        <div className="data-table-wrapper" style={{ marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[
              { key: 'name', placeholder: 'Search by name', label: 'Name' },
              { key: 'school', placeholder: 'Center code', label: 'School' },
              { key: 'year', placeholder: 'e.g. 2023', label: 'Year' },
            ].map(({ key, placeholder, label }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>{label}</label>
                <input
                  className="form-control"
                  placeholder={placeholder}
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: 180 }}
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
              Search
            </button>
            <button type="button" className="btn btn-ghost"
              style={{ alignSelf: 'flex-end' }}
              onClick={() => { setFilters({ name: '', school: '', year: '' }); setSearch({ name: '', school: '', year: '' }); }}>
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="data-table-wrapper">
        {loading ? (
          <LoadingSpinner text="Loading candidates..." />
        ) : candidates.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            <h3>No candidates found</h3>
            <p>Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Index Number</th>
                  <th>Full Name</th>
                  <th>Gender</th>
                  <th>School</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.index_number}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {c.index_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{c.full_name}</td>
                    <td>{c.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{c.school?.name || c.school}</td>
                    <td>{c.examination_year?.year || c.examination_year}</td>
                    <td>
                      <span className={`status-chip ${STATUS_COLORS[c.registration_status] || 'status-draft'}`}>
                        {formatStatus(c.registration_status)}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/candidates/${c.index_number}`}
                        className="btn btn-ghost"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      >Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatStatus(s) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
}