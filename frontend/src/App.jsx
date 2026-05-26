import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Public pages
import Home from './pages/Home';
import ResultsPage from './pages/ResultsPage';
import NotFound from './pages/NotFound';

// Auth
import LoginPage from './pages/LoginPage';

// Admin layout + pages
import AdminLayout from './pages/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import CandidatesPage from './pages/CandidatesPage';
import RegisterCandidatePage from './pages/RegisterCandidatePage';
import EditCandidatePage from './pages/EditCandidatePage';
import MarksEntryPage from './pages/MarksEntryPage';
import AuditLogsPage from './pages/AuditLogsPage';

/* ─── Public layout wrapper ─── */
function PublicLayout({ children }) {
  return (
    <div className="page-wrapper">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ───────────────────────── */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />
            <Route
              path="/results"
              element={
                <PublicLayout>
                  <ResultsPage />
                </PublicLayout>
              }
            />

            {/* ── Auth ────────────────────────────────── */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* ── Admin routes (protected) ─────────────  */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="candidates/register" element={<RegisterCandidatePage />} />
              <Route path="candidates/:indexNumber" element={<EditCandidatePage />} />
              <Route path="marks/enter" element={<MarksEntryPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* ── 404 ─────────────────────────────────── */}
            <Route
              path="*"
              element={
                <PublicLayout>
                  <NotFound />
                </PublicLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}