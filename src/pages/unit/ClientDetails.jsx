import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { getStatusStyle, formatCurrency, formatDate, STATUS_ORDER } from '../../utils/helpers';
import { ArrowLeft, Edit2, Trash2, Clock, User, Eye, CreditCard, FileText, Download } from 'lucide-react';

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
            <span className="text-sm text-gray-800 font-medium">{value || '—'}</span>
        </div>
    );
}

function PrescTable({ data, title }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-xs text-gray-400">
                        <th className="text-left pb-1.5 pr-4"></th>
                        <th className="pb-1.5 px-2 text-center">ESF</th>
                        <th className="pb-1.5 px-2 text-center">CIL</th>
                        <th className="pb-1.5 px-2 text-center">EIXO</th>
                        <th className="pb-1.5 px-2 text-center">ADD</th>
                    </tr>
                </thead>
                <tbody>
                    {['OD', 'OE'].map(eye => {
                        const prefix = eye.toLowerCase(); // 'od' or 'oe'
                        return (
                            <tr key={eye} className="border-t border-gray-50">
                                <td className="py-1.5 pr-4 font-semibold text-gray-600 text-xs">{eye}</td>
                                {['esf', 'cil', 'eixo', 'add'].map(f => {
                                    const val = data ? data[`${prefix}_${f}`] : null;
                                    return (
                                        <td key={f} className="py-1.5 px-2 text-center text-gray-800 font-mono text-xs">{val !== null && val !== undefined ? val : '—'}</td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function ClientDetails() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuthStore();

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDelete, setShowDelete] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        async function fetchClient() {
            setLoading(true);
            const data = await clientService.getClientById(id);
            setClient(data);
            setLoading(false);
        }
        fetchClient();
    }, [id]);

    if (loading) return <UnitLayout slug={slug}><div className="text-center py-24 text-gray-500">Carregando dados do cliente...</div></UnitLayout>;

    if (!client) {
        return (
            <UnitLayout slug={slug}>
                <div className="text-center py-24">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Cliente não encontrado</h2>
                    <Link to={`/${slug}/clientes`} className="text-indigo-600 hover:underline text-sm">Voltar para Clientes</Link>
                </div>
            </UnitLayout>
        );
    }

    const style = getStatusStyle(client.status);

    async function handleDelete() {
        await clientService.deleteClient(id);
        navigate(`/${slug}/clientes`);
    }

    async function handleStatusChange(newStatus) {
        setUpdatingStatus(true);
        const { success } = await clientService.updateClientStatus(client, newStatus, statusNote, profile?.id);
        if (success) {
            const updated = await clientService.getClientById(id);
            setClient(updated);
            setChangingStatus(false);
            setStatusNote('');
        } else {
            alert('Erro ao atualizar status');
        }
        setUpdatingStatus(false);
    }

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-4xl mx-auto pb-10">
                <Link to={`/${slug}/clientes`} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-5 transition-colors">
                    <ArrowLeft size={16} /> Voltar para Clientes
                </Link>

                {/* Header */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                            {client.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                <span className="text-sm font-mono text-gray-500">#{client.id.split('-')[0]}</span>
                                <span
                                    className="text-xs px-3 py-1.5 rounded-full font-medium border cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ background: style.bg, color: style.color, borderColor: style.border }}
                                    onClick={() => setChangingStatus(true)}
                                    title="Clique para alterar status"
                                >
                                    {client.status} ↓
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/${slug}/clientes/${id}/editar`}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                            >
                                <Edit2 size={14} /> Editar
                            </Link>
                            <button
                                onClick={() => setShowDelete(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                            >
                                <Trash2 size={14} /> Excluir
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status change panel */}
                {changingStatus && (
                    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 mb-5 animate-fadeIn">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Alterar Status</h3>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Observação sobre a mudança (opcional)"
                                value={statusNote}
                                onChange={e => setStatusNote(e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {STATUS_ORDER.map(s => {
                                const st = getStatusStyle(s);
                                return (
                                    <button
                                        key={s}
                                        disabled={updatingStatus || client.status === s}
                                        onClick={() => handleStatusChange(s)}
                                        className="px-3 py-1.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-50"
                                        style={client.status === s ? { background: st.color, color: 'white', borderColor: st.color } : { background: st.bg, color: st.color, borderColor: st.border }}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                            <button onClick={() => setChangingStatus(false)} className="px-3 py-1.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Identificação */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <User size={16} className="text-indigo-500" />
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Identificação do Pedido</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <InfoRow label="Data" value={new Date(client.created_at).toLocaleDateString()} />
                                <InfoRow label="Laboratório" value={client.laboratory} />
                                <InfoRow label="Médico" value={client.doctor_name} />
                                <InfoRow label="Vendedor" value={client.seller_name} />
                                <InfoRow label="Tipo de Lente" value={client.lens_type} />
                                <InfoRow label="OS/Ordem" value={client.hp} />
                            </div>
                        </div>

                        {/* Prescrição */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Eye size={16} className="text-indigo-500" />
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Prescrição Oftálmica</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <PrescTable data={client} title="Prescrição Receita" />
                            </div>
                        </div>

                        {/* Dados pessoais */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={16} className="text-indigo-500" />
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Dados Pessoais</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <InfoRow label="CPF" value={client.cpf} />
                                <InfoRow label="Telefone" value={client.phone} />
                                <InfoRow label="E-mail" value={client.email} />
                                <InfoRow label="Nascimento" value={formatDate(client.birth_date)} />
                                <InfoRow label="Cidade" value={client.city} />
                                <InfoRow label="CEP" value={client.zip_code} />
                                <div className="col-span-2 sm:col-span-3"><InfoRow label="Endereço" value={client.address} /></div>
                            </div>
                        </div>

                        {/* Armação e observações */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Informações Adicionais</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Armação (Marca / Modelo)</p>
                                    <p className="text-sm text-gray-800">{client.frame_brand || ''} {client.frame_model || ''}</p>
                                    {(!client.frame_brand && !client.frame_model) && <p className="text-sm text-gray-400">—</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</p>
                                    <p className="text-sm text-gray-800">{client.notes || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-5">
                        {/* Pagamento */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard size={16} className="text-green-500" />
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Pagamento</h2>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                                    <p className="text-xs text-green-600 mb-0.5">Valor Total</p>
                                    <p className="text-2xl font-bold text-green-700">{formatCurrency(client.total_value)}</p>
                                </div>
                                <InfoRow label="Condição" value={client.payment_method} />
                                <div className="pt-2">
                                    <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors">
                                        <Download size={14} /> Emitir Comprovante
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Histórico de status */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-purple-500" />
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Histórico</h2>
                            </div>
                            <div className="space-y-4">
                                {(client.status_history || []).map((h, i) => {
                                    const hs = getStatusStyle(h.status);
                                    return (
                                        <div key={h.id} className="flex flex-col gap-1 relative">
                                            {i !== client.status_history.length - 1 && (
                                                <div className="absolute top-6 bottom-[-16px] left-1.5 w-px bg-gray-200" />
                                            )}
                                            <div className="flex items-start gap-3 relative z-10">
                                                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 border-white shadow-sm" style={{ background: hs.color }} />
                                                <div className="flex-1 min-w-0 bg-gray-50/50 rounded-lg p-2 border border-gray-100">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-xs font-bold" style={{ color: hs.color }}>{h.status}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(h.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    {h.notes && <p className="text-xs text-gray-600 mt-1">{h.notes}</p>}
                                                    {h.changed_by_profile && (
                                                        <p className="text-[10px] text-gray-400 mt-1.5 italic">Por: {h.changed_by_profile.role}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete modal */}
            {showDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeIn">
                        <div className="text-4xl text-center mb-3">⚠️</div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Excluir Cliente</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Esta ação não pode ser desfeita. Deseja excluir <strong>{client.name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </UnitLayout>
    );
}
