import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import { goalService } from '../../services/goalService';
import UnitLayout from '../../components/UnitLayout';
import { useToastStore } from '../../components/ui/Toast';
import { SkeletonMetric } from '../../components/ui/SkeletonLoader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, CreditCard, AlertCircle } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0d1225]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-4 py-3 text-xs">
            <p className="font-semibold text-white/70 mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>)}
        </div>
    );
}

export default function FinancialPage() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const unitId = profile?.unit_id;

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [goal, setGoal] = useState(null);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalInput, setGoalInput] = useState('');

    useEffect(() => {
        if (!unitId) return;
        async function load() {
            setLoading(true);
            const [c, g] = await Promise.all([
                clientService.getClients(unitId),
                goalService.getGoal(unitId, new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
            ]);
            setClients(c);
            setGoal(g);
            setLoading(false);
        }
        load();
    }, [unitId]);

    const now = new Date();
    const thisMonth = clients.filter(c => { const d = new Date(c.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const lastMonth = clients.filter(c => { const d = new Date(c.created_at); const lm = new Date(now.getFullYear(), now.getMonth() - 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); });

    const revenue = thisMonth.reduce((s, c) => s + Number(c.total_value || 0), 0);
    const received = thisMonth.reduce((s, c) => s + Number(c.paid_value || 0), 0);
    const pending = revenue - received;
    const lastRevenue = lastMonth.reduce((s, c) => s + Number(c.total_value || 0), 0);
    const revenueChange = lastRevenue ? Math.round((revenue - lastRevenue) / lastRevenue * 100) : 0;
    const ticketMedio = thisMonth.length ? revenue / thisMonth.length : 0;

    const pendingClients = clients.filter(c => Number(c.total_value || 0) > Number(c.paid_value || 0) && c.status !== 'Cancelado').sort((a, b) => (Number(b.total_value) - Number(b.paid_value)) - (Number(a.total_value) - Number(a.paid_value)));

    // Monthly chart data (last 6)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mClients = clients.filter(c => { const cd = new Date(c.created_at); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); });
        monthlyData.push({
            label: d.toLocaleDateString('pt-BR', { month: 'short' }),
            Recebido: mClients.reduce((s, c) => s + Number(c.paid_value || 0), 0),
            Pendente: mClients.reduce((s, c) => s + Math.max(0, Number(c.total_value || 0) - Number(c.paid_value || 0)), 0),
        });
    }

    const goalProgress = goal ? Math.min(100, Math.round(revenue / Number(goal.revenue_goal) * 100)) : 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const projectedRevenue = daysPassed > 0 ? (revenue / daysPassed) * daysInMonth : 0;

    async function handleSaveGoal(e) {
        e.preventDefault();
        const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const { success } = await goalService.upsertGoal(unitId, month, Number(goalInput));
        if (success) {
            addToast({ type: 'success', message: 'Meta salva!' });
            setGoal({ revenue_goal: Number(goalInput) });
            setShowGoalModal(false);
        }
    }

    const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <UnitLayout slug={slug}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Financeiro</h1>
                <p className="text-white/30 text-sm mt-1">{now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>

            {loading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonMetric key={i} />)}</div> : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="metric-card">
                            <div className="flex items-center justify-between mb-2"><DollarSign size={18} className="text-cyan-400" />{revenueChange !== 0 && <span className={`text-xs font-bold ${revenueChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{revenueChange > 0 ? '+' : ''}{revenueChange}%</span>}</div>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Faturamento Mês</p>
                            <p className="text-xl font-bold text-white">{fmt(revenue)}</p>
                        </div>
                        <div className="metric-card">
                            <CreditCard size={18} className="text-emerald-400 mb-2" />
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Recebido</p>
                            <p className="text-xl font-bold text-emerald-400">{fmt(received)}</p>
                        </div>
                        <div className="metric-card">
                            <AlertCircle size={18} className="text-amber-400 mb-2" />
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Pendente</p>
                            <p className="text-xl font-bold text-amber-400">{fmt(pending)}</p>
                        </div>
                        <div className="metric-card">
                            <TrendingUp size={18} className="text-purple-400 mb-2" />
                            <p className="text-[10px] text-white/25 uppercase tracking-wider">Ticket Médio</p>
                            <p className="text-xl font-bold text-white">{fmt(ticketMedio)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Chart */}
                        <div className="lg:col-span-2 glass-card p-6">
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-4">Recebido vs Pendente (6 meses)</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} />
                                    <Bar dataKey="Recebido" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Pendente" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Goal */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest flex items-center gap-1"><Target size={12} /> Meta Mensal</h3>
                                <button onClick={() => { setGoalInput(goal?.revenue_goal || ''); setShowGoalModal(true); }} className="text-xs text-cyan-400 hover:text-cyan-300">{goal ? 'Editar' : 'Definir'}</button>
                            </div>
                            {goal ? (
                                <div>
                                    <div className="flex items-end justify-between mb-2">
                                        <span className="text-2xl font-bold text-white">{goalProgress}%</span>
                                        <span className="text-xs text-white/25">de {fmt(goal.revenue_goal)}</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-3">
                                        <div className={`h-full rounded-full transition-all duration-500 ${goalProgress >= 100 ? 'bg-emerald-400' : goalProgress >= 50 ? 'bg-cyan-400' : 'bg-amber-400'}`} style={{ width: `${goalProgress}%` }} />
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between text-white/30"><span>Atual</span><span>{fmt(revenue)}</span></div>
                                        <div className="flex justify-between text-white/30"><span>Projeção</span><span className={projectedRevenue >= Number(goal.revenue_goal) ? 'text-emerald-400' : 'text-amber-400'}>{fmt(projectedRevenue)}</span></div>
                                        <div className="flex justify-between text-white/30"><span>Faltam</span><span>{fmt(Math.max(0, Number(goal.revenue_goal) - revenue))}</span></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Target size={32} className="mx-auto text-white/10 mb-2" />
                                    <p className="text-sm text-white/20">Nenhuma meta definida</p>
                                    <button onClick={() => setShowGoalModal(true)} className="btn-primary mt-3 text-xs">Definir Meta</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending payments */}
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-4">Clientes com Saldo Pendente ({pendingClients.length})</h3>
                        {pendingClients.length === 0 ? (
                            <p className="text-center py-8 text-white/15 text-sm">🎉 Nenhum saldo pendente!</p>
                        ) : (
                            <div className="space-y-2">
                                {pendingClients.slice(0, 15).map(c => {
                                    const saldo = Number(c.total_value || 0) - Number(c.paid_value || 0);
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-amber-400/15 transition-colors">
                                            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/15 flex items-center justify-center text-amber-400 text-sm font-bold">{(c.client_name || c.name)?.[0]?.toUpperCase()}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white/70">{c.client_name || c.name}</p>
                                                <p className="text-xs text-white/25">Total: {fmt(c.total_value)} · Pago: {fmt(c.paid_value)}</p>
                                            </div>
                                            <span className="text-sm font-bold text-amber-400">{fmt(saldo)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Goal modal */}
            {showGoalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowGoalModal(false)} />
                    <form onSubmit={handleSaveGoal} className="relative glass-card glow-border p-6 w-full max-w-sm animate-fadeIn">
                        <h3 className="text-lg font-bold text-white mb-4">Meta de {now.toLocaleDateString('pt-BR', { month: 'long' })}</h3>
                        <div><label className="text-xs text-cyan-300/60 block mb-1.5">Meta de Faturamento (R$)</label>
                            <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} className="input-futuristic w-full" placeholder="10000" required min="1" step="0.01" />
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button type="button" onClick={() => setShowGoalModal(false)} className="btn-ghost flex-1">Cancelar</button>
                            <button type="submit" className="btn-primary flex-1">Salvar</button>
                        </div>
                    </form>
                </div>
            )}
        </UnitLayout>
    );
}
