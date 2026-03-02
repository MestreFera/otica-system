import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { reportService } from '../../services/reportService';
import { useToastStore } from '../../components/ui/Toast';
import { SkeletonMetric, SkeletonCard } from '../../components/ui/SkeletonLoader';
import {
    Scan, LogOut, Building2, Users, DollarSign, TrendingUp, AlertTriangle,
    Zap, Package, FileText, Download, ChevronRight, Trophy, Clock, CheckCircle, Eye,
    ArrowUpRight
} from 'lucide-react';

function fmt(v) {
    return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function MasterDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const data = await unitService.getUnitSummaries();
        setUnits(data || []);
        setLoading(false);
    }

    const totalClients = units.reduce((s, u) => s + Number(u.total_clients || 0), 0);
    const totalRevenue = units.reduce((s, u) => s + Number(u.total_revenue || 0), 0);
    const totalPaid = units.reduce((s, u) => s + Number(u.total_paid || 0), 0);
    const readyOrders = units.reduce((s, u) => s + Number(u.status_ready || 0), 0);
    const delivered = units.reduce((s, u) => s + Number(u.status_delivered || 0), 0);
    const deliveryRate = totalClients > 0 ? Math.round(delivered / totalClients * 100) : 0;
    const inProduction = units.reduce((s, u) => s + Number(u.status_production || 0), 0);
    const highPending = units.filter(u => Number(u.total_revenue || 0) - Number(u.total_paid || 0) > 1000);
    const ranked = [...units].filter(u => u.active).sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0));

    const metrics = [
        { label: 'Faturamento Total', value: fmt(totalRevenue), icon: DollarSign, color: '#d4af37' },
        { label: 'Clientes Ativos', value: totalClients, icon: Users, color: '#3b82f6' },
        { label: 'Prontos p/ Retirada', value: readyOrders, icon: Package, color: '#a78bfa' },
        { label: 'Taxa de Entrega', value: `${deliveryRate}%`, icon: CheckCircle, color: '#22c55e' },
    ];

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            {/* ── Header ── */}
            <header className="sticky top-0 z-20 px-5 lg:px-8 py-3.5 flex items-center gap-4 backdrop-blur-xl"
                style={{ background: 'rgba(11, 11, 15, 0.85)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="logo-icon"><Scan size={18} className="text-[#0B0B0F]" /></div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Painel Master</p>
                    </div>
                </div>

                <nav className="flex items-center gap-1 ml-6">
                    <Link to="/master/dashboard" className="nav-item active text-xs px-3.5 py-2">
                        <TrendingUp size={14} /> Dashboard
                    </Link>
                    <Link to="/master/unidades" className="nav-item text-xs px-3.5 py-2">
                        <Building2 size={14} /> Unidades
                    </Link>
                    <Link to="/master/automations" className="nav-item text-xs px-3.5 py-2">
                        <Zap size={14} /> Automações
                    </Link>
                </nav>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    <button onClick={() => { reportService.exportMasterReportCSV(units); addToast({ type: 'success', message: 'CSV exportado!' }); }}
                        className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2">
                        <Download size={13} /> CSV
                    </button>
                    <button onClick={() => { reportService.generateMasterReportPDF(units); addToast({ type: 'success', message: 'PDF gerado!' }); }}
                        className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2">
                        <FileText size={13} /> PDF
                    </button>
                    <button onClick={async () => { await logout(); navigate('/master/login'); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-all"
                        style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}>
                        <LogOut size={15} /> Sair
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <div className="p-5 lg:p-8 max-w-[1440px] mx-auto animate-fadeIn">
                {loading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonMetric key={i} />)}</div>
                        <SkeletonCard /><SkeletonCard />
                    </div>
                ) : (
                    <>
                        {/* ── Metric cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                            {metrics.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="metric-card group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                            <Icon size={18} style={{ color }} />
                                        </div>
                                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Ranking + Revenue bars ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                            {/* Ranking */}
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <Trophy size={14} style={{ color: 'var(--accent)' }} />
                                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Ranking de Unidades</h2>
                                </div>
                                <div className="space-y-2.5">
                                    {ranked.map((u, i) => {
                                        const rev = Number(u.total_revenue || 0);
                                        const maxRev = Number(ranked[0]?.total_revenue || 1);
                                        return (
                                            <Link key={u.id} to={`/${u.slug}/dashboard`}
                                                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : ''}`}
                                                    style={i < 3 ? { background: i === 0 ? 'rgba(245,158,11,0.12)' : i === 1 ? 'rgba(148,163,184,0.12)' : 'rgba(180,130,50,0.12)' } : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white/70 group-hover:text-white truncate">{u.name}</p>
                                                    <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${(rev / maxRev) * 100}%`, background: 'var(--accent-gradient)' }} />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{fmt(rev)}</span>
                                            </Link>
                                        );
                                    })}
                                    {ranked.length === 0 && <p className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>Nenhuma unidade ativa</p>}
                                </div>
                            </div>

                            {/* Revenue bar chart using CSS */}
                            <div className="glass-card p-6">
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--accent)' }}>Faturamento por Unidade</h2>
                                <div className="space-y-3">
                                    {ranked.map(u => {
                                        const rev = Number(u.total_revenue || 0);
                                        const maxRev = Number(ranked[0]?.total_revenue || 1);
                                        const pct = (rev / maxRev) * 100;
                                        return (
                                            <div key={u.id}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{u.name}</span>
                                                    <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{fmt(rev)}</span>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'var(--accent-gradient)' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Alerts ── */}
                        {(inProduction > 0 || highPending.length > 0) && (
                            <div className="glass-card p-6 mb-8">
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
                                    style={{ color: '#f59e0b' }}>
                                    <AlertTriangle size={14} /> Atenção Necessária
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {inProduction > 0 && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                                            <Clock size={18} className="text-amber-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{inProduction} pedidos em produção</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Verifique prazos de entrega</p>
                                            </div>
                                        </div>
                                    )}
                                    {highPending.map(u => (
                                        <div key={u.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                                            <DollarSign size={18} className="text-red-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{u.name}</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pendente: {fmt(Number(u.total_revenue || 0) - Number(u.total_paid || 0))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Units grid ── */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                    style={{ color: 'var(--accent)' }}>
                                    <Building2 size={14} /> Unidades ({units.length})
                                </h2>
                                <Link to="/master/unidades/nova" className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2">
                                    + Nova Unidade
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {units.map(u => (
                                    <Link key={u.id} to={`/${u.slug}/dashboard`}
                                        className="glass-card p-5 transition-all group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                                                style={u.active
                                                    ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }
                                                    : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                                                {u.name?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white group-hover:text-[var(--accent)] truncate transition-colors">{u.name}</p>
                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{u.city} {!u.active && '· Inativa'}</p>
                                            </div>
                                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { l: 'Clientes', v: u.total_clients || 0 },
                                                { l: 'Faturamento', v: fmt(u.total_revenue || 0) },
                                                { l: 'Pendente', v: fmt(Number(u.total_revenue || 0) - Number(u.total_paid || 0)) },
                                            ].map(m => (
                                                <div key={m.l} className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                                    <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{m.l}</p>
                                                    <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{m.v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
