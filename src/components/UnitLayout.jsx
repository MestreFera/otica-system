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
        <div className="min-h-screen gradient-unit flex">
            {/* ── Sidebar ── */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-[260px] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
                style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>

                {/* Brand */}
                <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="logo-icon">
                        <Scan size={18} className="text-[#0B0B0F]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>ÓticaSystem</p>
                        <p className="text-sm font-bold text-white leading-tight truncate">{unitName}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto dark-scroll">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: 'var(--text-muted)' }}>Menu Principal</p>
                    {nav.map(({ to, label, icon: Icon, badge }) => (
                        <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${isActive(to) ? 'active' : ''}`}>
                            <Icon size={18} />
                            <span className="flex-1">{label}</span>
                            {badge && <span className="text-[10px] min-w-5 h-5 flex items-center justify-center rounded-full font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{badge}</span>}
                            {!badge && isActive(to) && <ChevronRight size={14} style={{ color: 'var(--accent)', opacity: 0.6 }} />}
                        </Link>
                    ))}
                </nav>

                {/* User profile */}
                <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}>
                            {userEmail?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{userEmail}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gerente</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all"
                        style={{ color: 'rgba(239, 68, 68, 0.7)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'; }}>
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </aside>

            {/* Sidebar overlay (mobile) */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
                {/* Topbar */}
                <header className="sticky top-0 z-10 px-4 lg:px-6 py-3 flex items-center gap-4 backdrop-blur-xl"
                    style={{ background: 'rgba(11, 11, 15, 0.85)', borderBottom: '1px solid var(--border)' }}>
                    <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}>
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Search hint */}
                    <button className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
                        <Search size={12} /> Buscar...
                        <kbd className="text-[9px] rounded px-1 ml-1" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>⌘K</kbd>
                    </button>

                    <div className="flex-1" />

                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <div className="relative">
                            <Bell size={20} style={{ color: 'var(--text-muted)' }} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-bold"
                                style={{ background: 'var(--accent)', color: '#0B0B0F' }}>
                                {notifications.length}
                            </span>
                        </div>
                    )}

                    {/* Master link */}
                    <Link to="/master/dashboard" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        <LayoutDashboard size={13} /> Master
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
