import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { unitService } from '../services/unitService';
import { appointmentService } from '../services/appointmentService';
import {
    LayoutDashboard, Users, LogOut, Menu, X, Bell, ChevronRight,
    Scan, DollarSign, Calendar, Search, Settings, Package,
    FileText, BarChart2, ShoppingBag, KanbanSquare
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
    const initials = unitName?.slice(0, 2).toUpperCase() || 'OS';

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
        { to: `/${slug}/pipeline`, label: 'CRM Pipeline', icon: KanbanSquare },
        { to: `/${slug}/clientes`, label: 'Clientes', icon: Users },
        { to: `/${slug}/agendamentos`, label: 'Agendamentos', icon: Calendar, badge: todayCount || null },
        { to: `/${slug}/financeiro`, label: 'Financeiro', icon: DollarSign },
        { to: `/${slug}/crm`, label: 'Relatórios (Analytics)', icon: BarChart2 },
    ];

    async function handleLogout() {
        await logout();
        navigate(`/${slug}/login`);
    }

    const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

    return (
        <div className="min-h-screen bg-[#050505] canvas-bg-wrapper text-neutral-300 font-sans selection:bg-[#F97316]/30 selection:text-white flex overflow-hidden">
            <div className="grid-bg"></div>
            <div className="aura-glow"></div>

            {/* ── Floating Glass Dock (Sidebar) ── */}
            <aside className={`fixed inset-y-4 left-4 z-40 w-[240px] flex flex-col rounded-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'} lg:translate-x-0 backdrop-blur-2xl border border-white/10 bg-black/60 shadow-2xl overflow-hidden`}>

                {/* Brand */}
                <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F97316]/50 to-transparent"></div>
                    <div className="w-8 h-8 rounded-sm bg-[#111] border border-white/10 flex items-center justify-center text-[#F97316]">
                        <Scan size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#F97316]">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white leading-tight truncate">{unitName}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto dark-scroll font-mono">
                    <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-4 text-neutral-600">Core Modules</p>
                    {nav.map(({ to, label, icon: Icon, badge }) => {
                        const active = isActive(to);
                        return (
                            <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-300 group ${active ? 'bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'}`}>
                                <Icon size={18} className={`transition-colors duration-300 ${active ? 'text-[#F97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'group-hover:text-neutral-400'}`} />
                                <span className="flex-1 tracking-wide">{label}</span>
                                {badge && <span className="text-[9px] min-w-5 h-5 flex items-center justify-center rounded-sm font-bold bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30">{badge}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User profile */}
                <div className="p-4 border-t border-white/5 bg-black/40">
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <div className="w-8 h-8 rounded-sm bg-[#111] border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#F97316] flex-shrink-0">
                            {userEmail?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0 font-mono">
                            <p className="text-[11px] font-bold text-neutral-300 truncate">{userEmail}</p>
                            <p className="text-[9px] text-neutral-600 uppercase tracking-widest">Manager Node</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-mono font-bold tracking-widest uppercase rounded-lg border border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <LogOut size={14} /> Disconnect
                    </button>
                </div>
            </aside>

            {/* Sidebar overlay (mobile) */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[272px] relative z-10 h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-20 px-6 py-4 flex items-center gap-4 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                    <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden p-2 rounded-md bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Search hint */}
                    <button className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-sm font-mono tracking-widest uppercase border border-white/10 bg-black/40 text-neutral-500 hover:border-white/20 transition-all"
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
                        <Search size={12} /> Global Search
                        <kbd className="text-[9px] rounded-sm px-1.5 py-0.5 ml-2 bg-white/5 border border-white/10 text-neutral-400">⌘K</kbd>
                    </button>

                    <div className="flex-1" />

                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <div className="relative cursor-pointer group">
                            <Bell size={20} className="text-neutral-500 group-hover:text-[#F97316] transition-colors" />
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] rounded-full flex items-center justify-center font-bold font-mono bg-[#F97316] text-black shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                                {notifications.length}
                            </span>
                        </div>
                    )}

                    {/* Master link */}
                    <Link to="/master/dashboard" className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm border border-neutral-800 text-neutral-500 hover:text-white hover:border-white/20 transition-all">
                        <LayoutDashboard size={12} /> Master Node
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 animate-fadeIn overflow-auto dark-scroll">
                    {children}
                </main>
            </div>
        </div>
    );
}
