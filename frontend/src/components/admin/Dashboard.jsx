import { useState, useEffect } from 'react';
import { fetchCandidates, fetchAuditLogs, fetchSchoolPerformance } from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const GRADE_COLORS = {
  A: '#0a4a2f', 'A-': '#1e7a4e',
  'B+': '#2e9668', B: '#3aad7c', 'B-': '#5bbf94',
  'C+': '#c8a84b', C: '#d4a020', 'C-': '#c8780a',
  'D+': '#b85a18', D: '#b03a2e', 'D-': '#922820', E: '#6b1c14',
};

export default function Dashboard() {
  const [stats, setStats] = useState({ candidates: 0, recent_queries: 0 });
  const [logs, setLogs] = useState([]);
  const [perf, setPerf] = useState(null);
  const [centerCode, setCenterCode] = useState('');
  const [perfYear, setPerfYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchCandidates({ page_size: 1 }),
      fetchAuditLogs({ action: 'RESULT_VIEW' }),
    ]).then(([cRes, aRes]) => {
      setStats({ candidates: cRes.data?.count ?? cRes.data?.length ?? '—' });
      setLogs((aRes.data || []).slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadPerformance = async () => {
    if (!centerCode) return;
    setPerfLoading(true);
    setPerf(null);
    try {
      const { data } = await fetchSchoolPerformance(centerCode, perfYear || undefined);
      setPerf(data);
    } catch {
      setPerf({ error: 'School not found or no results available.' });
    } finally {
      setPerfLoading(false);
    }
  };

  const chartData = perf?.grade_distribution?.map(d => ({
    grade: d.mean_grade__grade || '?',
    count: d.count,
    fill: GRADE_COLORS[d.mean_grade__grade] || '#aaa',
  })) ?? [];

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon={<UsersIcon />} iconCls="green" label="Total Candidates" value={stats.candidates} />
        <StatCard icon={<SearchIcon />} iconCls="blue" label="Recent Result Lookups" value={logs.length} sub="last 8 events" />
        <StatCard icon={<CheckIcon />} iconCls="gold" label="Active" value="System" sub="All systems operational" />
      </div>

      <div className="dashboard-grid">
        {/* School performance lookup */}
        <div className="chart-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div className="chart-title">School Performance Analytics</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="form-control"
                placeholder="Center code (11 digits)"
                value={centerCode}
                onChange={e => setCenterCode(e.target.value)}
                style={{ width: 200, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
              <input
                className="form-control"
                placeholder="Year (optional)"
                value={perfYear}
                onChange={e => setPerfYear(e.target.value)}
                style={{ width: 110 }}
                inputMode="numeric"
                maxLength={4}
              />
              <button className="btn btn-primary" onClick={loadPerformance} disabled={perfLoading || !centerCode}>
                {perfLoading ? 'Loading...' : 'Analyse'}
              </button>
            </div>
          </div>

          {perf?.error && (
            <div className="alert alert-error">{perf.error}</div>
          )}

          {perf && !perf.error && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Candidates', value: perf.summary?.total_candidates },
                  { label: 'Mean Total Points', value: perf.summary?.mean_total_points?.toFixed(1) },
                  { label: 'Mean Score', value: perf.summary?.mean_score?.toFixed(2) },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '14px 16px', background: 'var(--clr-surface-2)',
                    borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border-subtle)'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--clr-primary)', marginTop: 4 }}>{s.value ?? '—'}</div>
                  </div>
                ))}
              </div>

              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="grade" tick={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', borderRadius: 8, border: '1px solid var(--clr-border)' }}
                      formatter={(v) => [`${v} candidates`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {!perf && !perfLoading && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <BarIcon />
              <h3>No data yet</h3>
              <p>Enter a school center code to view analytics</p>
            </div>
          )}
        </div>

        {/* Recent audit activity */}
        <div className="chart-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-border-subtle)' }}>
            <div className="chart-title">Recent Activity</div>
          </div>
          {logs.length === 0 ? (
            <div className="empty-state">
              <ClipboardIcon />
              <h3>No recent activity</h3>
              <p>Audit events will appear here</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="audit-entry">
                <div className="audit-dot" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="audit-desc">{log.description}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                    <span className="audit-actor">{log.actor || 'anonymous'}</span>
                    <span className="audit-time">{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconCls, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconCls}`}>{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });
}

function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function BarIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>;
}
function ClipboardIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>;
}