import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { filterByPeriod, groupByMonth, countLensTypes, formatCurrency, calcMetrics, STATUS_ORDER } from '../../utils/helpers';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const PERIODS = [
    { key: '30d', label: '30 dias' },
    { key: '3m', label: '3 meses' },
    { key: '6m', label: '6 meses' },
    { key: '1y', label: '1 ano' },
    { key: 'all', label: 'Tudo' },
];

const STATUS_CHART_COLORS = {
    'Novo': '#dc2626',
    'Em Produção': '#ca8a04',
    'Laboratório': '#2563eb', // Left as legacy fallback if needed
    'Pronto': '#9333ea',
    'Entregue': '#16a34a',
    'Cancelado': '#6b7280'
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function CustomTooltip({ active, payload, label, prefix = '' }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm z-50">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('pt-BR', p.name === 'Faturamento' ? { minimumFractionDigits: 2 } : {}) : p.value}
                </p>
            ))}
        </div>
    );
}

export default function CRMPage() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;

    const [allClients, setAllClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('all');

    useEffect(() => {
        if (!unitId) return;
        async function fetchClients() {
            setLoading(true);
            const data = await clientService.getClients(unitId);
            setAllClients(data);
            setLoading(false);
        }
        fetchClients();
    }, [unitId]);

    const clients = filterByPeriod(allClients, period, 'created_at');
    const metrics = calcMetrics(clients);
    const monthlyData = groupByMonth(clients, 'created_at');
    const lensTypes = countLensTypes(clients, 'lens_type');

    const statusPieData = STATUS_ORDER
        .map(s => ({ name: s, value: metrics.byStatus[s] || 0 }))
        .filter(d => d.value > 0);

    return (
        <UnitLayout slug={slug}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">CRM — Visão Estratégica</h1>
                <p className="text-gray-500 text-sm mt-1">Análise de performance e tendências</p>
            </div>

            {/* Period filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${period === p.key
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Calculando métricas...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Atendimentos', value: metrics.total, icon: '👥', gradient: 'from-indigo-500 to-indigo-600' },
                            { label: 'Faturamento Total', value: formatCurrency(metrics.faturamento), icon: '💰', gradient: 'from-green-500 to-emerald-600' },
                            { label: 'Ticket Médio', value: formatCurrency(metrics.ticketMedio), icon: '📊', gradient: 'from-purple-500 to-purple-600' },
                            { label: 'Pedidos Entregues', value: metrics.entregues, icon: '✅', gradient: 'from-blue-500 to-cyan-500' },
                        ].map(card => (
                            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-xl flex-shrink-0 text-white shadow-sm`}>
                                    {card.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{card.label}</p>
                                    <p className="text-lg font-bold text-gray-900 leading-tight truncate">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* Faturamento Mensal */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wide">Faturamento Mensal (R$)</h2>
                            {monthlyData.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-gray-300 text-sm">Sem dados para o período</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthlyData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={50} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip prefix="R$" />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="faturamento" name="Faturamento" fill="url(#gradientBlue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                        <defs>
                                            <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Status Pie */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wide">Pedidos por Status</h2>
                            {statusPieData.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-gray-300 text-sm">Sem dados para o período</div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-4 h-52">
                                    <ResponsiveContainer width="60%" height="100%">
                                        <PieChart>
                                            <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
                                                {statusPieData.map((entry, i) => (
                                                    <Cell key={i} fill={STATUS_CHART_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2">
                                        {statusPieData.map((entry, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: STATUS_CHART_COLORS[entry.name] || CHART_COLORS[i] }} />
                                                <span className="text-gray-600 text-xs font-medium">{entry.name}</span>
                                                <span className="font-bold text-gray-800 text-xs ml-auto bg-gray-50 px-2 py-0.5 rounded">{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Lenses */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wide">Lentes Mais Vendidas</h2>
                            {lensTypes.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-gray-300 text-sm">Sem dados para o período</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={lensTypes.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={120} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" name="Pedidos" fill="url(#gradientPurple)" radius={[0, 6, 6, 0]} maxBarSize={20} />
                                        <defs>
                                            <linearGradient id="gradientPurple" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Atendimentos por mês */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wide">Atendimentos por Mês</h2>
                            {monthlyData.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-gray-300 text-sm">Sem dados para o período</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthlyData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={30} allowDecimals={false} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="atendimentos" name="Atendimentos" fill="url(#gradientGreen)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                        <defs>
                                            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#059669" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}
        </UnitLayout>
    );
}
