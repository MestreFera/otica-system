import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { formatRelativeTime, formatCurrency } from '../../utils/helpers';
import {
    Building2, Users, TrendingUp, Activity, Plus, LogOut,
    Power, ExternalLink, Send, Bell, ChevronRight, Eye
} from 'lucide-react';

export default function MasterDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [notification, setNotification] = useState({ open: false, target: 'all', message: '' });

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const data = await unitService.getAllUnits();
        setUnits(data);
        setLoading(false);
    }

    const activeUnits = units.filter(u => u.active);
    const inactiveUnits = units.filter(u => !u.active);

    const totalClients = units.reduce((s, u) => s + Number(u.total_clients), 0);
    const totalRevenue = units.reduce((s, u) => s + Number(u.total_revenue), 0);
    const totalDelivered = units.reduce((s, u) => s + Number(u.status_delivered), 0);

    async function handleToggleStatus(unit) {
        const { success } = await unitService.toggleUnitActive(unit.id, unit.active);
        if (success) {
            setUnits(units.map(u => u.id === unit.id ? { ...u, active: !u.active } : u));
        }
    }

    function handleAccessUnit(unit) {
        navigate(`/${unit.slug}/dashboard`);
    }

    async function handleSendNotification() {
        if (!notification.message.trim()) return;
        await unitService.createNotification({
            unitId: notification.target,
            title: 'Mensagem do Admin',
            message: notification.message,
            type: 'info'
        });
        setNotification({ open: false, target: 'all', message: '' });
    }

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            <header className="border-b border-gray-800/50 px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xl">👁</div>
                    <div>
                        <p className="text-xs text-gray-500">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Master Admin</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1 ml-8">
                    <Link to="/master/dashboard" className="px-4 py-2 text-sm text-yellow-400 bg-yellow-400/10 rounded-lg font-medium">Dashboard</Link>
                    <Link to="/master/unidades" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">Unidades</Link>
                </nav>
                <div className="flex-1" />
                <button
                    onClick={() => setNotification(n => ({ ...n, open: true }))}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                    <Bell size={16} />
                    <span className="hidden sm:inline">Notificação</span>
                </button>
                <button
                    onClick={async () => { await logout(); navigate('/master/login'); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Sair</span>
                </button>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Dashboard Master</h1>
                    <p className="text-gray-500 text-sm mt-1">Visão consolidada de todas as unidades</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total de Unidades', value: units.length, icon: '🏪', color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', text: 'text-blue-400' },
                        { label: 'Unidades Ativas', value: activeUnits.length, icon: '✅', color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30', text: 'text-green-400' },
                        { label: 'Unidades Inativas', value: inactiveUnits.length, icon: '⏸', color: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/30', text: 'text-gray-400' },
                        { label: 'Total de Clientes', value: totalClients, icon: '👥', color: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', text: 'text-purple-400' },
                    ].map((m) => (
                        <div key={m.label} className={`bg-gradient-to-br ${m.color} border ${m.border} rounded-2xl p-4`}>
                            <div className="text-2xl mb-2">{m.icon}</div>
                            <div className={`text-2xl font-bold ${m.text}`}>
                                {loading ? <span className="text-gray-600">...</span> : m.value}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Faturamento Total (todas unidades)</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {loading ? '...' : formatCurrency(totalRevenue)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Pedidos Entregues (todas unidades)</p>
                        <p className="text-3xl font-bold text-green-400">
                            {loading ? '...' : totalDelivered}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Unidades</h2>
                    <Link
                        to="/master/unidades/nova"
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-yellow-500/30"
                    >
                        <Plus size={16} />
                        Nova Unidade
                    </Link>
                </div>

                <div className="grid gap-4">
                    {units.map(unit => (
                        <div
                            key={unit.slug}
                            className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-700/50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                                    🏪
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-white font-semibold">{unit.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unit.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700/50 text-gray-500 border border-gray-600/30'}`}>
                                            {unit.active ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">{unit.city} · {unit.slug} · {unit.total_clients} clientes</p>
                                    <p className="text-sm text-gray-600 mt-0.5">Faturamento: <span className="text-yellow-500/80">{formatCurrency(unit.total_revenue)}</span> · Último acesso: {unit.last_access ? formatRelativeTime(unit.last_access) : 'Nunca'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleStatus(unit)}
                                    title={unit.active ? 'Desativar' : 'Ativar'}
                                    className={`p-2 rounded-lg transition-all duration-200 ${unit.active ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-600 hover:bg-gray-700'}`}
                                >
                                    <Power size={16} />
                                </button>
                                <button
                                    onClick={() => setNotification({ open: true, target: unit.id, message: '' })}
                                    className="p-2 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200"
                                    title="Enviar aviso"
                                >
                                    <Send size={16} />
                                </button>
                                <button
                                    onClick={() => handleAccessUnit(unit)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 text-sm font-medium rounded-lg transition-all duration-200"
                                >
                                    <Eye size={14} />
                                    Acessar
                                </button>
                            </div>
                        </div>
                    ))}

                    {!loading && units.length === 0 && (
                        <div className="text-center py-16 text-gray-600">
                            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">Nenhuma unidade cadastrada</p>
                            <p className="text-sm mt-1">Crie sua primeira unidade para começar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Modal */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${notification.open ? '' : 'hidden'}`}>
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNotification(n => ({ ...n, open: false }))} />
                <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
                    <h3 className="text-lg font-semibold text-white mb-4">Enviar Notificação</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Destinatário</label>
                            <select
                                value={notification.target}
                                onChange={e => setNotification(n => ({ ...n, target: e.target.value }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500"
                            >
                                <option value="all">Todas as unidades</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Mensagem</label>
                            <textarea
                                value={notification.message}
                                onChange={e => setNotification(n => ({ ...n, message: e.target.value }))}
                                placeholder="Digite a mensagem..."
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500 resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNotification(n => ({ ...n, open: false }))}
                                className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSendNotification}
                                className="flex-1 py-2.5 text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-all"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
