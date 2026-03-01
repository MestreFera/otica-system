import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { ArrowLeft, Edit3, Clock, User, Eye, Stethoscope } from 'lucide-react';

const STATUS_OPTIONS = ['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];

export default function ClientDetails() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => { loadClient(); }, [id]);

    async function loadClient() {
        setLoading(true);
        const data = await clientService.getClientById(id);
        setClient(data);
        setLoading(false);
    }

    async function handleStatusChange(newStatus) {
        setUpdatingStatus(true);
        await clientService.updateClientStatus(id, newStatus);
        await loadClient();
        setUpdatingStatus(false);
    }

    if (loading) return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        </UnitLayout>
    );

    if (!client) return (
        <UnitLayout slug={slug}>
            <div className="text-center py-16 text-white/30">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg">Atendimento não encontrado</p>
                <Link to={`/${slug}/clientes`} className="text-cyan-400 text-sm mt-3 inline-block hover:text-cyan-300">← Voltar aos clientes</Link>
            </div>
        </UnitLayout>
    );

    const currentStatusIdx = STATUS_OPTIONS.indexOf(client.status);

    return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/30 hover:text-cyan-400 text-sm transition-colors">
                    <ArrowLeft size={16} /> Voltar
                </button>
                <Link to={`/${slug}/clientes/${id}/editar`} className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
                    <Edit3 size={14} /> Editar
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient card */}
                    <div className="glass-card glow-border p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-white text-xl font-bold">
                                {client.client_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{client.client_name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-white/30">{client.phone || 'Sem telefone'}</span>
                                    {client.doctor_name && <span className="text-xs text-white/20 flex items-center gap-1"><Stethoscope size={10} /> {client.doctor_name}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Status pipeline */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Status do Pedido</h3>
                            <div className="flex gap-2 flex-wrap">
                                {STATUS_OPTIONS.map((s, i) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        disabled={updatingStatus}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border disabled:opacity-50 ${client.status === s
                                                ? s === 'Entregue' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                                    : s === 'Cancelado' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                        : 'bg-cyan-400/15 text-cyan-400 border-cyan-400/25 shadow-lg shadow-cyan-500/10'
                                                : i <= currentStatusIdx ? 'bg-white/[0.03] text-white/40 border-white/[0.06]'
                                                    : 'text-white/20 border-white/[0.04] hover:bg-white/[0.04] hover:text-white/40'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prescription */}
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3 flex items-center gap-1"><Eye size={12} /> Receita</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4 space-y-2">
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest">OD — Direito</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[['ESF', client.od_esf], ['CIL', client.od_cil], ['EIXO', client.od_eixo]].map(([l, v]) => (
                                            <div key={l}>
                                                <p className="text-[9px] text-white/15 uppercase">{l}</p>
                                                <p className="text-sm font-semibold text-white/70">{v || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4 space-y-2">
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest">OE — Esquerdo</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[['ESF', client.oe_esf], ['CIL', client.oe_cil], ['EIXO', client.oe_eixo]].map(([l, v]) => (
                                            <div key={l}>
                                                <p className="text-[9px] text-white/15 uppercase">{l}</p>
                                                <p className="text-sm font-semibold text-white/70">{v || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order info */}
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-4">Pedido</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Lente', val: client.lens_type || '—' },
                                { label: 'Lab', val: client.lab || '—' },
                                { label: 'Valor', val: client.total_value ? `R$ ${Number(client.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
                            ].map(x => (
                                <div key={x.label} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
                                    <span className="text-xs text-white/25 uppercase">{x.label}</span>
                                    <span className="text-sm font-semibold text-white/70">{x.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* History */}
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-4 flex items-center gap-1"><Clock size={12} /> Histórico</h3>
                        {(client.status_history || []).length === 0 ? (
                            <p className="text-xs text-white/20 text-center py-4">Sem registros</p>
                        ) : (
                            <div className="space-y-3">
                                {client.status_history.map((h, i) => (
                                    <div key={i} className="flex items-start gap-3 relative">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400/40 mt-1.5 flex-shrink-0" />
                                        {i < client.status_history.length - 1 && <div className="absolute left-[3px] top-3 w-0.5 h-full bg-white/[0.04]" />}
                                        <div>
                                            <p className="text-xs font-semibold text-white/60">{h.status}</p>
                                            <p className="text-[10px] text-white/20">{new Date(h.changed_at).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {client.notes && (
                        <div className="glass-card p-6">
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Observações</h3>
                            <p className="text-sm text-white/40 leading-relaxed">{client.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </UnitLayout>
    );
}
