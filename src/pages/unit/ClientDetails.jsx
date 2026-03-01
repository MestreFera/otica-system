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
const STATUS_COLORS = { 'Novo': 'text-blue-400 bg-blue-400/15 border-blue-400/25', 'Em Produção': 'text-amber-400 bg-amber-400/12 border-amber-400/20', 'Pronto': 'text-purple-400 bg-purple-400/15 border-purple-400/25', 'Entregue': 'text-emerald-400 bg-emerald-400/15 border-emerald-400/25', 'Cancelado': 'text-red-400 bg-red-400/15 border-red-400/25' };

export default function ClientDetails() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const addToast = useToastStore(s => s.addToast);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [undoTimer, setUndoTimer] = useState(null);

    useEffect(() => { loadClient(); }, [id]);

    async function loadClient() {
        setLoading(true);
        const data = await clientService.getClientById(id);
        setClient(data);
        setLoading(false);
    }

    async function handleStatusChange(newStatus) {
        const oldStatus = client.status;
        // Optimistic update
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

    // Alerts
    const daysSinceCreation = client ? Math.floor((Date.now() - new Date(client.created_at)) / 86400000) : 0;
    const pendingPayment = client ? Number(client.total_value || 0) - Number(client.paid_value || 0) : 0;
    const inProductionTooLong = client?.status === 'Em Produção' && daysSinceCreation > 7;

    if (loading) return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" /></div>
        </UnitLayout>
    );

    if (!client) return (
        <UnitLayout slug={slug}><div className="text-center py-16 text-white/30"><p className="text-5xl mb-4">🔍</p><p>Atendimento não encontrado</p></div></UnitLayout>
    );

    const currentStatusIdx = STATUS_OPTIONS.indexOf(client.status);

    return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/30 hover:text-cyan-400 text-sm"><ArrowLeft size={16} /> Voltar</button>
                <div className="flex items-center gap-2">
                    <button onClick={openWhatsApp} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-400 border border-emerald-400/20 rounded-xl hover:bg-emerald-400/10 transition-all"><MessageCircle size={14} /> WhatsApp</button>
                    <button onClick={generatePDF} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-400 border border-cyan-400/20 rounded-xl hover:bg-cyan-400/10 transition-all"><FileText size={14} /> PDF</button>
                    <button onClick={copyPublicLink} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-400 border border-purple-400/20 rounded-xl hover:bg-purple-400/10 transition-all"><Share2 size={14} /> Link</button>
                    <Link to={`/${slug}/clientes/${id}/editar`} className="flex items-center gap-1.5 btn-primary text-xs px-3 py-2"><Edit3 size={14} /> Editar</Link>
                    <button onClick={() => setDeleteModal(true)} className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><Trash2 size={14} /></button>
                </div>
            </div>

            {/* Alerts */}
            {(inProductionTooLong || pendingPayment > 0) && (
                <div className="flex flex-wrap gap-3 mb-6">
                    {inProductionTooLong && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">🔴 Em produção há {daysSinceCreation} dias</div>}
                    {pendingPayment > 0 && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">🟡 Pagamento pendente: R$ {pendingPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>}
                    {!inProductionTooLong && pendingPayment <= 0 && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">🟢 Tudo em dia</div>}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient + Status */}
                    <div className="glass-card glow-border p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-white text-xl font-bold">
                                {(client.client_name || client.name)?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{client.client_name || client.name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-white/30">{client.phone || 'Sem telefone'}</span>
                                    {client.doctor_name && <span className="text-xs text-white/20 flex items-center gap-1"><Stethoscope size={10} /> {client.doctor_name}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Status do Pedido</h3>
                            <div className="flex gap-2 flex-wrap">
                                {STATUS_OPTIONS.map((s, i) => {
                                    const Icon = STATUS_ICONS[s];
                                    return (
                                        <button key={s} onClick={() => handleStatusChange(s)} disabled={updatingStatus}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border disabled:opacity-50 ${client.status === s ? STATUS_COLORS[s] : i <= currentStatusIdx ? 'bg-white/[0.03] text-white/40 border-white/[0.06]' : 'text-white/20 border-white/[0.04] hover:bg-white/[0.04]'}`}>
                                            <Icon size={12} /> {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Prescription */}
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3 flex items-center gap-1"><Eye size={12} /> Receita</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[{ label: 'OD — Direito', data: [['ESF', client.od_esf], ['CIL', client.od_cil], ['EIXO', client.od_eixo], ['DNP', client.od_dnp], ['ADD', client.od_add]] },
                                { label: 'OE — Esquerdo', data: [['ESF', client.oe_esf], ['CIL', client.oe_cil], ['EIXO', client.oe_eixo], ['DNP', client.oe_dnp], ['ADD', client.oe_add]] }
                                ].map(eye => (
                                    <div key={eye.label} className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
                                        <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest mb-2">{eye.label}</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {eye.data.map(([l, v]) => <div key={l}><p className="text-[9px] text-white/15 uppercase">{l}</p><p className="text-sm font-semibold text-white/70">{v || '—'}</p></div>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-4">Pedido</h3>
                        <div className="space-y-3">
                            {[['Lente', client.lens_type], ['Material', client.lens_material], ['Armação', [client.frame_brand, client.frame_model].filter(Boolean).join(' ')], ['Lab', client.lab], ['Valor', client.total_value ? `R$ ${Number(client.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null], ['Pago', client.paid_value ? `R$ ${Number(client.paid_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null]].map(([l, v]) => (
                                <div key={l} className="flex justify-between py-2 border-b border-white/[0.03] last:border-0"><span className="text-xs text-white/25">{l}</span><span className="text-sm font-semibold text-white/70">{v || '—'}</span></div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-4 flex items-center gap-1"><Clock size={12} /> Timeline</h3>
                        {(client.status_history || []).length === 0 ? <p className="text-xs text-white/15 text-center py-4">Sem registros</p> : (
                            <div className="space-y-4">
                                {[...(client.status_history || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((h, i) => {
                                    const Icon = STATUS_ICONS[h.new_status] || Clock;
                                    return (
                                        <div key={i} className="flex items-start gap-3 relative">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[h.new_status] || 'bg-white/5 text-white/30 border-white/10'} border`}>
                                                <Icon size={12} />
                                            </div>
                                            {i < (client.status_history?.length || 0) - 1 && <div className="absolute left-[13px] top-8 w-0.5 h-[calc(100%-2px)] bg-white/[0.04]" />}
                                            <div>
                                                <p className="text-xs font-semibold text-white/60">{h.new_status}</p>
                                                {h.note && <p className="text-[10px] text-white/25 italic">"{h.note}"</p>}
                                                <p className="text-[10px] text-white/15">{new Date(h.created_at).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {client.notes && (
                        <div className="glass-card p-6"><h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Observações</h3><p className="text-sm text-white/40 leading-relaxed">{client.notes}</p></div>
                    )}
                </div>
            </div>

            <ConfirmModal open={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title="Excluir Atendimento" message={`Tem certeza que deseja excluir o atendimento de "${client.client_name || client.name}"? Esta ação não pode ser desfeita.`} confirmText="Excluir" danger />
        </UnitLayout>
    );
}
