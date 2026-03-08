import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { unitTablesService } from '../../services/unitTablesService';

const ETAPA_COLORS = {
    inicio: '#3b82f6',
    saudacao: '#8b5cf6',
    diagnostico: '#f59e0b',
    horarios: '#f97316',
    agendado: '#10b981',
    followup1_enviado: '#6366f1',
    followup2_enviado: '#8b5cf6',
    followup3_enviado: '#ec4899',
    encerrado: '#6b7280',
};

export default function IAMonitor() {
    const { slug } = useParams();

    const [unitInfo, setUnitInfo] = useState(null);
    const [metrics, setMetrics] = useState({
        leadsAtivos: 0,
        agendamentosHoje: 0,
        atendimentoHumano: 0,
        taxaConversao: 0,
        followupsPendentes: 0,
        totalLeads: 0,
    });
    const [leads, setLeads] = useState([]);
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [pulse, setPulse] = useState(false);

    // Fetch unit info (ai_name, name) from the units table
    useEffect(() => {
        if (!slug) return;
        (async () => {
            const { data, error } = await supabase
                .from('units')
                .select('id, name, slug, ai_name')
                .eq('slug', slug)
                .single();
            if (error || !data) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            setUnitInfo(data);
        })();
    }, [slug]);

    const fetchData = useCallback(async () => {
        if (!slug || !unitInfo) return;

        setPulse(true);
        setTimeout(() => setPulse(false), 600);

        const [followup, agendamentoData] = await Promise.all([
            unitTablesService.getMonitorFollowups(slug),
            unitTablesService.getMonitorAgendamentosHoje(slug),
        ]);

        if (followup) {
            const ativos = followup.filter((l) => l.status_ia === 'Ativo');
            const humano = followup.filter((l) => l.status_ia === 'AtendimentoHumano');
            const agendados = followup.filter((l) => l.etapa_fluxo === 'agendado');
            const followupsPendentes = followup.filter(
                (l) =>
                    l.status_followup === 'followup01' ||
                    (l.etapa_fluxo?.includes('followup') && !l.etapa_fluxo?.includes('3'))
            );

            const taxa =
                followup.length > 0
                    ? Math.round((agendados.length / followup.length) * 100)
                    : 0;

            setMetrics({
                leadsAtivos: ativos.length,
                agendamentosHoje: agendamentoData?.length || 0,
                atendimentoHumano: humano.length,
                taxaConversao: taxa,
                followupsPendentes: followupsPendentes.length,
                totalLeads: followup.length,
            });

            setLeads(
                [...followup]
                    .sort(
                        (a, b) =>
                            new Date(b.ultima_interacao).getTime() -
                            new Date(a.ultima_interacao).getTime()
                    )
                    .slice(0, 8)
            );
        }

        if (agendamentoData) {
            setAgendamentos(agendamentoData.slice(0, 5));
        }

        setLastUpdate(new Date());
        setLoading(false);
    }, [slug, unitInfo]);

    useEffect(() => {
        if (!unitInfo) return;
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData, unitInfo]);

    const formatTime = (iso) => {
        if (!iso) return '—';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'agora';
        if (mins < 60) return `${mins}m atrás`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h atrás`;
        return `${Math.floor(hrs / 24)}d atrás`;
    };

    const formatHour = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const aiName = unitInfo?.ai_name || 'IA';
    const unitName = unitInfo?.name || '';

    // 404 state
    if (notFound) {
        return (
            <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#ff6b6b] flex items-center justify-center text-[#ff6b6b] text-2xl font-bold">!</div>
                    <p className="text-[#ff6b6b] font-mono text-sm tracking-widest">UNIDADE NÃO ENCONTRADA</p>
                    <p className="text-[#3d5166] font-mono text-xs">O slug "{slug}" não corresponde a nenhuma unidade ativa.</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#00ff88] font-mono text-sm tracking-widest">CARREGANDO SISTEMA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080c10] text-white font-mono">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');
                * { font-family: 'Space Mono', monospace; }
                .title-font { font-family: 'Syne', sans-serif; }
                .card { background: #0d1117; border: 1px solid #1a2332; }
                .card-green { background: #0d1117; border: 1px solid #00ff8822; }
                .glow { box-shadow: 0 0 20px #00ff8815; }
                .glow-red { box-shadow: 0 0 20px #ff004415; }
                .pulse-dot { animation: pulseDot 2s infinite; }
                @keyframes pulseDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
                .scan-line {
                    background: linear-gradient(90deg, transparent, #00ff8808, transparent);
                    animation: scan 3s linear infinite;
                }
                @keyframes scan {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .metric-value {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: #0d1117; }
                ::-webkit-scrollbar-thumb { background: #1a2332; border-radius: 2px; }
            `}</style>

            {/* Header */}
            <div className="border-b border-[#1a2332] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080c10] z-10">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#00ff88] pulse-dot" />
                    <h1 className="title-font text-xl font-bold tracking-tight">
                        {aiName} <span className="text-[#00ff88]">MONITOR</span>
                    </h1>
                    <span className="text-[#1a2332] text-xs">|</span>
                    <span className="text-[#3d5166] text-xs tracking-widest">
                        {unitName} — SISTEMA ATIVO
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs text-[#3d5166] transition-opacity ${pulse ? 'opacity-100' : 'opacity-50'}`}>
                        ↻ {lastUpdate.toLocaleTimeString('pt-BR')}
                    </span>
                    <button
                        onClick={fetchData}
                        className="text-xs border border-[#1a2332] hover:border-[#00ff88] hover:text-[#00ff88] px-3 py-1 transition-all"
                    >
                        ATUALIZAR
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        {
                            label: 'LEADS ATIVOS',
                            value: metrics.leadsAtivos,
                            color: '#00ff88',
                            sub: `de ${metrics.totalLeads} total`,
                        },
                        {
                            label: 'AGENDAMENTOS HOJE',
                            value: metrics.agendamentosHoje,
                            color: '#3b82f6',
                            sub: 'confirmados',
                        },
                        {
                            label: 'ATEND. HUMANO',
                            value: metrics.atendimentoHumano,
                            color: metrics.atendimentoHumano > 0 ? '#ff6b6b' : '#3d5166',
                            sub: metrics.atendimentoHumano > 0 ? '⚠ aguardando' : 'sem fila',
                        },
                        {
                            label: 'TAXA CONVERSÃO',
                            value: `${metrics.taxaConversao}%`,
                            color: metrics.taxaConversao >= 30 ? '#00ff88' : '#f59e0b',
                            sub: 'leads → agendados',
                        },
                        {
                            label: 'FOLLOWUPS',
                            value: metrics.followupsPendentes,
                            color: metrics.followupsPendentes > 0 ? '#f59e0b' : '#3d5166',
                            sub: 'pendentes',
                        },
                    ].map((m) => (
                        <div
                            key={m.label}
                            className="card p-4 relative overflow-hidden"
                            style={{
                                borderColor: `${m.color}22`,
                                boxShadow: `0 0 20px ${m.color}08`,
                            }}
                        >
                            <div className="scan-line absolute inset-0 h-full w-[200%]" />
                            <p className="text-[10px] tracking-widest text-[#3d5166] mb-2">{m.label}</p>
                            <p className="metric-value text-3xl" style={{ color: m.color }}>{m.value}</p>
                            <p className="text-[10px] text-[#3d5166] mt-1">{m.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Leads Recentes */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs tracking-widest text-[#3d5166]">LEADS RECENTES</h2>
                            <span className="text-[10px] text-[#3d5166]">últimas interações</span>
                        </div>
                        <div className="space-y-2">
                            {leads.length === 0 ? (
                                <p className="text-[#3d5166] text-xs text-center py-4">Nenhum lead encontrado</p>
                            ) : (
                                leads.map((lead, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2 border-b border-[#1a2332] last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor:
                                                        lead.status_ia === 'AtendimentoHumano'
                                                            ? '#ff6b6b'
                                                            : lead.status_ia === 'Ativo'
                                                                ? '#00ff88'
                                                                : '#3d5166',
                                                }}
                                            />
                                            <div>
                                                <p className="text-xs text-white">{lead.nome_cliente || '—'}</p>
                                                <p className="text-[10px] text-[#3d5166]">{lead.telefone_cliente}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-sm"
                                                style={{
                                                    backgroundColor: `${ETAPA_COLORS[lead.etapa_fluxo] || '#3d5166'}22`,
                                                    color: ETAPA_COLORS[lead.etapa_fluxo] || '#3d5166',
                                                }}
                                            >
                                                {lead.etapa_fluxo || '—'}
                                            </span>
                                            <p className="text-[10px] text-[#3d5166] mt-0.5">{formatTime(lead.ultima_interacao)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Agendamentos do Dia */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs tracking-widest text-[#3d5166]">AGENDA DE HOJE</h2>
                            <span className="text-[10px] text-[#00ff88]">
                                {new Date().toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {agendamentos.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-[#3d5166] text-xs">Nenhum agendamento para hoje</p>
                                </div>
                            ) : (
                                agendamentos.map((ag, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2 border-b border-[#1a2332] last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-center w-12">
                                                <p className="text-[#00ff88] text-sm font-bold">
                                                    {formatHour(ag.data_agendamento)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white">{ag.nome_cliente}</p>
                                                <p className="text-[10px] text-[#3d5166]">{ag.telefone_cliente}</p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2 py-0.5 ${ag.status_lembrete === 'encerrado'
                                                    ? 'text-[#00ff88] bg-[#00ff8811]'
                                                    : 'text-[#f59e0b] bg-[#f59e0b11]'
                                                }`}
                                        >
                                            {ag.status_lembrete === 'encerrado' ? '✓ lembrete enviado' : 'pendente'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Atendimento Humano Alert */}
                        {metrics.atendimentoHumano > 0 && (
                            <div className="mt-4 border border-[#ff6b6b33] bg-[#ff6b6b08] p-3">
                                <p className="text-[#ff6b6b] text-xs">
                                    ⚠ {metrics.atendimentoHumano} lead(s) aguardando atendimento humano
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[#1a2332] text-[10px] tracking-widest">
                    <span>{aiName} MONITOR v1.0 — {unitName}</span>
                    <span>AUTO-REFRESH 30s</span>
                </div>
            </div>
        </div>
    );
}
