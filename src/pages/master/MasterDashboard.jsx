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
        <div className="min-h-screen bg-[#050505] canvas-bg-wrapper text-neutral-300 font-sans selection:bg-[#F97316]/30 selection:text-white flex flex-col overflow-x-hidden">
            <div className="grid-bg"></div>
            <div className="aura-glow"></div>

            {/* ── Header (Floating Glass) ── */}
            <header className="sticky top-4 z-40 mx-4 lg:mx-8 px-6 py-4 flex items-center justify-between rounded-2xl backdrop-blur-2xl border border-white/10 bg-black/60 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-sm bg-[#111] border border-white/10 flex items-center justify-center text-[#F97316]">
                        <Scan size={16} />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#F97316]">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white leading-tight">Master Control Node</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2 flex-1 justify-center sm:justify-start sm:ml-8 font-mono">
                    <Link to="/master/dashboard" className="px-3 py-2 rounded-lg text-xs font-bold transition-all bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#F97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" /> Dashboard
                    </Link>
                    <Link to="/master/unidades" className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-white/[0.02] flex items-center gap-2 transition-all">
                        <Building2 size={14} /> Nodes
                    </Link>
                    <Link to="/master/automations" className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-white/[0.02] flex items-center gap-2 transition-all">
                        <Zap size={14} /> Automations
                    </Link>
                </nav>

                <div className="flex items-center gap-3 font-mono">
                    <button onClick={() => { reportService.exportMasterReportCSV(units); addToast({ type: 'success', message: 'Log Data Exported!' }); }}
                        className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-widest uppercase rounded-sm border border-neutral-800 text-neutral-500 hover:text-white hover:border-white/20 transition-all">
                        <Download size={12} /> CSV
                    </button>
                    <button onClick={() => { reportService.generateMasterReportPDF(units); addToast({ type: 'success', message: 'Report Generated!' }); }}
                        className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-widest uppercase rounded-sm border border-neutral-800 text-neutral-500 hover:text-white hover:border-white/20 transition-all">
                        <FileText size={12} /> PDF
                    </button>
                    <button onClick={async () => { await logout(); navigate('/master/login'); }}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold tracking-widest uppercase rounded-lg border border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-all ml-2">
                        <LogOut size={14} /> Disconnect
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto relative z-10">
                {loading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonMetric key={i} />)}</div>
                        <SkeletonCard /><SkeletonCard />
                    </div>
                ) : (
                    <>
                        {/* ── Metric cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
                            {metrics.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="canvas-card group p-5 rounded-xl border-l-[3px] transition-all hover:-translate-y-1" style={{ borderLeftColor: color }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-md bg-black/40 border border-white/5 flex items-center justify-center shadow-inner">
                                            <Icon size={18} style={{ color }} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                        </div>
                                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F97316]" />
                                    </div>
                                    <p className="text-3xl font-black text-white leading-none mb-2 font-mono tracking-tight">{value}</p>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Ranking + Revenue bars ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Ranking */}
                            <div className="canvas-card p-6 rounded-xl border border-white/5 bg-black/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trophy size={16} className="text-[#F97316]" />
                                    <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#F97316]">Node Performance Ranking</h2>
                                </div>
                                <div className="space-y-3 font-mono">
                                    {ranked.map((u, i) => {
                                        const rev = Number(u.total_revenue || 0);
                                        const maxRev = Number(ranked[0]?.total_revenue || 1);
                                        return (
                                            <Link key={u.id} to={`/${u.slug}/dashboard`}
                                                className="flex items-center gap-4 p-3 rounded-lg transition-all group bg-white/[0.02] border border-white/5 hover:border-[#F97316]/50 hover:bg-[#F97316]/5 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <span className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${i === 0 ? 'text-amber-400 bg-amber-400/10' : i === 1 ? 'text-gray-300 bg-gray-300/10' : i === 2 ? 'text-amber-600 bg-amber-600/10' : 'text-neutral-500 bg-white/5'}`}>
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white/80 group-hover:text-white truncate">{u.name}</p>
                                                    <div className="w-full h-1 rounded-sm mt-2 overflow-hidden bg-black/50 border border-white/5">
                                                        <div className="h-full rounded-sm bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all" style={{ width: `${(rev / maxRev) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-[#F97316]">{fmt(rev)}</span>
                                            </Link>
                                        );
                                    })}
                                    {ranked.length === 0 && <p className="text-center py-8 text-[10px] uppercase font-mono tracking-widest text-neutral-600">No active nodes detected.</p>}
                                </div>
                            </div>

                            {/* Revenue bar chart using CSS */}
                            <div className="canvas-card p-6 rounded-xl border border-white/5 bg-black/40">
                                <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest mb-6 text-[#F97316]">Revenue Distribution Log</h2>
                                <div className="space-y-4 font-mono">
                                    {ranked.map(u => {
                                        const rev = Number(u.total_revenue || 0);
                                        const maxRev = Number(ranked[0]?.total_revenue || 1);
                                        const pct = (rev / maxRev) * 100;
                                        return (
                                            <div key={u.id} className="group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{u.name}</span>
                                                    <span className="text-[10px] font-bold text-[#F97316] opacity-50 group-hover:opacity-100 transition-opacity">{fmt(rev)}</span>
                                                </div>
                                                <div className="h-1.5 rounded-sm overflow-hidden bg-white/5 border border-white/5">
                                                    <div className="h-full rounded-sm transition-all duration-700 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${pct}%` }} />
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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 text-[#F97316]">
                                    <Building2 size={14} /> Active Nodes ({units.length})
                                </h2>
                                <Link to="/master/unidades/nova" className="btn-canvas !py-2 !px-4">
                                    <span className="corner-accent corner-tl"></span><span className="corner-accent corner-tr"></span>
                                    <span className="corner-accent corner-bl"></span><span className="corner-accent corner-br"></span>
                                    <span className="text-[10px] uppercase tracking-widest font-bold">New Deployment</span>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {units.map(u => (
                                    <Link key={u.id} to={`/${u.slug}/dashboard`} className="canvas-card p-5 rounded-xl border border-white/5 relative group block hover:-translate-y-1 transition-all overflow-hidden bg-black/60">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 rounded-bl-[100px] pointer-events-none" />

                                        <div className="flex items-center gap-4 mb-5 relative z-10">
                                            <div className="w-12 h-12 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center font-mono font-bold text-lg text-white group-hover:text-[#F97316] group-hover:border-[#F97316]/30 transition-colors">
                                                {u.name?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0 font-mono">
                                                <p className="text-sm font-bold text-white group-hover:text-[#F97316] truncate transition-colors">{u.name}</p>
                                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                                                    {u.city} {u.active ? <span className="text-emerald-500 ml-2">• ONLINE</span> : <span className="text-red-500 ml-2">• OFFLINE</span>}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="text-neutral-600 group-hover:text-[#F97316] transition-colors" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 relative z-10">
                                            {[
                                                { l: 'Clients', v: u.total_clients || 0, c: '#3b82f6' },
                                                { l: 'Revenue', v: fmt(u.total_revenue || 0), c: '#10b981' },
                                                { l: 'Pending', v: fmt(Number(u.total_revenue || 0) - Number(u.total_paid || 0)), c: '#ef4444' },
                                            ].map(m => (
                                                <div key={m.l} className="rounded-md p-3 text-center bg-black border border-white/5 group-hover:border-white/10 transition-colors">
                                                    <p className="text-[9px] uppercase tracking-widest text-neutral-600 font-mono mb-1">{m.l}</p>
                                                    <p className="text-[11px] font-bold font-mono tracking-tight" style={{ color: m.c }}>{m.v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
