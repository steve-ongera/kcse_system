import { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ACTIONS = [
  '', 'RESULT_VIEW', 'RESULT_QUERY', 'REGISTRATION_CREATE',
  'REGISTRATION_UPDATE', 'MARKS_ENTRY', 'MARKS_APPROVAL',
  'RESULT_RELEASE', 'RESULT_WITHHELD', 'ADMIN_ACTION',
];

const ACTION_LABELS = {
  RESULT_VIEW: 'Result Viewed',
  RESULT_QUERY: 'Result Queried',
  REGISTRATION_CREATE: 'Registration Created',
  REGISTRATION_UPDATE: 'Registration Updated',
  MARKS_ENTRY: 'Marks Entered',
  MARKS_APPROVAL: 'Marks Approved',
  RESULT_RELEASE: 'Result Released',
  RESULT_WITHHELD: 'Result Withheld',
  ADMIN_ACTION: 'Admin Action',
};

const ACTION_BADGE = {
  RESULT_VIEW: 'badge-green',
  RESULT_QUERY: 'badge-gold',
  MARKS_APPROVAL: 'badge-green',
  MARKS_ENTRY: 'badge-gold',
  REGISTRATION_CREATE: 'badge-green',
  RESULT_WITHHELD: 'badge-red',
  ADMIN_ACTION: 'badge-gray',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [indexFilter, setIndexFilter] = useState('');
  const [applied, setApplied] = useState({ action: '', index_number: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (applied.action) params.action = applied.action;
      if (applied.index_number) params.index_number = applied.index_number;
      const { data } = await fetchAuditLogs(params);
      setLogs(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { load(); }, [load]);

  const apply = () => setApplied({ action: actionFilter, index_number: indexFilter });
  const clear = () => { setActionFilter(''); setIndexFilter(''); setApplied({ action: '', index_number: '' }); };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>
        Audit Logs
      </h2>

      {/* Filters */}
      <div style={{
        background: 'var(--clr-surface)', border: '1px solid var(--clr-border-subtle)',
        borderRadius: 'var(--r-lg)', padding: '16px 20px',
        display: 'flex', gap: 12, flexWrap: 'wrap',
        alignItems: 'flex-end', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>Action</label>
          <select className="form-control" value={actionFilter}
            onChange={e => setActionFilter(e.target.value)} style={{ width: 200 }}>
            <option value="">All actions</option>
            {ACTIONS.filter(Boolean).map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>Index Number</label>
          <input className="form-control" placeholder="14-digit index"
            value={indexFilter}
            onChange={e => setIndexFilter(e.target.value)}
            style={{ width: 180, fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={apply}>Apply</button>
        <button className="btn btn-ghost" style={{ alignSelf: 'flex-end' }} onClick={clear}>Clear</button>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        {loading ? (
          <LoadingSpinner text="Loading logs..." />
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
            <h3>No audit logs found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Index Number</th>
                  <th>Description</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatTs(log.timestamp)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ACTION_BADGE[log.action] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{log.actor || '—'}</td>
                    <td>
                      {log.index_number
                        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{log.index_number}</span>
                        : '—'
                      }
                    </td>
                    <td style={{ maxWidth: 300, fontSize: '0.85rem' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {log.description}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
        Showing up to 500 most recent entries.
      </div>
    </div>
  );
}

function formatTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'medium' });
}