import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { unitService } from '../services/unitService';
import { appointmentService } from '../services/appointmentService';
import {
    LayoutDashboard, Users, BarChart2, LogOut, Menu, X,
    Bell, ChevronRight, Building2, Scan, DollarSign, Calendar, Search
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UnitLayout({ children, slug }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, profile, user } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [todayCount, setTodayCount] = useState(0);

    const unitName = profile?.units?.name || slug;
    const userEmail = user?.email || '';

    useEffect(() => {
        if (!profile?.unit_id) return;
        async function load() {
            const [notifs, count] = await Promise.all([
                unitService.getNotifications(profile.unit_id),
                appointmentService.getTodayCount(profile.unit_id),
            ]);
            setNotifications(notifs.filter(n => !n.read));
            setTodayCount(count);
        }
        load();
    }, [profile?.unit_id]);

    const nav = [
        { to: `/${slug}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
        { to: `/${slug}/clientes`, label: 'Clientes', icon: Users },
        { to: `/${slug}/agendamentos`, label: 'Agendamentos', icon: Calendar, badge: todayCount || null },
        { to: `/${slug}/financeiro`, label: 'Financeiro', icon: DollarSign },
        { to: `/${slug}/crm`, label: 'CRM', icon: BarChart2 },
    ];

    async function handleLogout() {
        await logout();
        navigate(`/${slug}/login`);
    }

    const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

    return (
        <div className="min-h-screen gradient-unit flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#060a14]/95 backdrop-blur-xl border-r border-white/[0.04] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.04]">
                    <div className="logo-icon"><Scan size={20} className="text-white" /></div>
                    <div>
                        <p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-widest">Ótica</p>
                        <p className="text-sm font-bold text-white leading-tight">{unitName}</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto dark-scroll">
                    {nav.map(({ to, label, icon: Icon, badge }) => (
                        <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive(to) ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'}`}>
                            <Icon size={18} className={isActive(to) ? 'text-cyan-400' : 'text-white/30 group-hover:text-white/60'} />
                            {label}
                            {badge && <span className="ml-auto text-[10px] min-w-5 h-5 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">{badge}</span>}
                            {!badge && isActive(to) && <ChevronRight size={14} className="ml-auto text-cyan-400/60" />}
                        </Link>
                    ))}
                </nav>

                <div className="px-4 py-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/20">
                            {userEmail?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/70 truncate">{userEmail}</p>
                            <p className="text-[10px] text-white/30">Gerente</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <header className="bg-[#060a14]/80 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
                    <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden text-white/40 hover:text-cyan-400 p-1 rounded-lg hover:bg-white/5 transition-colors">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    {/* Ctrl+K hint */}
                    <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))} className="hidden md:flex items-center gap-2 text-xs text-white/15 border border-white/[0.06] px-3 py-1.5 rounded-lg hover:border-cyan-400/20 hover:text-white/30 transition-all">
                        <Search size={12} /> Buscar... <kbd className="text-[9px] border border-white/10 rounded px-1">Ctrl+K</kbd>
                    </button>
                    <div className="flex-1" />
                    {notifications.length > 0 && (
                        <div className="relative">
                            <Bell size={20} className="text-white/40" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-cyan-500/50">
                                {notifications.length}
                            </span>
                        </div>
                    )}
                    <Link to="/master/dashboard" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-cyan-400 transition-colors">
                        <Building2 size={14} /> Master
                    </Link>
                </header>

                <main className="flex-1 p-6 animate-fadeIn overflow-auto dark-scroll">{children}</main>
            </div>
        </div>
    );
}
