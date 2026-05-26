import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sider from '../components/common/Sider';

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/candidates': 'Candidates',
  '/admin/candidates/register': 'Register Candidate',
  '/admin/marks/enter': 'Enter Marks',
  '/admin/audit-logs': 'Audit Logs',
};

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;

  const title = PAGE_TITLES[pathname] || 'Admin';

  return (
    <div className="admin-layout">
      <Sider open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(o => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </svg>
            </button>
            <span className="topbar-title">{title}</span>
          </div>

          <div className="topbar-actions">
            <a href="/" target="_blank" rel="noreferrer"
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', gap: 6 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Public Portal
            </a>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}