import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
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

const STATUS_COLORS = {
    'Novo': '#f87171', 'Em Produção': '#fbbf24', 'Pronto': '#c084fc', 'Entregue': '#4ade80', 'Cancelado': '#64748b'
};
const CHART_COLORS = ['#00d4ff', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function filterByPeriod(arr, period, dateKey) {
    if (period === 'all') return arr;
    const now = new Date();
    const ms = { '30d': 30, '3m': 90, '6m': 180, '1y': 365 }[period] * 86400000;
    const cutoff = new Date(now - ms);
    return arr.filter(item => new Date(item[dateKey]) >= cutoff);
}

function groupByMonth(arr, dateKey) {
    const map = {};
    arr.forEach(item => {
        const d = new Date(item[dateKey]);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = { label: key, atendimentos: 0, faturamento: 0 };
        map[key].atendimentos++;
        map[key].faturamento += Number(item.total_value || 0);
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
}

function countLensTypes(arr) {
    const map = {};
    arr.forEach(item => { const t = item.lens_type || 'Não informado'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function CustomTooltip({ active, payload, label, prefix = '' }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1225]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-4 py-3 text-xs">
            <p className="font-semibold text-white/70 mb-1">{label}</p>
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
    const total = clients.length;
    const faturamento = clients.reduce((s, c) => s + Number(c.total_value || 0), 0);
    const entregues = clients.filter(c => c.status === 'Entregue').length;
    const ticketMedio = total > 0 ? faturamento / total : 0;

    const monthlyData = groupByMonth(clients, 'created_at');
    const lensTypes = countLensTypes(clients);

    const statusCounts = {};
    clients.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
    const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

    const formatCurrency = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <UnitLayout slug={slug}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">CRM — <span className="text-cyan-400">Visão Estratégica</span></h1>
                <p className="text-white/30 text-sm mt-1">Análise de performance e tendências</p>
            </div>

            {/* Period filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${period === p.key
                            ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/25 shadow-lg shadow-cyan-500/10'
                            : 'text-white/30 border border-white/[0.06] hover:border-cyan-400/20 hover:text-cyan-400/80'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Atendimentos', value: total, icon: '👥', gradient: 'from-cyan-400 to-blue-500' },
                            { label: 'Faturamento Total', value: formatCurrency(faturamento), icon: '💰', gradient: 'from-emerald-400 to-green-600' },
                            { label: 'Ticket Médio', value: formatCurrency(ticketMedio), icon: '📊', gradient: 'from-purple-400 to-violet-600' },
                            { label: 'Pedidos Entregues', value: entregues, icon: '✅', gradient: 'from-blue-400 to-cyan-500' },
                        ].map(card => (
                            <div key={card.label} className="metric-card flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-lg shadow-lg`}>
                                    {card.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider">{card.label}</p>
                                    <p className="text-lg font-bold text-white leading-tight truncate">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* Revenue chart */}
                        <div className="glass-card p-6">
                            <h2 className="text-xs font-bold text-cyan-400/60 mb-5 uppercase tracking-widest">Faturamento Mensal</h2>
                            {monthlyData.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-white/15 text-sm">Sem dados</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={40} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip prefix="R$" />} />
                                        <Bar dataKey="faturamento" name="Faturamento" fill="url(#gradBlue)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                        <defs><linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d4ff" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Status pie */}
                        <div className="glass-card p-6">
                            <h2 className="text-xs font-bold text-cyan-400/60 mb-5 uppercase tracking-widest">Pedidos por Status</h2>
                            {statusPieData.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-white/15 text-sm">Sem dados</div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-4 h-52">
                                    <ResponsiveContainer width="60%" height="100%">
                                        <PieChart>
                                            <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
                                                {statusPieData.map((entry, i) => (
                                                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2">
                                        {statusPieData.map((entry, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLORS[entry.name] || CHART_COLORS[i] }} />
                                                <span className="text-white/40">{entry.name}</span>
                                                <span className="font-bold text-white/60 ml-auto bg-white/5 px-2 py-0.5 rounded">{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lens Types + Monthly Atendimentos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="glass-card p-6">
                            <h2 className="text-xs font-bold text-cyan-400/60 mb-5 uppercase tracking-widest">Lentes Mais Vendidas</h2>
                            {lensTypes.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-white/15 text-sm">Sem dados</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={lensTypes.slice(0, 6)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} width={110} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Pedidos" fill="url(#gradPurple)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                                        <defs><linearGradient id="gradPurple" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#00d4ff" /></linearGradient></defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-xs font-bold text-cyan-400/60 mb-5 uppercase tracking-widest">Atendimentos por Mês</h2>
                            {monthlyData.length === 0 ? (
                                <div className="h-52 flex items-center justify-center text-white/15 text-sm">Sem dados</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} width={30} allowDecimals={false} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="atendimentos" name="Atendimentos" fill="url(#gradGreen)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                        <defs><linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
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
