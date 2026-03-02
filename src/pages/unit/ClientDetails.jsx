import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { reportService } from '../../services/reportService';
import { useToastStore } from '../../components/ui/Toast';
import ConfirmModal from '../../components/ui/ConfirmModal';
import UnitLayout from '../../components/UnitLayout';
import { ArrowLeft, Edit3, Clock, Eye, Stethoscope, MessageCircle, FileText, Share2, Trash2, Package, CheckCircle, Truck, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = ['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];
const STATUS_ICONS = { 'Novo': Package, 'Em Produção': Clock, 'Pronto': CheckCircle, 'Entregue': Truck, 'Cancelado': AlertTriangle };
const STATUS_COLORS = {
    'Novo': { text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.2)' },
    'Em Produção': { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
    'Pronto': { text: '#a78bfa', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.2)' },
    'Entregue': { text: '#4ade80', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
    'Cancelado': { text: '#f87171', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' }
};

export default function ClientDetails() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    useEffect(() => { loadClient(); }, [id]);

    async function loadClient() {
        setLoading(true);
        const data = await clientService.getClientById(id);
        setClient(data);
        setLoading(false);
    }

    async function handleStatusChange(newStatus) {
        const oldStatus = client.status;
        setClient(c => ({ ...c, status: newStatus }));
        setUpdatingStatus(true);
        const result = await clientService.updateClientStatus(client, newStatus);
        setUpdatingStatus(false);

        if (result.success) {
            addToast({
                type: 'success',
                title: `${client.client_name || client.name}`,
                message: `Status alterado para ${newStatus}`,
                duration: 5000,
                undoCallback: async () => {
                    await clientService.updateClientStatus({ ...client, status: newStatus }, oldStatus);
                    loadClient();
                    addToast({ type: 'info', message: 'Status revertido' });
                }
            });
            loadClient();
        } else {
            setClient(c => ({ ...c, status: oldStatus }));
            addToast({ type: 'error', message: 'Erro ao atualizar status' });
        }
    }

    async function handleDelete() {
        await clientService.deleteClient(id);
        addToast({ type: 'success', message: 'Atendimento removido' });
        navigate(`/${slug}/clientes`);
    }

    function openWhatsApp() {
        const phone = client.phone?.replace(/\D/g, '');
        if (!phone) return addToast({ type: 'warning', message: 'Cliente sem telefone' });
        const messages = {
            'Pronto': `Olá ${client.client_name || client.name}! 🎉 Seus óculos estão prontos para retirada. Venha buscar quando puder!`,
            'Entregue': `Olá ${client.client_name || client.name}! Esperamos que esteja gostando dos seus óculos novos. Qualquer ajuste, estamos aqui! 😊`,
            'Em Produção': `Olá ${client.client_name || client.name}! Seu pedido está em produção. Em breve teremos novidades!`,
        };
        const msg = messages[client.status] || `Olá ${client.client_name || client.name}! Entrando em contato referente ao seu pedido.`;
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    function generatePDF() {
        reportService.generatePrescriptionPDF(client, `Ótica ${slug}`);
        addToast({ type: 'success', message: 'PDF gerado!' });
    }

    function copyPublicLink() {
        if (!client.public_token) return addToast({ type: 'warning', message: 'Token não disponível' });
        const url = `${window.location.origin}/status/${client.public_token}`;
        navigator.clipboard.writeText(url);
        addToast({ type: 'success', message: 'Link copiado!' });
    }

    const daysSinceCreation = client ? Math.floor((Date.now() - new Date(client.created_at)) / 86400000) : 0;
    const pendingPayment = client ? Number(client.total_value || 0) - Number(client.paid_value || 0) : 0;
    const inProductionTooLong = client?.status === 'Em Produção' && daysSinceCreation > 7;

    if (loading) return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} /></div>
        </UnitLayout>
    );

    if (!client) return (
        <UnitLayout slug={slug}>
            <div className="text-center py-24 glass-card max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    <Search size={24} />
                </div>
                <p className="text-lg font-bold text-white mb-1">Atendimento não encontrado</p>
                <button onClick={() => navigate(-1)} className="btn-ghost mt-4">Voltar</button>
            </div>
        </UnitLayout>
    );

    const currentStatusIdx = STATUS_OPTIONS.indexOf(client.status);

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[1440px] mx-auto animate-fadeIn">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <button onClick={openWhatsApp} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all" style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}><MessageCircle size={14} /> WhatsApp</button>
                        <button onClick={generatePDF} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all" style={{ color: 'var(--info)', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}><FileText size={14} /> PDF</button>
                        <button onClick={copyPublicLink} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all" style={{ color: 'var(--purple)', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}><Share2 size={14} /> Link</button>
                        <Link to={`/${slug}/clientes/${id}/editar`} className="btn-accent flex items-center gap-1.5 px-3.5 py-2 text-xs uppercase tracking-wider"><Edit3 size={14} /> Editar</Link>
                        <button onClick={() => setDeleteModal(true)} className="p-2 rounded-lg transition-all" style={{ color: 'rgba(239, 68, 68, 0.5)' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.background = 'transparent'; }}><Trash2 size={16} /></button>
                    </div>
                </div>

                {/* Alerts */}
                {(inProductionTooLong || pendingPayment > 0) && (
                    <div className="flex flex-wrap gap-3 mb-8 stagger-children">
                        {inProductionTooLong && <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>🔴 Em produção há {daysSinceCreation} dias</div>}
                        {pendingPayment > 0 && <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>🟡 Faltam R$ {pendingPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6 stagger-children">
                        {/* Patient info */}
                        <div className="glass-card glow-border p-8">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: 'var(--accent-gradient)', color: '#0B0B0F', boxShadow: '0 8px 25px var(--accent-glow)' }}>
                                    {(client.client_name || client.name)?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{client.client_name || client.name}</h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{client.phone || 'S/ telefone'}</span>
                                        {client.doctor_name && <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}><Stethoscope size={12} /> Dr. {client.doctor_name}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--accent)' }}>Status do Pedido</h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {STATUS_OPTIONS.map((s, i) => {
                                        const Icon = STATUS_ICONS[s];
                                        const isActive = client.status === s;
                                        const isPast = i < currentStatusIdx;
                                        const st = STATUS_COLORS[s] || STATUS_COLORS['Novo'];
                                        return (
                                            <button key={s} onClick={() => handleStatusChange(s)} disabled={updatingStatus}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50`}
                                                style={isActive ? { background: st.bg, color: st.text, border: `1px solid ${st.border}`, boxShadow: `0 4px 15px ${st.bg}` }
                                                    : isPast ? { background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }
                                                        : { color: 'rgba(255,255,255,0.2)', border: '1px dashed rgba(255,255,255,0.1)' }}
                                            >
                                                {Icon && <Icon size={14} />} {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Prescription */}
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Eye size={12} /> Prescrição Óptica</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[{ label: 'OD — Olho Direito', data: [['ESF', client.od_esf], ['CIL', client.od_cil], ['EIXO', client.od_eixo], ['DNP', client.od_dnp], ['ADD', client.od_add]] },
                                    { label: 'OE — Olho Esquerdo', data: [['ESF', client.oe_esf], ['CIL', client.oe_cil], ['EIXO', client.oe_eixo], ['DNP', client.oe_dnp], ['ADD', client.oe_add]] }
                                    ].map(eye => (
                                        <div key={eye.label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>{eye.label}</p>
                                            <div className="grid grid-cols-5 gap-2">
                                                {eye.data.map(([l, v]) => (
                                                    <div key={l} className="text-center">
                                                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{l}</p>
                                                        <p className="text-sm font-bold text-white">{v || '—'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 stagger-children" style={{ animationDelay: '100ms' }}>
                        {/* Order Details */}
                        <div className="glass-card p-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--accent)' }}>Detalhes do Pedido</h3>
                            <div className="space-y-4">
                                {[
                                    ['TSO', client.tso], ['HP', client.hp],
                                    ['Lente', client.tipo_lente || client.lens_type],
                                    ['Adição', client.adicao],
                                    ['Material', client.material_lente || client.lens_material],
                                    ['Laboratório', client.laboratorio || client.lab],
                                    ['Armação', [client.frame_brand, client.frame_model, client.info_armacao].filter(Boolean).join(' ')],
                                    ['Total da Venda', client.total_value ? `R$ ${Number(client.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null],
                                    ['Pgto.', client.payment_method],
                                    ['Venc. Boleto', client.boleto_vencimento ? new Date(client.boleto_vencimento).toLocaleDateString() : null],
                                    ['Data Exped.', client.data_expedicao ? new Date(client.data_expedicao).toLocaleDateString() : null]
                                ].map(([l, v]) => (
                                    <div key={l} className="flex justify-between items-end pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{l}</span>
                                        <span className="text-sm font-bold text-white text-right max-w-[60%]">{v || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="glass-card p-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Clock size={12} /> Histórico</h3>
                            {(client.status_history || []).length === 0 ? <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Sem registros</p> : (
                                <div className="space-y-5">
                                    {[...(client.status_history || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((h, i) => {
                                        const Icon = STATUS_ICONS[h.new_status] || Clock;
                                        const st = STATUS_COLORS[h.new_status] || { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'transparent' };
                                        return (
                                            <div key={i} className="flex items-start gap-4 relative">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                                    <Icon size={12} />
                                                </div>
                                                {i < (client.status_history?.length || 0) - 1 && <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%+12px)] bg-white/[0.04]" />}
                                                <div className="pt-1">
                                                    <p className="text-xs font-bold text-white uppercase tracking-wider">{h.new_status}</p>
                                                    {h.note && <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>"{h.note}"</p>}
                                                    <p className="text-[9px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleString('pt-BR')}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {client.notes && (
                            <div className="glass-card p-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--text-muted)' }}>Observações</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{client.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal open={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title="Excluir Atendimento" message={`Tem certeza que deseja excluir o atendimento de "${client.client_name || client.name}"? Esta ação não pode ser desfeita.`} confirmText="Excluir" danger />
        </UnitLayout>
    );
}
