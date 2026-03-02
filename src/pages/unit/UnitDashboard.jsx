import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import { unitService } from '../../services/unitService';
import UnitLayout from '../../components/UnitLayout';
import {
    TrendingUp, Users, ShoppingBag, DollarSign,
    ArrowUpRight, ArrowDownRight, Clock, Eye,
    Package, CheckCircle, Truck, AlertTriangle, Calendar
} from 'lucide-react';

const STATUS_COLORS = {
    'Novo': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
    'Em Produção': { bg: 'rgba(245, 158, 11, 0.08)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.18)' },
    'Pronto': { bg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' },
    'Entregue': { bg: 'rgba(34, 197, 94, 0.08)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.18)' },
    'Cancelado': { bg: 'rgba(239, 68, 68, 0.08)', text: '#f87171', border: 'rgba(239, 68, 68, 0.18)' },
};

const STATUS_ICONS = { 'Novo': Package, 'Em Produção': Clock, 'Pronto': CheckCircle, 'Entregue': Truck, 'Cancelado': AlertTriangle };

function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Mini bar chart (pure CSS) ──────────────────────────────────────────────
function MiniChart({ data }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-1 h-[80px]">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                            height: `${Math.max((d.value / max) * 100, 4)}%`,
                            background: i === data.length - 1
                                ? 'linear-gradient(180deg, #d4af37, rgba(212,175,55,0.3))'
                                : 'rgba(212, 175, 55, 0.15)',
                            minHeight: '3px',
                        }}
                    />
                    <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}

export default function UnitDashboard() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!unitId) return;
        async function load() {
            setLoading(true);
            const [data, notifs] = await Promise.all([
                clientService.getClients(unitId),
                unitService.getNotifications(unitId),
            ]);
            setClients(data || []);
            setNotifications(notifs || []);
            setLoading(false);
        }
        load();
    }, [unitId]);

    // ── Computed metrics ─────────────────────────────────────────────────────
    const total = clients.length;
    const revenue = clients.reduce((s, c) => s + Number(c.total_value || 0), 0);
    const paid = clients.reduce((s, c) => s + Number(c.paid_value || 0), 0);
    const pending = clients.filter(c => !['Entregue', 'Cancelado'].includes(c.status)).length;
    const delivered = clients.filter(c => c.status === 'Entregue').length;
    const ticketMedio = total > 0 ? revenue / total : 0;

    // Recent clients (last 8)
    const recent = [...clients].slice(0, 8);

    // Status distribution
    const statusCounts = {};
    ['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'].forEach(s => {
        statusCounts[s] = clients.filter(c => c.status === s).length;
    });

    // Monthly data for chart (last 6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.toLocaleDateString('pt-BR', { month: 'short' });
        const yy = d.getFullYear();
        const mm = d.getMonth();
        const count = clients.filter(c => {
            const cd = new Date(c.created_at);
            return cd.getFullYear() === yy && cd.getMonth() === mm;
        }).length;
        chartData.push({ label: month, value: count });
    }

    // ── Metrics cards config ───────────────────────────────────────────────
    const metrics = [
        { label: 'Total Clientes', value: total, icon: Users, color: '#d4af37', sub: `${pending} em andamento` },
        { label: 'Receita Total', value: fmt(revenue), icon: DollarSign, color: '#22c55e', sub: `${fmt(paid)} recebido` },
        { label: 'Ticket Médio', value: fmt(ticketMedio), icon: TrendingUp, color: '#3b82f6', sub: `${total} pedidos` },
        { label: 'Entregues', value: delivered, icon: Truck, color: '#a78bfa', sub: total > 0 ? `${Math.round((delivered / total) * 100)}% do total` : '—' },
    ];

    if (loading) return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
            </div>
        </UnitLayout>
    );

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[1440px] mx-auto">
                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Bem-vindo, <span style={{ color: 'var(--accent)' }}>{profile?.units?.name || slug}</span>
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <Link to={`/${slug}/clientes/novo`}
                        className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                        <ShoppingBag size={16} /> Novo Atendimento
                    </Link>
                </div>

                {/* ── Metric Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
                    {metrics.map(({ label, value, icon: Icon, color, sub }) => (
                        <div key={label} className="metric-card group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                    <Icon size={18} style={{ color }} />
                                </div>
                                <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                            </div>
                            <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="text-[11px] mt-2" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Main grid: chart + status ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Chart */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-sm font-semibold text-white">Atendimentos por Mês</h2>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Últimos 6 meses</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                                <Calendar size={12} /> Mensal
                            </div>
                        </div>
                        <MiniChart data={chartData} />
                    </div>

                    {/* Status distribution */}
                    <div className="glass-card p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Status dos Pedidos</h2>
                        <div className="space-y-3">
                            {Object.entries(statusCounts).map(([status, count]) => {
                                const pct = total > 0 ? (count / total) * 100 : 0;
                                const c = STATUS_COLORS[status] || STATUS_COLORS['Novo'];
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium" style={{ color: c.text }}>{status}</span>
                                            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{count}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c.text, opacity: 0.7 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Recent Sales Table + Activity ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent sales */}
                    <div className="lg:col-span-2 glass-card overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h2 className="text-sm font-semibold text-white">Últimos Atendimentos</h2>
                            <Link to={`/${slug}/clientes`} className="text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: 'var(--accent)' }}>
                                Ver todos <ArrowUpRight size={12} />
                            </Link>
                        </div>
                        {recent.length === 0 ? (
                            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                <Users size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhum atendimento ainda</p>
                            </div>
                        ) : (
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Status</th>
                                        <th>Valor</th>
                                        <th className="hidden md:table-cell">Data</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map(c => {
                                        const sc = STATUS_COLORS[c.status] || STATUS_COLORS['Novo'];
                                        const Icon = STATUS_ICONS[c.status] || Package;
                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}>
                                                            {(c.name || '?')[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white leading-tight">{c.name}</p>
                                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                                                        <Icon size={10} /> {c.status}
                                                    </span>
                                                </td>
                                                <td className="font-semibold" style={{ color: 'var(--accent)' }}>
                                                    {c.total_value ? fmt(c.total_value) : '—'}
                                                </td>
                                                <td className="hidden md:table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td>
                                                    <Link to={`/${slug}/clientes/${c.id}`} className="p-1.5 rounded-lg inline-flex transition-all" style={{ color: 'var(--text-muted)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                                                        <Eye size={15} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Activity feed + notifications */}
                    <div className="glass-card p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Atividade Recente</h2>

                        {notifications.length === 0 && clients.length === 0 ? (
                            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Sem atividades recentes</p>
                        ) : (
                            <div className="space-y-4">
                                {/* Notifications */}
                                {notifications.slice(0, 5).map(n => (
                                    <div key={n.id} className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-dim)' }}>
                                            <AlertTriangle size={12} style={{ color: 'var(--accent)' }} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-white leading-tight">{n.title}</p>
                                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Recent client activity */}
                                {clients.slice(0, 5 - Math.min(notifications.length, 5)).map(c => {
                                    const sc = STATUS_COLORS[c.status] || STATUS_COLORS['Novo'];
                                    return (
                                        <div key={c.id} className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                                                {(() => { const I = STATUS_ICONS[c.status] || Package; return <I size={12} style={{ color: sc.text }} />; })()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-white leading-tight truncate">{c.name}</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                    {c.status} · {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UnitLayout>
    );
}
