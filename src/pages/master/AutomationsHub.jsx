import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { automationService } from '../../services/automationService';
import { unitService } from '../../services/unitService';
import { useToastStore } from '../../components/ui/Toast';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import {
    Scan, LogOut, Zap, History, Settings, BarChart2, Plus, Play, Pause, Trash2,
    RefreshCw, ChevronDown, ChevronUp, X, Eye, Clock, CheckCircle2, XCircle,
    Send, Code2, Layers
} from 'lucide-react';

const TABS = ['Visão Geral', 'Automações', 'Histórico', 'Configurações'];

const TRIGGER_LABELS = {
    status_changed: 'Status alterado', status_novo: 'Pedido Novo', status_producao: 'Em Produção',
    status_pronto: 'Pronto para Retirada', status_entregue: 'Pedido Entregue', status_cancelado: 'Pedido Cancelado',
    client_created: 'Novo cliente cadastrado', appointment_created: 'Novo agendamento',
    days_in_production: 'Dias em produção', payment_overdue: 'Pagamento pendente',
};

const VARIABLES = ['{{cliente_nome}}', '{{cliente_telefone}}', '{{cliente_email}}', '{{status}}', '{{unidade}}', '{{valor_total}}', '{{valor_pendente}}', '{{data}}'];

const TEMPLATE_ICONS = {
    pedido_pronto: '🛎️', entrega: '✅', lembrete_pagamento: '💳',
    boas_vindas: '👋', followup: '📩', atraso: '⏰',
};

const EMPTY_FORM = {
    unit_id: '', name: '', description: '', trigger_event: 'status_pronto',
    trigger_value: '', action_type: 'webhook', webhook_url: '', webhook_method: 'POST',
    webhook_headers: '{}', message_template: '', active: true, delay_minutes: 0,
};

// ─── Payload preview ──────────────────────────────────────────────────────────
function buildPreview(template, unitName = 'Ótica Exemplo') {
    const sample = {
        client_name: 'Maria Silva', phone: '(11) 99999-8888',
        email: 'maria@email.com', status: 'Pronto',
        unit_name: unitName, total_value: '850.00', paid_value: '425.00',
    };
    return automationService.buildPayload(template, sample);
}

