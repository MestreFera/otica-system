import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { clientService } from '../../services/clientService';
import { reportService } from '../../services/reportService';
import { useToastStore } from '../../components/ui/Toast';
import { SkeletonMetric, SkeletonCard } from '../../components/ui/SkeletonLoader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Scan, LogOut, Building2, Users, DollarSign, TrendingUp, AlertTriangle, Zap, Package, FileText, Download, ChevronRight, Trophy, Clock, CheckCircle } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1225]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-4 py-3 text-xs">
            <p className="font-semibold text-white/70 mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>)}
        </div>
    );
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

    // Alerts
    const lowPerformanceUnits = units.filter(u => Number(u.total_clients || 0) < 3 && u.active);
    const highPendingUnits = units.filter(u => Number(u.total_revenue || 0) - Number(u.total_paid || 0) > 1000);

    // Ranked by revenue
    const ranked = [...units].filter(u => u.active).sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0));

    const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            {/* Header */}
            <header className="border-b border-white/[0.04] px-6 py-4 flex items-center gap-4 bg-[#0d1225]/60 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="logo-icon"><Scan size={20} className="text-white" /></div>
                    <div><p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-widest">ÓticaSystem</p><p className="text-sm font-bold text-white">Painel Master</p></div>
                </div>
                <nav className="flex items-center gap-1 ml-8">
                    <Link to="/master/dashboard" className="px-4 py-2 text-sm text-cyan-400 bg-cyan-400/10 rounded-lg font-medium border border-cyan-400/20">Dashboard</Link>
                    <Link to="/master/unidades" className="px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">Unidades</Link>
                    <Link to="/master/automations" className="px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-1.5"><Zap size={14} /> Automações</Link>
                </nav>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    <button onClick={() => { reportService.exportMasterReportCSV(units); addToast({ type: 'success', message: 'CSV exportado!' }); }} className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/30 border border-white/10 rounded-lg hover:text-cyan-400 hover:border-cyan-400/20 transition-all"><Download size={14} /> CSV</button>
                    <button onClick={() => { reportService.generateMasterReportPDF(units); addToast({ type: 'success', message: 'PDF gerado!' }); }} className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/30 border border-white/10 rounded-lg hover:text-cyan-400 hover:border-cyan-400/20 transition-all"><FileText size={14} /> PDF</button>
                    <button onClick={async () => { await logout(); navigate('/master/login'); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><LogOut size={16} /></button>
                </div>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                {loading ? (
                    <div className="space-y-6"><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonMetric key={i} />)}</div><SkeletonCard /><SkeletonCard /></div>
                ) : (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Faturamento Total', value: fmt(totalRevenue), icon: DollarSign, gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/30' },
                                { label: 'Clientes Ativos', value: totalClients, icon: Users, gradient: 'from-purple-400 to-violet-600', shadow: 'shadow-purple-500/30' },
                                { label: 'Prontos p/ Retirada', value: readyOrders, icon: Package, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/30' },
                                { label: 'Taxa de Entrega', value: `${deliveryRate}%`, icon: CheckCircle, gradient: 'from-emerald-400 to-green-600', shadow: 'shadow-emerald-500/30' },
                            ].map(card => (
                                <div key={card.label} className="metric-card">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow} mb-3`}>
                                        <card.icon size={20} className="text-white" />
                                    </div>
                                    <p className="text-[10px] text-white/25 uppercase tracking-wider">{card.label}</p>
                                    <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Ranking + Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Ranking */}
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5"><Trophy size={14} /> Ranking de Unidades</h2>
                                </div>
                                <div className="space-y-3">
                                    {ranked.map((u, i) => {
                                        const rev = Number(u.total_revenue || 0);
                                        const maxRev = Number(ranked[0]?.total_revenue || 1);
                                        return (
                                            <Link key={u.id} to={`/${u.slug}/login`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-cyan-400/15 transition-all group">
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-amber-600/20 text-amber-600' : 'bg-white/5 text-white/20'}`}>{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white/70 group-hover:text-white truncate">{u.name}</p>
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" style={{ width: `${(rev / maxRev) * 100}%` }} /></div>
                                                </div>
                                                <span className="text-sm font-bold text-white/60">{fmt(rev)}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Revenue chart */}
                            <div className="glass-card p-6">
                                <h2 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-5">Faturamento por Unidade</h2>
                                <ResponsiveContainer width="100%" height={ranked.length * 50 + 40}>
                                    <BarChart data={ranked} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} width={100} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="total_revenue" name="Faturamento" fill="url(#gradMaster)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                                        <defs><linearGradient id="gradMaster" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00d4ff" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Alerts */}
                        {(inProduction > 0 || highPendingUnits.length > 0) && (
                            <div className="glass-card p-6 mb-8">
                                <h2 className="text-xs font-bold text-amber-400/60 uppercase tracking-widest mb-4 flex items-center gap-1.5"><AlertTriangle size={14} /> Atenção Necessária</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inProduction > 0 && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                            <Clock size={20} className="text-amber-400 flex-shrink-0" />
                                            <div><p className="text-sm font-medium text-white/60">{inProduction} pedidos em produção</p><p className="text-xs text-white/25">Verifique prazos de entrega</p></div>
                                        </div>
                                    )}
                                    {highPendingUnits.map(u => (
                                        <div key={u.id} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                            <DollarSign size={20} className="text-red-400 flex-shrink-0" />
                                            <div><p className="text-sm font-medium text-white/60">{u.name}</p><p className="text-xs text-white/25">Pendente: {fmt(Number(u.total_revenue || 0) - Number(u.total_paid || 0))}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Units grid */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={14} /> Unidades ({units.length})</h2>
                                <Link to="/master/unidades/nova" className="btn-primary text-xs flex items-center gap-1.5">+ Nova Unidade</Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {units.map(u => (
                                    <Link key={u.id} to={`/${u.slug}/login`} className="glass-card p-5 hover:border-cyan-400/20 transition-all group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${u.active ? 'bg-gradient-to-br from-cyan-400/20 to-purple-500/20 text-cyan-400' : 'bg-white/5 text-white/20'}`}>{u.name?.[0]}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white group-hover:text-cyan-400 truncate transition-colors">{u.name}</p>
                                                <p className="text-[10px] text-white/25">{u.city}, {u.state} {!u.active && '· Inativa'}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-white/10 group-hover:text-cyan-400/60" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { l: 'Clientes', v: u.total_clients || 0 },
                                                { l: 'Faturamento', v: fmt(u.total_revenue || 0) },
                                                { l: 'Pendente', v: fmt(Number(u.total_revenue || 0) - Number(u.total_paid || 0)) },
                                            ].map(m => (
                                                <div key={m.l} className="bg-white/[0.02] rounded-lg p-2 text-center">
                                                    <p className="text-[9px] text-white/20 uppercase">{m.l}</p>
                                                    <p className="text-xs font-bold text-white/60 mt-0.5">{m.v}</p>
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
