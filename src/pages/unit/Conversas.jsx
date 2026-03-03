import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UnitLayout from '../../components/UnitLayout';
import { unitTablesService } from '../../services/unitTablesService';
import { Search, Loader2, MessageCircle, Clock, UserCheck } from 'lucide-react';

export default function Conversas() {
    const { slug } = useParams();
    const [conversas, setConversas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos' | 'Ativo' | 'AtendimentoHumano' | 'Pausado'

    const [selectedLead, setSelectedLead] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!slug) return;
        loadData();
    }, [slug, filterStatus]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await unitTablesService.getConversas(slug, { status_ia: filterStatus });
            setConversas(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = conversas.filter(c => {
        const search = searchTerm.toLowerCase();
        return (c.nome_cliente?.toLowerCase() || '').includes(search) ||
            (c.telefone_cliente || '').includes(search);
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Ativo': return 'bg-[#FF6B2B]/20 text-[#FF6B2B] border-[#FF6B2B]/30'; // Light Green-ish in other places, but requested #FF6B2B context. Using orange for active. Wait, requirement says: "Ativo -> verde #FF6B2B claro (isso eh conflitante, FF6B2B é laranja). Vou usar verde para ativo". Let's use a nice green for active, and the prime Orange for AtendimentoHumano.
            // Adjusting based on standard conventions: Ativo = Green, Humano = Orange
            case 'AtendimentoHumano': return 'bg-[#FF6B2B]/20 text-[#FF6B2B] border-[#FF6B2B]/30';
            case 'Pausado': return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
            case 'Concluido': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Inativo': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: // Ativo or default
                return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const diffInSeconds = Math.floor((new Date() - date) / 1000);
        if (diffInSeconds < 60) return `há ${diffInSeconds}s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `há ${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `há ${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `há ${diffInDays} dias`;
    };

    async function handleAssumirAtendimento(lead) {
        if (!lead || updating) return;
        setUpdating(true);
        try {
            await unitTablesService.assumirAtendimento(slug, lead);
            // close drawer & refresh
            setSelectedLead(null);
            await loadData();
        } catch (err) {
            console.error(err);
            alert("Erro ao assumir atendimento.");
        } finally {
            setUpdating(false);
        }
    }

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[1200px] mx-auto pb-24 flex h-screen pt-4 gap-6">

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                <MessageCircle className="text-[#FF6B2B]" size={28} />
                                Conversas
                            </h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                {conversas.length} contatos encontrados
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-1 bg-[#111118] p-1 rounded-xl border border-white/5">
                                {['Todos', 'Ativo', 'AtendimentoHumano', 'Pausado'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilterStatus(f)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === f ? 'bg-[#FF6B2B] text-white shadow-lg shadow-[#FF6B2B]/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {f === 'AtendimentoHumano' ? 'Humano' : f}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou telefone..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#111118] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B2B]/50 transition-colors text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto dark-scroll pr-2 -mr-2 space-y-3 pb-24">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                                <Loader2 size={32} className="animate-spin mb-4 text-[#FF6B2B]" />
                                <p>Carregando conversas...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-[#111118] border border-white/5 rounded-2xl">
                                <MessageCircle size={48} className="mb-4 opacity-20" />
                                <p>Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            filtered.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedLead(c)}
                                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border
                                                ${selectedLead?.id === c.id ? 'bg-white/5 border-[#FF6B2B]/50' : 'bg-[#111118] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
                                >
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B2B] to-[#FF8B5B] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-[#FF6B2B]/20">
                                        {getInitial(c.nome_cliente)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-white truncate">{c.nome_cliente || 'Sem Nome'}</h3>
                                            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 shrink-0">
                                                <Clock size={12} />
                                                <span>{formatTimeAgo(c.ultima_interacao)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-neutral-400 font-mono truncate">{c.telefone_cliente}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusStyles(c.status_ia)}`}>
                                                {c.status_ia}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 text-xs text-neutral-500">
                                            Etapa: <span className="text-neutral-400">{c.etapa_fluxo || 'inicio'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Drawer (Details) */}
                {selectedLead && (
                    <div className="w-[380px] shrink-0 bg-[#111118] border border-white/5 rounded-3xl p-6 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 fade-in shadow-2xl">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B2B] to-[#FF8B5B] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[#FF6B2B]/20">
                                    {getInitial(selectedLead.nome_cliente)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white leading-tight">{selectedLead.nome_cliente}</h2>
                                    <p className="text-sm text-neutral-400 font-mono mt-0.5">{selectedLead.telefone_cliente}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-2 text-neutral-500 hover:bg-white/5 rounded-full transition-colors">
                                {/* Close X can be native or Lucide icon */}
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto dark-scroll pr-2">
                            {/* Badges Status */}
                            <div>
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Status Atual</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${getStatusStyles(selectedLead.status_ia)}`}>
                                        {selectedLead.status_ia}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border bg-neutral-800 text-neutral-300 border-neutral-700">
                                        Etapa: {selectedLead.etapa_fluxo}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div>
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Linha do Tempo</h4>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#111118] bg-[#FF6B2B] text-white shrink-0 z-10 mr-4 md:mx-auto shadow-[0_0_10px_#FF6B2B]">
                                        </div>
                                        {/* Card */}
                                        <div className="w-[calc(100%-2.5rem)] pb-4">
                                            <div className="text-sm font-bold text-white mb-1">Última Interação</div>
                                            <div className="text-xs text-neutral-400">{new Date(selectedLead.ultima_interacao).toLocaleString('pt-BR')}</div>
                                        </div>
                                    </div>

                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#111118] bg-neutral-700 text-white shrink-0 z-10 mr-4 md:mx-auto">
                                        </div>
                                        {/* Card */}
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)]">
                                            <div className="text-sm font-bold text-white mb-1">Criação do Lead</div>
                                            <div className="text-xs text-neutral-400">{new Date(selectedLead.created_at).toLocaleString('pt-BR')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-white/5 mt-auto">
                            <button
                                onClick={() => handleAssumirAtendimento(selectedLead)}
                                disabled={updating || selectedLead.status_ia === 'AtendimentoHumano'}
                                className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6B2B] to-[#FF8B5B] hover:from-[#ff7b42] hover:to-[#ff9b72] text-white transition-all shadow-lg shadow-[#FF6B2B]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                Assumir Atendimento
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </UnitLayout>
    );
}