export default function AutomationsHub() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [tab, setTab] = useState(0);
    const [automations, setAutomations] = useState([]);
    const [logs, setLogs] = useState({ data: [], total: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterUnit, setFilterUnit] = useState('');
    const [logPage, setLogPage] = useState(0);
    const [logFilters, setLogFilters] = useState({ status: '', unitId: '' });
    const [expandedLog, setExpandedLog] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [testingId, setTestingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => { loadAll(); }, []);
    useEffect(() => { if (tab === 2) loadLogs(); }, [tab, logPage, logFilters]);

    async function loadAll() {
        setLoading(true);
        const [autos, u, recent] = await Promise.all([
            automationService.getAll(), unitService.getAllUnits(), automationService.getRecentLogs(20)
        ]);
        setAutomations(autos);
        setUnits(u);
        setRecentLogs(recent);
        setLoading(false);
    }

    async function loadLogs() {
        const data = await automationService.getLogs(logFilters, logPage);
        setLogs(data);
    }

    async function handleToggle(auto) {
        await automationService.toggle(auto.id, auto.active);
        setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, active: !a.active } : a));
        addToast({ type: 'success', message: `${auto.name} ${auto.active ? 'desativada' : 'ativada'}` });
    }

    async function handleDelete(auto) {
        setDeletingId(auto.id);
        await automationService.delete(auto.id);
        setAutomations(prev => prev.filter(a => a.id !== auto.id));
        setDeletingId(null);
        addToast({ type: 'success', message: `"${auto.name}" excluída` });
    }

    async function handleCreate(e) {
        e.preventDefault();
        const payload = { ...form };
        // Parse headers safely
        try { payload.webhook_headers = JSON.parse(form.webhook_headers || '{}'); } catch { payload.webhook_headers = {}; }
        const { success, error } = await automationService.create(payload);
        if (success) {
            addToast({ type: 'success', message: 'Automação criada!' });
            setModalOpen(false);
            loadAll();
        } else addToast({ type: 'error', message: error });
    }

    async function handleTest(auto) {
        setTestingId(auto.id);
        addToast({ type: 'info', message: 'Disparando teste...' });
        const unitName = units.find(u => u.id === auto.unit_id)?.name || '';
        const result = await automationService.execute(auto, {
            client_name: 'Cliente Teste', phone: '(11) 99999-0000',
            email: 'teste@email.com', status: 'Pronto',
            unit_name: unitName, total_value: '500', paid_value: '250',
        });
        setTestingId(null);
        addToast({ type: result.status === 'success' ? 'success' : 'error', message: result.status === 'success' ? `Teste OK (${result.duration_ms}ms)` : 'Erro: ' + (result.response_body || 'falha na requisição') });
        loadAll();
    }

    async function handleResend(log) {
        const auto = await automationService.getById(log.automation_id);
        if (!auto) return addToast({ type: 'error', message: 'Automação não encontrada' });
        const result = await automationService.execute(auto, log.payload || {});
        addToast({ type: result.status === 'success' ? 'success' : 'error', message: result.status === 'success' ? 'Reenviado!' : 'Falha no reenvio' });
        loadLogs();
    }

    function loadTemplate(key) {
        const t = automationService.TEMPLATES[key];
        if (t) setForm(f => ({ ...f, name: t.name, trigger_event: t.trigger_event, message_template: t.message_template }));
    }

    function openModal() {
        setForm({ ...EMPTY_FORM, unit_id: units[0]?.id || '' });
        setPreviewVisible(false);
        setModalOpen(true);
    }

    const preview = useMemo(() => {
        const unitName = units.find(u => u.id === form.unit_id)?.name || 'Ótica Exemplo';
        const p = buildPreview(form.message_template, unitName);
        return JSON.stringify(p, null, 2);
    }, [form.message_template, form.unit_id, units]);

    const filtered = filterUnit ? automations.filter(a => a.unit_id === filterUnit) : automations;
    const todayLogs = recentLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString());
    const successRate = recentLogs.length ? Math.round(recentLogs.filter(l => l.status === 'success').length / recentLogs.length * 100) : 0;

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            <header className="border-b border-white/[0.04] px-6 py-4 flex items-center gap-4 bg-[#0d1225]/60 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="logo-icon"><Scan size={20} className="text-white" /></div>
                    <div>
                        <p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-widest">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Hub de Automações</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1 ml-8">
                    <Link to="/master/dashboard" className="px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">Dashboard</Link>
                    <Link to="/master/unidades" className="px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">Unidades</Link>
                    <Link to="/master/automations" className="px-4 py-2 text-sm text-cyan-400 bg-cyan-400/10 rounded-lg font-medium border border-cyan-400/20">Automações</Link>
                </nav>
                <div className="flex-1" />
                <button onClick={async () => { await logout(); navigate('/master/login'); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><LogOut size={16} /></button>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/[0.04] pb-4">
                    {TABS.map((t, i) => (
                        <button key={t} onClick={() => setTab(i)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === i ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/25' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
                            {[<BarChart2 size={14} />, <Zap size={14} />, <History size={14} />, <Settings size={14} />][i]}
                            <span>{t}</span>
                        </button>
                    ))}
                </div>

                {loading ? <>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</> : (
                    <>
                        {/* ── TAB 0: Overview ── */}
                        {tab === 0 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Automações Ativas', value: automations.filter(a => a.active).length, color: 'text-cyan-400' },
                                        { label: 'Total de Automações', value: automations.length, color: 'text-white' },
                                        { label: 'Execuções Hoje', value: todayLogs.length, color: 'text-amber-400' },
                                        { label: 'Taxa de Sucesso', value: `${successRate}%`, color: successRate >= 80 ? 'text-emerald-400' : 'text-red-400' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="metric-card">
                                            <p className="text-xs text-white/25 uppercase tracking-wider">{label}</p>
                                            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="glass-card p-6">
                                    <h3 className="text-sm font-bold text-white mb-4">Últimas Execuções</h3>
                                    <div className="space-y-2">
                                        {recentLogs.slice(0, 12).map(l => (
                                            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.status === 'success' ? 'bg-emerald-400' : l.status === 'error' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                                <span className="text-xs text-white/60 flex-1 truncate">{l.automations?.name || 'Automação'} — {l.client_name || 'Sistema'}</span>
                                                {l.duration_ms && <span className="text-[10px] text-white/20">{l.duration_ms}ms</span>}
                                                <span className="text-[10px] text-white/15">{new Date(l.created_at).toLocaleTimeString('pt-BR')}</span>
                                            </div>
                                        ))}
                                        {recentLogs.length === 0 && <p className="text-white/15 text-sm text-center py-8">Nenhuma execução registrada</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 1: Automations ── */}
                        {tab === 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="input-futuristic text-xs py-2">
                                        <option value="">Todas as unidades</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <button onClick={openModal} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Nova Automação</button>
                                </div>

                                {filtered.map(auto => {
                                    const successPct = auto.runs_count ? Math.round((auto.success_count || 0) / auto.runs_count * 100) : null;
                                    const lastRun = auto.last_run_at ? new Date(auto.last_run_at).toLocaleString('pt-BR') : 'Nunca executada';
                                    return (
                                        <div key={auto.id} className="glass-card p-5">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${auto.active ? 'bg-cyan-400/15 text-cyan-400' : 'bg-white/5 text-white/20'}`}>
                                                    <Zap size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm font-semibold text-white">{auto.name}</h3>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${auto.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                                            {auto.active ? 'Ativa' : 'Inativa'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-white/30 mt-0.5">{auto.units?.name} · {TRIGGER_LABELS[auto.trigger_event] || auto.trigger_event} → {auto.action_type === 'webhook' ? 'Webhook' : 'Notificação'}</p>

                                                    {/* Stats row */}
                                                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                                                        <div className="flex items-center gap-1.5 text-xs text-white/25">
                                                            <Clock size={11} />
                                                            <span>{lastRun}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-white/25">{auto.runs_count || 0} exec</span>
                                                            <span className="text-emerald-400/70">{auto.success_count || 0}✓</span>
                                                            {(auto.error_count || 0) > 0 && <span className="text-red-400/70">{auto.error_count}✕</span>}
                                                            {successPct !== null && (
                                                                <span className={`font-semibold ${successPct >= 80 ? 'text-emerald-400' : successPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{successPct}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-1.5 flex-shrink-0">
                                                    <button onClick={() => handleToggle(auto)} title={auto.active ? 'Pausar' : 'Ativar'} className={`p-2 rounded-lg transition-all ${auto.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white/20 hover:bg-white/5'}`}>
                                                        {auto.active ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>
                                                    <button onClick={() => handleTest(auto)} disabled={testingId === auto.id} title="Testar webhook" className="p-2 rounded-lg text-cyan-400/60 hover:bg-cyan-500/10 transition-all disabled:opacity-40">
                                                        {testingId === auto.id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(auto)} disabled={deletingId === auto.id} title="Excluir" className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
                                                        {deletingId === auto.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <div className="text-center py-16 text-white/15">
                                        <Zap size={40} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Nenhuma automação criada</p>
                                        <button onClick={openModal} className="mt-4 btn-primary text-xs px-4 py-2">Criar primeira automação</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: History ── */}
                        {tab === 2 && (
                            <div className="space-y-4">
                                <div className="flex gap-2 flex-wrap">
                                    <select value={logFilters.status} onChange={e => setLogFilters(f => ({ ...f, status: e.target.value }))} className="input-futuristic text-xs py-2">
                                        <option value="">Todos os status</option>
                                        <option value="success">✅ Sucesso</option>
                                        <option value="error">❌ Erro</option>
                                    </select>
                                    <select value={logFilters.unitId} onChange={e => setLogFilters(f => ({ ...f, unitId: e.target.value }))} className="input-futuristic text-xs py-2">
                                        <option value="">Todas as unidades</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                {logs.data.map(l => (
                                    <div key={l.id} className="glass-card overflow-hidden">
                                        <button onClick={() => setExpandedLog(expandedLog === l.id ? null : l.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors">
                                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                            <span className="text-sm text-white/70 flex-1 truncate">{l.automations?.name} — {l.client_name || 'N/A'}</span>
                                            {l.duration_ms && <span className="text-xs text-white/20">{l.duration_ms}ms</span>}
                                            {l.response_status && <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${l.response_status < 300 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>{l.response_status}</span>}
                                            <span className="text-xs text-white/15">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
                                            {expandedLog === l.id ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                                        </button>
                                        {expandedLog === l.id && (
                                            <div className="px-4 pb-4 border-t border-white/[0.03] pt-3 space-y-3">
                                                <div>
                                                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Code2 size={10} /> Payload Enviado</p>
                                                    <div className="bg-black/40 rounded-lg p-3 text-xs font-mono text-cyan-300/70 overflow-auto max-h-40">
                                                        <pre>{JSON.stringify(l.payload, null, 2)}</pre>
                                                    </div>
                                                </div>
                                                {l.response_body && (
                                                    <div>
                                                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Layers size={10} /> Resposta Recebida</p>
                                                        <div className="bg-black/40 rounded-lg p-3 text-xs font-mono text-white/40 overflow-auto max-h-32">
                                                            <pre>{l.response_body}</pre>
                                                        </div>
                                                    </div>
                                                )}
                                                {l.status === 'error' && (
                                                    <button onClick={() => handleResend(l)} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                                                        <RefreshCw size={12} /> Reenviar
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {logs.data.length === 0 && <p className="text-center text-white/15 py-12">Nenhum log encontrado</p>}
                                {logs.total > 20 && (
                                    <div className="flex justify-center gap-2 pt-2">
                                        <button disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)} className="btn-ghost text-xs">← Anterior</button>
                                        <span className="text-xs text-white/20 py-2">Página {logPage + 1} de {Math.ceil(logs.total / 20)}</span>
                                        <button disabled={(logPage + 1) * 20 >= logs.total} onClick={() => setLogPage(p => p + 1)} className="btn-ghost text-xs">Próxima →</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: Config ── */}
                        {tab === 3 && (
                            <div className="glass-card p-6 max-w-xl">
                                <h3 className="text-lg font-bold text-white mb-2">Configurações Globais</h3>
                                <p className="text-sm text-white/30 mb-6">Defaults para webhooks e retry.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-cyan-300/60 uppercase tracking-wider block mb-1.5">Timeout de Requisição</label>
                                        <select className="input-futuristic w-full"><option>5 segundos</option><option>10 segundos</option><option>30 segundos</option></select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-cyan-300/60 uppercase tracking-wider block mb-1.5">Tentativas em caso de erro</label>
                                        <select className="input-futuristic w-full"><option>1 tentativa</option><option>2 tentativas</option><option>3 tentativas</option></select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Create Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setModalOpen(false)} />
                    <div className="relative glass-card glow-border w-full max-w-2xl max-h-[90vh] overflow-y-auto dark-scroll animate-fadeIn">
                        {/* Modal header */}
                        <div className="sticky top-0 bg-[#0d1225]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Nova Automação</h3>
                            <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Templates */}
                            <div>
                                <p className="text-xs text-cyan-400/60 uppercase tracking-widest mb-3">⚡ Templates Prontos — clique para aplicar</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(automationService.TEMPLATES).map(([k, t]) => (
                                        <button key={k} onClick={() => loadTemplate(k)}
                                            className={`text-left p-3 rounded-xl border transition-all text-xs ${form.name === t.name ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 hover:bg-white/[0.03]'}`}>
                                            <span className="text-base">{TEMPLATE_ICONS[k] || '⚡'}</span>
                                            <p className="mt-1 font-medium leading-tight">{t.name}</p>
                                            <p className="text-white/25 mt-0.5 text-[10px]">{TRIGGER_LABELS[t.trigger_event]}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-cyan-300/60 block mb-1.5">Unidade *</label>
                                        <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))} className="input-futuristic w-full" required>
                                            <option value="">Selecionar...</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-cyan-300/60 block mb-1.5">Nome *</label>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-futuristic w-full" required placeholder="Ex: Aviso pedido pronto" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-cyan-300/60 block mb-1.5">Descrição</label>
                                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-futuristic w-full" placeholder="Opcional" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-cyan-300/60 block mb-1.5">Gatilho</label>
                                        <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} className="input-futuristic w-full">
                                            {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-cyan-300/60 block mb-1.5">Delay (minutos)</label>
                                        <input type="number" min="0" value={form.delay_minutes} onChange={e => setForm(f => ({ ...f, delay_minutes: Number(e.target.value) }))} className="input-futuristic w-full" placeholder="0 = imediato" />
                                    </div>
                                </div>

                                {form.trigger_event === 'days_in_production' && (
                                    <div>
                                        <label className="text-xs text-cyan-300/60 block mb-1.5">Dias em produção</label>
                                        <input type="number" value={form.trigger_value} onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))} className="input-futuristic w-full" placeholder="7" />
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-cyan-300/60 block mb-1.5">Ação</label>
                                    <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))} className="input-futuristic w-full">
                                        <option value="webhook">Webhook (n8n, Make, Zapier, WhatsApp)</option>
                                        <option value="internal_notification">Notificação Interna</option>
                                    </select>
                                </div>

                                {form.action_type === 'webhook' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2">
                                                <label className="text-xs text-cyan-300/60 block mb-1.5">URL do Webhook</label>
                                                <input value={form.webhook_url} onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))} className="input-futuristic w-full" placeholder="https://..." />
                                            </div>
                                            <div>
                                                <label className="text-xs text-cyan-300/60 block mb-1.5">Método</label>
                                                <select value={form.webhook_method} onChange={e => setForm(f => ({ ...f, webhook_method: e.target.value }))} className="input-futuristic w-full">
                                                    <option>POST</option><option>GET</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-cyan-300/60 block mb-1.5">Headers (JSON)</label>
                                            <input value={form.webhook_headers} onChange={e => setForm(f => ({ ...f, webhook_headers: e.target.value }))} className="input-futuristic w-full font-mono text-xs" placeholder='{"Authorization": "Bearer token"}' />
                                        </div>
                                    </div>
                                )}

                                {/* Payload template + preview */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs text-cyan-300/60">Template do Payload / Mensagem</label>
                                        <button type="button" onClick={() => setPreviewVisible(v => !v)}
                                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all ${previewVisible ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/20' : 'text-white/30 border border-white/10 hover:text-cyan-400'}`}>
                                            <Eye size={10} /> Preview
                                        </button>
                                    </div>
                                    <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} className="input-futuristic w-full font-mono text-xs resize-none" rows={4} placeholder='{"message": "Olá {{cliente_nome}}, seu pedido está pronto!"}' />
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {VARIABLES.map(v => (
                                            <button key={v} type="button" onClick={() => setForm(f => ({ ...f, message_template: f.message_template + v }))} className="text-[10px] px-2 py-1 rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 transition-all">{v}</button>
                                        ))}
                                    </div>
                                    {previewVisible && (
                                        <div className="mt-3 rounded-xl border border-cyan-400/20 bg-black/40 overflow-hidden">
                                            <div className="px-3 py-2 border-b border-white/[0.05] flex items-center gap-2">
                                                <Code2 size={12} className="text-cyan-400/60" />
                                                <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider">Preview do payload (dados de exemplo)</span>
                                            </div>
                                            <pre className="p-3 text-xs font-mono text-emerald-300/80 overflow-auto max-h-40">{preview}</pre>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                                    <button type="submit" className="btn-primary flex-1">Criar Automação</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
