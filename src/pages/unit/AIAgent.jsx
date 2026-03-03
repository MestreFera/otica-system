import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UnitLayout from '../../components/UnitLayout';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import { Bot, UserCheck, PauseCircle, Play, CheckCircle2, Search, Loader2 } from 'lucide-react';

export default function AIAgent() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!profile?.unit_id) return;
        loadClients();
    }, [profile?.unit_id]);

    async function loadClients() {
        setLoading(true);
        const data = await clientService.getClients(profile.unit_id);
        const withIA = data.filter(c => c.status_ia);
        // Order by latest interaction
        withIA.sort((a, b) => new Date(b.ultima_interacao || 0) - new Date(a.ultima_interacao || 0));
        setClients(withIA);
        setLoading(false);
    }

    async function updateStatusIA(clientId, newStatus) {
        // Optimistic update
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, status_ia: newStatus } : c));

        const res = await clientService.updateClient(clientId, { status_ia: newStatus });
        if (!res.success) {
            // Revert on failure
            loadClients();
            alert('Falha ao atualizar status IA: ' + res.error);
        }
    }

    const filtered = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Ativo': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'AtendimentoHumano': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Pausado': return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
            case 'Concluido': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-white/5 text-neutral-400 border-white/10';
        }
    };

    const formatDate = (ds) => {
        if (!ds) return '-';
        return new Date(ds).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[1200px] mx-auto pb-24">

                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Monitoramento IA</h1>
                            <p className="text-sm text-neutral-400 mt-1">Controle de interações e status do agente virtual</p>
                        </div>
                    </div>

                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#F97316]/50 transition-colors text-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-neutral-400 bg-white/[0.02] uppercase font-bold border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Telefone</th>
                                    <th className="px-6 py-4">Status IA</th>
                                    <th className="px-6 py-4">Etapa do Fluxo</th>
                                    <th className="px-6 py-4">Última Interação</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-neutral-500">
                                            <Loader2 size={24} className="mx-auto animate-spin mb-2" />
                                            Carregando clientes...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-neutral-500">
                                            Nenhum cliente em interação com IA no momento.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(client => (
                                        <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 font-bold text-white">{client.name}</td>
                                            <td className="px-6 py-4 text-neutral-400 font-mono">{client.phone || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border tracking-wide uppercase ${getStatusStyle(client.status_ia)}`}>
                                                    {client.status_ia}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-300">
                                                {client.etapa_fluxo || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-400 text-xs">
                                                {formatDate(client.ultima_interacao)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {client.status_ia === 'Ativo' ? (
                                                        <button
                                                            onClick={() => updateStatusIA(client.id, 'AtendimentoHumano')}
                                                            title="Assumir Atendimento"
                                                            className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors border border-orange-500/20"
                                                        >
                                                            <UserCheck size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => updateStatusIA(client.id, 'Ativo')}
                                                            title="Devolver para IA"
                                                            className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors border border-green-500/20"
                                                        >
                                                            <Play size={16} />
                                                        </button>
                                                    )}

                                                    {client.status_ia !== 'Pausado' && (
                                                        <button
                                                            onClick={() => updateStatusIA(client.id, 'Pausado')}
                                                            title="Pausar IA"
                                                            className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:bg-white/10 transition-colors border border-white/10"
                                                        >
                                                            <PauseCircle size={16} />
                                                        </button>
                                                    )}

                                                    {client.status_ia !== 'Concluido' && (
                                                        <button
                                                            onClick={() => updateStatusIA(client.id, 'Concluido')}
                                                            title="Marcar como Concluído"
                                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </UnitLayout>
    );
}
