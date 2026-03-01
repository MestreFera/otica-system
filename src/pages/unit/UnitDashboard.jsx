import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { Users, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function UnitDashboard() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;

    const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, delivered: 0 });
    const [recentClients, setRecentClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!unitId) return;
        async function load() {
            setLoading(true);
            const [metrics, clients] = await Promise.all([
                clientService.getUnitMetrics(unitId),
                clientService.getClients(unitId),
            ]);
            setStats(metrics);
            setRecentClients(clients.slice(0, 5));
            setLoading(false);
        }
        load();
    }, [unitId]);

    const metricCards = [
        { icon: <Users size={22} />, label: 'Clientes', value: stats.total, gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20' },
        { icon: <DollarSign size={22} />, label: 'Faturamento', value: `R$ ${(stats.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, gradient: 'from-emerald-400 to-green-600', shadow: 'shadow-emerald-500/20' },
        { icon: <Clock size={22} />, label: 'Em Andamento', value: stats.pending, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
        { icon: <CheckCircle size={22} />, label: 'Entregues', value: stats.delivered, gradient: 'from-purple-400 to-violet-600', shadow: 'shadow-purple-500/20' },
    ];

    return (
        <UnitLayout slug={slug}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-white/30 text-sm mt-1">Visão geral da unidade</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {metricCards.map(m => (
                            <div key={m.label} className="metric-card flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white shadow-lg ${m.shadow}`}>
                                    {m.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{m.label}</p>
                                    <p className="text-xl font-bold text-white">{m.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Clients */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={18} className="text-cyan-400/60" />
                                <h2 className="text-lg font-semibold text-white">Últimos Atendimentos</h2>
                            </div>
                            <Link to={`/${slug}/clientes`} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">Ver todos →</Link>
                        </div>

                        {recentClients.length === 0 ? (
                            <p className="text-center text-white/20 py-8 text-sm">Nenhum atendimento registrado</p>
                        ) : (
                            <div className="space-y-3">
                                {recentClients.map(c => (
                                    <Link key={c.id} to={`/${slug}/clientes/${c.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-white text-sm font-bold">
                                            {c.client_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white/80 group-hover:text-white truncate">{c.client_name}</p>
                                            <p className="text-xs text-white/25">{c.lens_type || 'Sem lente'}</p>
                                        </div>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${c.status === 'Entregue' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                                                c.status === 'Pronto' ? 'bg-purple-500/15 text-purple-400 border-purple-500/25' :
                                                    c.status === 'Em Produção' ? 'bg-amber-500/12 text-amber-400 border-amber-500/20' :
                                                        'bg-red-500/15 text-red-400 border-red-500/25'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </UnitLayout>
    );
}
