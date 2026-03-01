import { Link, useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import {
    LayoutDashboard, Users, BarChart2, LogOut, Menu, X,
    Bell, ChevronRight, Building2
} from 'lucide-react';
import { useState } from 'react';

export default function UnitLayout({ children, slug }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoutUnit, unitAuth, getNotifications } = useStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const notifications = getNotifications(slug).filter(n => !n.read);

    const nav = [
        { to: `/${slug}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
        { to: `/${slug}/clientes`, label: 'Clientes', icon: Users },
        { to: `/${slug}/crm`, label: 'CRM', icon: BarChart2 },
    ];

    function handleLogout() {
        logoutUnit();
        navigate(`/${slug}/login`);
    }

    const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                        👁
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Ótica</p>
                        <p className="text-sm font-bold text-gray-800 leading-tight">{unitAuth?.unitName || slug}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {nav.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive(to)
                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border border-indigo-100'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} className={isActive(to) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-600'} />
                            {label}
                            {isActive(to) && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {unitAuth?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{unitAuth?.email}</p>
                            <p className="text-xs text-gray-400">Gerente</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
                    <button
                        onClick={() => setSidebarOpen(s => !s)}
                        className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="flex-1" />
                    {notifications.length > 0 && (
                        <div className="relative">
                            <Bell size={20} className="text-gray-500" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {notifications.length}
                            </span>
                        </div>
                    )}
                    <Link
                        to="/master/dashboard"
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        <Building2 size={14} />
                        Painel Master
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 animate-fadeIn overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
