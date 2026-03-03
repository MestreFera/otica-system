import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UnitLayout from '../../components/UnitLayout';
import { unitTablesService } from '../../services/unitTablesService';
import { RefreshCw, Play, UserCheck, Loader2 } from 'lucide-react';

export default function FollowUp() {
    const { slug } = useParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!slug) return;
        loadData();
    }, [slug]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await unitTablesService.getFollowUps(slug);
            setLeads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

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

    const getProgressColor = (dateStr) => {
        if (!dateStr) return 'bg-green-500';
        const date = new Date(dateStr);
        const diffInHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
        if (diffInHours < 24) return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
        if (diffInHours < 48) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]';
        return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    };

    async function handleReativar(lead) {
        if (updating) return;
        setUpdating(true);
        try {
            await unitTablesService.reativarLead(slug, lead.telefone_cliente);
            await loadData();
        } catch (err) {
            console.error(err);
            alert("Erro ao reativar chumbo.");
        } finally {
            setUpdating(false);
        }
    }

    async function handleAssumir(lead) {
        if (updating) return;
        setUpdating(true);
        try {
            await unitTablesService.assumirAtendimento(slug, lead);
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
            <div className="max-w-[1000px] mx-auto pb-24 h-screen pt-4 overflow-y-auto dark-scroll">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <RefreshCw className="text-[#FF6B2B]" size={28} />
                            Follow-up
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            Aguardando resposta ({leads.length})
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <Loader2 size={32} className="animate-spin mb-4 text-[#FF6B2B]" />
                        <p>Carregando leads de follow-up...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-[#111118] border border-white/5 rounded-2xl">
                        <RefreshCw size={48} className="mb-4 opacity-20" />
                        <p>Nenhum lead aguardando follow-up no momento.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {leads.map(lead => (
                            <div key={lead.id} className="bg-[#111118] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                                <div className="flex-1 min-w-0 w-full">
                                    <h3 className="text-lg font-bold text-white mb-1">{lead.nome_cliente || 'Sem Nome'}</h3>
                                    <p className="text-sm text-neutral-400 font-mono mb-3">{lead.telefone_cliente}</p>

                                    {/* Progress Bar Line */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${getProgressColor(lead.ultima_interacao)}`}
                                                style={{ width: '100%' }} // In a real scenario we'd calculate % based on max timeout
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-neutral-500 shrink-0">
                                            {formatTimeAgo(lead.ultima_interacao)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                                    <button
                                        onClick={() => handleReativar(lead)}
                                        disabled={updating}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50"
                                    >
                                        {updating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                        <span className="hidden md:inline">Reativar IA</span>
                                    </button>
                                    <button
                                        onClick={() => handleAssumir(lead)}
                                        disabled={updating}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#FF6B2B] to-[#FF8B5B] hover:from-[#ff7b42] hover:to-[#ff9b72] text-white transition-all shadow-lg shadow-[#FF6B2B]/20 disabled:opacity-50"
                                    >
                                        <UserCheck size={16} />
                                        <span className="hidden md:inline">Assumir Atend.</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UnitLayout>
    );
}
