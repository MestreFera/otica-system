import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Master Pages
import MasterLogin from './pages/master/MasterLogin';
import MasterDashboard from './pages/master/MasterDashboard';
import UnitsList from './pages/master/UnitsList';
import NewUnit from './pages/master/NewUnit';

// Unit Pages
import UnitLogin from './pages/unit/UnitLogin';
import UnitDashboard from './pages/unit/UnitDashboard';
import ClientsPanel from './pages/unit/ClientsPanel';
import ClientForm from './pages/unit/ClientForm';
import ClientDetails from './pages/unit/ClientDetails';
import CRMPage from './pages/unit/CRMPage';

function RequireMaster({ children }) {
  const { profile, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!profile || profile.role !== 'master') return <Navigate to="/master/login" replace />;
  return children;
}

function RequireUnit({ children }) {
  const { profile, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!profile || profile.role !== 'unit') return <Navigate to="/" replace />;
  return children;
}

function RootRedirect() {
  const { profile, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (profile?.role === 'master') return <Navigate to="/master/dashboard" replace />;
  if (profile?.role === 'unit' && profile.unit) return <Navigate to={`/${profile.unit.slug}/dashboard`} replace />;

  return <Navigate to="/master/login" replace />;
}

export default function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init(); // Initialize Supabase session on mount
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Master Routes */}
        <Route path="/master/login" element={<MasterLogin />} />
        <Route path="/master/dashboard" element={<RequireMaster><MasterDashboard /></RequireMaster>} />
        <Route path="/master/unidades" element={<RequireMaster><UnitsList /></RequireMaster>} />
        <Route path="/master/unidades/nova" element={<RequireMaster><NewUnit /></RequireMaster>} />

        {/* Unit Routes */}
        <Route path="/:slug/login" element={<UnitLogin />} />
        <Route path="/:slug/dashboard" element={<RequireUnit><UnitDashboard /></RequireUnit>} />
        <Route path="/:slug/clientes" element={<RequireUnit><ClientsPanel /></RequireUnit>} />
        <Route path="/:slug/clientes/novo" element={<RequireUnit><ClientForm /></RequireUnit>} />
        <Route path="/:slug/clientes/:id/editar" element={<RequireUnit><ClientForm /></RequireUnit>} />
        <Route path="/:slug/clientes/:id" element={<RequireUnit><ClientDetails /></RequireUnit>} />
        <Route path="/:slug/crm" element={<RequireUnit><CRMPage /></RequireUnit>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
