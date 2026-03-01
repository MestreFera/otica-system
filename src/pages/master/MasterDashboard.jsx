import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { formatCurrency } from '../../utils/helpers';
import { LogOut, Store, Plus, Power, Send, Eye, Bell, Scan, Users, DollarSign, Activity } from 'lucide-react';

export default function MasterDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, target: 'all', message: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const data = await unitService.getAllUnits();
        setUnits(data);
        setLoading(false);
    }

    const totalClients = units.reduce((sum, u) => sum + Number(u.total_clients || 0), 0);
    const totalRevenue = units.reduce((sum, u) => sum + Number(u.total_revenue || 0), 0);
    const activeUnits = units.filter(u => u.active).length;

    async function handleToggle(unit) {
        await unitService.toggleUnitActive(unit.id, unit.active);
        setUnits(units.map(u => u.id === unit.id ? { ...u, active: !u.active } : u));
    }

    async function handleSendNotification() {
        if (!notification.message.trim()) return;
        await unitService.createNotification({ unitId: notification.target, title: 'Admin', message: notification.message, type: 'info' });
        setNotification({ open: false, target: 'all', message: '' });
    }

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            {/* Header */}
            <header className="border-b border-white/[0.04] px-6 py-4 flex items-center gap-4 bg-[#0d1225]/60 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="logo-icon"><Scan size={20} className="text-white" /></div>
                    <div>
                        <p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-widest">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Master Admin</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1 ml-8">
                    <Link to="/master/dashboard" className="px-4 py-2 text-sm text-cyan-400 bg-cyan-400/10 rounded-lg font-medium border border-cyan-400/20">Dashboard</Link>
                    <Link to="/master/unidades" className="px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">Unidades</Link>
                </nav>
                <div className="flex-1" />
                <button onClick={async () => { await logout(); navigate('/master/login'); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
                </button>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white">Dashboard <span className="text-cyan-400">Master</span></h1>
                    <p className="text-white/30 text-sm mt-1">Visão geral do sistema ÓticaSystem</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <Store size={22} />, label: 'Unidades', value: units.length, gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20' },
                        { icon: <Activity size={22} />, label: 'Ativas', value: activeUnits, gradient: 'from-emerald-400 to-green-600', shadow: 'shadow-emerald-500/20' },
                        { icon: <Users size={22} />, label: 'Total Clientes', value: totalClients, gradient: 'from-purple-400 to-violet-600', shadow: 'shadow-purple-500/20' },
                        { icon: <DollarSign size={22} />, label: 'Faturamento', value: formatCurrency(totalRevenue), gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
                    ].map(m => (
                        <div key={m.label} className="metric-card flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white shadow-lg ${m.shadow}`}>
                                {m.icon}
                            </div>
                            <div>
                                <p className="text-xs text-white/30 font-medium uppercase tracking-wider">{m.label}</p>
                                <p className="text-2xl font-bold text-white">{m.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Units Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">Unidades Cadastradas</h2>
                    <Link to="/master/unidades/nova" className="flex items-center gap-2 btn-primary text-sm px-4 py-2.5">
                        <Plus size={16} /> Nova Unidade
                    </Link>
                </div>

                {/* Units List */}
                {loading ? (
                    <div className="text-center py-16 text-white/30">
                        <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
                        Carregando unidades...
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {units.map(unit => (
                            <div key={unit.id || unit.slug} className="glass-card p-5 group">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="text-white font-semibold text-lg">{unit.name}</h3>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${unit.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                                {unit.active ? '● Ativa' : '● Inativa'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                            {[
                                                { label: 'Cidade', val: unit.city },
                                                { label: 'Slug', val: unit.slug },
                                                { label: 'Clientes', val: unit.total_clients || '0' },
                                                { label: 'Faturamento', val: formatCurrency(unit.total_revenue || 0) },
                                            ].map(({ label, val }) => (
                                                <div key={label} className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                                                    <p className="text-[10px] text-white/25 uppercase tracking-wider">{label}</p>
                                                    <p className="text-sm font-semibold text-white/70 mt-0.5">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleToggle(unit)} title={unit.active ? 'Desativar' : 'Ativar'} className={`p-2.5 rounded-xl transition-all ${unit.active ? 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20' : 'text-white/30 hover:bg-white/5 border border-white/10'}`}>
                                            <Power size={16} />
                                        </button>
                                        <button onClick={() => setNotification({ open: true, target: unit.id, message: '' })} className="p-2.5 rounded-xl text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/10 transition-all" title="Enviar aviso">
                                            <Send size={16} />
                                        </button>
                                        <button onClick={() => navigate(`/${unit.slug}/dashboard`)} className="flex items-center gap-1.5 px-3 py-2.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 text-sm font-medium rounded-xl transition-all">
                                            <Eye size={14} /> Acessar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notification modal */}
            {notification.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setNotification(n => ({ ...n, open: false }))} />
                    <div className="relative glass-card glow-border p-6 w-full max-w-md animate-fadeIn">
                        <h3 className="text-lg font-semibold text-white mb-4">Enviar Notificação</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-cyan-300/70 mb-1.5 block">Destinatário</label>
                                <select value={notification.target} onChange={e => setNotification(n => ({ ...n, target: e.target.value }))} className="input-futuristic w-full">
                                    <option value="all">Todas as unidades</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-cyan-300/70 mb-1.5 block">Mensagem</label>
                                <textarea value={notification.message} onChange={e => setNotification(n => ({ ...n, message: e.target.value }))} placeholder="Digite a mensagem..." rows={3} className="input-futuristic w-full resize-none" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setNotification(n => ({ ...n, open: false }))} className="btn-ghost flex-1">Cancelar</button>
                                <button onClick={handleSendNotification} className="btn-primary flex-1">Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
