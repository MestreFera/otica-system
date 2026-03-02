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
import CRMKanban from './pages/unit/CRMKanban';
import FinancialPage from './pages/unit/FinancialPage';
import AppointmentsPage from './pages/unit/AppointmentsPage';

// Public Pages
import ClientStatusPage from './pages/public/ClientStatusPage';

function RequireMaster({ children }) {
  const { profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-12 h-12 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#F97316] animate-pulse">Authenticating Master Session...</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'master') return <Navigate to="/master/login" replace />;
  return children;
}

function RequireUnit({ children }) {
  const { profile, loading } = useAuthStore();
  const location = window.location;
  const slug = location.pathname.split('/')[1] || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-12 h-12 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#F97316] animate-pulse">Initializing Node Environment...</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'unit') return <Navigate to={`/${slug}/login`} replace />;
  if (profile.units?.slug !== slug) return <Navigate to={`/${profile.units.slug}/dashboard`} replace />;

  return children;
}

function RootRedirect() {
  const { profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-12 h-12 border-2 border-white/10 border-t-white/80 rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-neutral-500 animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

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

        {/* Core AI & Comms */}
        <Route path="/:slug/agente" element={<RequireUnit><CRMPage /></RequireUnit>} />
        <Route path="/:slug/whatsapp" element={<RequireUnit><CRMPage /></RequireUnit>} />
        <Route path="/:slug/pipeline" element={<RequireUnit><CRMKanban /></RequireUnit>} />

        {/* Operations */}
        <Route path="/:slug/agendamentos" element={<RequireUnit><AppointmentsPage /></RequireUnit>} />
        <Route path="/:slug/clientes" element={<RequireUnit><ClientsPanel /></RequireUnit>} />
        <Route path="/:slug/clientes/novo" element={<RequireUnit><ClientForm /></RequireUnit>} />
        <Route path="/:slug/clientes/:id/editar" element={<RequireUnit><ClientForm /></RequireUnit>} />
        <Route path="/:slug/clientes/:id" element={<RequireUnit><ClientDetails /></RequireUnit>} />

        {/* Advanced Features */}
        <Route path="/:slug/pausas" element={<RequireUnit><CRMPage /></RequireUnit>} />
        <Route path="/:slug/disparos" element={<RequireUnit><CRMPage /></RequireUnit>} />

        {/* Management */}
        <Route path="/:slug/financeiro" element={<RequireUnit><FinancialPage /></RequireUnit>} />
        <Route path="/:slug/crm" element={<RequireUnit><CRMPage /></RequireUnit>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
