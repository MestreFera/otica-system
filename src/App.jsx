import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import GlobalSearch from './components/ui/GlobalSearch';
import { ToastContainer } from './components/ui/Toast';

// Master Pages
import MasterLogin from './pages/master/MasterLogin';
import MasterDashboard from './pages/master/MasterDashboard';
import UnitsList from './pages/master/UnitsList';
import NewUnit from './pages/master/NewUnit';
import AutomationsHub from './pages/master/AutomationsHub';

// Unit Pages
import UnitLogin from './pages/unit/UnitLogin';
import UnitDashboard from './pages/unit/UnitDashboard';
import ClientsPanel from './pages/unit/ClientsPanel';
import ClientForm from './pages/unit/ClientForm';
import ClientDetails from './pages/unit/ClientDetails';
import CRMPage from './pages/unit/CRMPage';
import FinancialPage from './pages/unit/FinancialPage';
import AppointmentsPage from './pages/unit/AppointmentsPage';

// Public Pages
import ClientStatusPage from './pages/public/ClientStatusPage';

function RequireMaster({ children }) {
  const { profile, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" /></div>;
  if (!profile || profile.role !== 'master') return <Navigate to="/master/login" replace />;
  return children;
}

function RequireUnit({ children }) {
  const { profile, loading } = useAuthStore();
  const location = window.location;
  // Extract slug from path like /:slug/dashboard → redirect to /:slug/login
  const slug = location.pathname.split('/')[1] || '';
  if (loading) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" /></div>;
  if (!profile || profile.role !== 'unit') return <Navigate to={`/${slug}/login`} replace />;
  return children;
}

function RootRedirect() {
  const { profile, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" /></div>;
  if (profile?.role === 'master') return <Navigate to="/master/dashboard" replace />;
  if (profile?.role === 'unit' && profile.units) return <Navigate to={`/${profile.units.slug}/dashboard`} replace />;
  return <Navigate to="/master/login" replace />;
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <GlobalSearch />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/status/:token" element={<ClientStatusPage />} />

        {/* Master */}
        <Route path="/master/login" element={<MasterLogin />} />
        <Route path="/master/dashboard" element={<RequireMaster><MasterDashboard /></RequireMaster>} />
        <Route path="/master/unidades" element={<RequireMaster><UnitsList /></RequireMaster>} />
        <Route path="/master/unidades/nova" element={<RequireMaster><NewUnit /></RequireMaster>} />
        <Route path="/master/automations" element={<RequireMaster><AutomationsHub /></RequireMaster>} />

        {/* Unit */}
        <Route path="/:slug/login" element={<UnitLogin />} />
        <Route path="/:slug/dashboard" element={<RequireUnit><UnitDashboard /></RequireUnit>} />
        <Route path="/:slug/clientes" element={<RequireUnit><ClientsPanel /></RequireUnit>} />
        <Route path="/:slug/clientes/novo" element={<RequireUnit><ClientForm /></RequireUnit>} />
        <Route path="/:slug/clientes/:id/editar" element={<RequireUnit><ClientForm /></RequireUnit>} />
        <Route path="/:slug/clientes/:id" element={<RequireUnit><ClientDetails /></RequireUnit>} />
        <Route path="/:slug/crm" element={<RequireUnit><CRMPage /></RequireUnit>} />
        <Route path="/:slug/financeiro" element={<RequireUnit><FinancialPage /></RequireUnit>} />
        <Route path="/:slug/agendamentos" element={<RequireUnit><AppointmentsPage /></RequireUnit>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
