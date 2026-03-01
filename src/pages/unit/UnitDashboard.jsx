import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { MetricCard } from '../../components/ui';
import { formatCurrency, formatDate, getStatusStyle, STATUS_ORDER } from '../../utils/helpers';
import { Users, ShoppingBag, DollarSign, Plus } from 'lucide-react';

export default function UnitDashboard() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;

    const [metrics, setMetrics] = useState(null);
    const [recentClients, setRecentClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!unitId) return;
        async function loadData() {
            setLoading(true);
            const m = await clientService.getUnitMetrics(unitId);
            setMetrics(m);

            // Get last 8 clients directly via list filtering
            const recent = await clientService.getClients(unitId);
            setRecentClients(recent.slice(0, 8));
            setLoading(false);
        }
        loadData();
    }, [unitId]);

    const total = metrics ? Number(metrics.total_clients) : 0;
    const faturamento = metrics ? Number(metrics.total_revenue) : 0;
    const pendentes = metrics ? Number(metrics.status_new || 0) + Number(metrics.status_production || 0) + Number(metrics.status_ready || 0) : 0;

    const statusCounts = {
        'Novo': metrics?.status_new || 0,
        'Em Produção': metrics?.status_production || 0,
        'Pronto': metrics?.status_ready || 0,
        'Entregue': metrics?.status_delivered || 0,
        'Cancelado': metrics?.status_cancelled || 0,
    };

    const statusIcons = { 'Novo': '🔴', 'Em Produção': '🟡', 'Pronto': '🟣', 'Entregue': '🟢', 'Cancelado': '⚪' };
    const statusColorClass = {
        'Novo': 'border-l-red-500 bg-red-50',
        'Em Produção': 'border-l-yellow-500 bg-yellow-50',
        'Pronto': 'border-l-purple-500 bg-purple-50',
        'Entregue': 'border-l-green-500 bg-green-50',
        'Cancelado': 'border-l-gray-500 bg-gray-50',
    };

    return (
        <UnitLayout slug={slug}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Visão geral da unidade</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando métricas...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <MetricCard icon={<Users size={22} />} label="Total de Clientes" value={total} color="indigo" />
                        <MetricCard icon={<ShoppingBag size={22} />} label="Pedidos Pendentes" value={pendentes} color="yellow" />
                        <MetricCard icon={<DollarSign size={22} />} label="Faturamento Total" value={formatCurrency(faturamento)} color="green" />
                    </div>

                    <div className="mb-6">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Status dos Pedidos</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'].map(status => {
                                const style = getStatusStyle(status);
                                return (
                                    <Link
                                        key={status}
                                        to={`/${slug}/clientes?status=${encodeURIComponent(status)}`}
                                        className={`border-l-4 rounded-xl p-4 transition-all duration-200 card-hover ${statusColorClass[status]}`}
                                        style={{ borderLeftColor: style.color || '#cbd5e1' }}
                                    >
                                        <div className="text-2xl">{statusIcons[status]}</div>
                                        <div className="text-3xl font-bold mt-2" style={{ color: style.color }}>
                                            {statusCounts[status]}
                                        </div>
                                        <div className="text-xs font-medium text-gray-600 mt-1">{status}</div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <h2 className="text-base font-semibold text-gray-800">Clientes Recentes</h2>
                            <Link
                                to={`/${slug}/clientes/novo`}
                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                                <Plus size={14} />
                                Novo Cliente
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentClients.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhum cliente cadastrado</p>
                                </div>
                            ) : (
                                recentClients.map(client => {
                                    const style = getStatusStyle(client.status);
                                    return (
                                        <Link
                                            key={client.id}
                                            to={`/${slug}/clientes/${client.id}`}
                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500">
                                                {client.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                                                <p className="text-xs text-gray-400">{client.email || client.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="text-xs px-2 py-1 rounded-full font-medium border"
                                                    style={{ background: style.bg, color: style.color, borderColor: style.border }}
                                                >
                                                    {client.status}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-600">{formatCurrency(client.total_value)}</span>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                        {total > 8 && (
                            <div className="px-5 py-3 border-t border-gray-50">
                                <Link to={`/${slug}/clientes`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    Ver todos os {total} clientes →
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </UnitLayout>
    );
}
