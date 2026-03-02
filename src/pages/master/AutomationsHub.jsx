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
    Send, Code2, Layers, TrendingUp, Building2, Terminal
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

// ─── Reusable input style ─────────────────────────────────────────────────────
const inp = "input-canvas";

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
        <div className="min-h-screen bg-[#050505] canvas-bg-wrapper text-neutral-300 font-sans selection:bg-[#F97316]/30 selection:text-white flex flex-col overflow-x-hidden">
            <div className="grid-bg"></div>
            <div className="aura-glow"></div>

            {/* ── Header (Floating Glass) ── */}
            <header className="sticky top-4 z-40 mx-4 lg:mx-8 px-6 py-4 flex items-center justify-between rounded-2xl backdrop-blur-2xl border border-white/10 bg-black/60 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-sm bg-[#111] border border-white/10 flex items-center justify-center text-[#F97316]">
                        <Scan size={16} />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#F97316]">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white leading-tight">Master Control Node</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2 flex-1 justify-center sm:justify-start sm:ml-8 font-mono">
                    <Link to="/master/dashboard" className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-white/[0.02] flex items-center gap-2 transition-all">
                        <TrendingUp size={14} /> Dashboard
                    </Link>
                    <Link to="/master/unidades" className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-white/[0.02] flex items-center gap-2 transition-all">
                        <Building2 size={14} /> Nodes
                    </Link>
                    <Link to="/master/automations" className="px-3 py-2 rounded-lg text-xs font-bold transition-all bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center gap-2">
                        <Zap size={14} className="text-[#F97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" /> Automations
                    </Link>
                </nav>

                <div className="flex items-center gap-3 font-mono">
                    <button onClick={async () => { await logout(); navigate('/master/login'); }}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold tracking-widest uppercase rounded-lg border border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-all ml-2">
                        <LogOut size={14} /> Disconnect
                    </button>
                </div>
            </header>

            <div className="p-5 lg:p-8 max-w-[1440px] mx-auto animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Hub de <span style={{ color: 'var(--accent)' }}>Automações</span></h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Gerencie webhooks e eventos do sistema</p>
                    </div>
                    {tab === 1 && (
                        <button onClick={openModal} className="btn-primary flex items-center gap-2 text-xs px-5 py-2.5">
                            <Plus size={16} /> Nova Automação
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-[var(--border)] pb-4 overflow-x-auto hide-scrollbar">
                    {TABS.map((t, i) => (
                        <button key={t} onClick={() => setTab(i)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                            style={tab === i ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' } : { color: 'var(--text-secondary)', border: '1px solid transparent' }}
                            onMouseEnter={e => { if (tab !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseLeave={e => { if (tab !== i) e.currentTarget.style.background = 'transparent'; }}>
                            {[<BarChart2 size={16} />, <Zap size={16} />, <History size={16} />, <Settings size={16} />][i]}
                            <span>{t}</span>
                        </button>
                    ))}
                </div>

                {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} /></div> : (
                    <div className="stagger-children">
                        {/* ── TAB 0: Overview ── */}
                        {tab === 0 && (
                            <div className="space-y-6">
                                {/* Visualizador Neural Core (Flow) */}
                                <div className="glass-card p-6 overflow-hidden relative">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-8 flex items-center gap-2" style={{ color: 'var(--accent)' }}><Scan size={14} /> Neural Core Activity (n8n Webhook Simulator)</h3>

                                    <div className="relative h-48 sm:h-64 flex items-center justify-between px-4 sm:px-12 w-full max-w-4xl mx-auto">
                                        {/* Connecting Line (Beam Animation) */}
                                        <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0.5 bg-white/5 overflow-hidden rounded-full z-0">
                                            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#F97316] to-transparent animate-beam-fast" />
                                        </div>

                                        {/* Node 1: Unit Systems */}
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] relative group">
                                                <div className="absolute inset-0 rounded-2xl border border-white/40 animate-pulse-slow"></div>
                                                <Building2 className="text-white/70" size={24} />
                                            </div>
                                            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest text-center">Unit<br />Triggers</p>
                                        </div>

                                        {/* Node 2: n8n Core */}
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black border-2 border-[#F97316]/50 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.2)] relative">
                                                {/* Pulsing rings */}
                                                <div className="absolute inset-0 rounded-full border border-[#F97316] animate-ping opacity-20"></div>
                                                <div className="absolute -inset-4 rounded-full border border-[#F97316]/20 animate-spin-slow" style={{ animationDuration: '4s' }}></div>
                                                <Zap className="text-[#F97316]" size={28} />
                                            </div>
                                            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-widest text-center">n8n<br />Engine</p>
                                        </div>

                                        {/* Node 3: AI Agents / Actions */}
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] relative">
                                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse"></div>
                                                <Scan className="text-emerald-400" size={24} />
                                            </div>
                                            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest text-center">AI Agent<br />Workers</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Active Webhooks', value: automations.filter(a => a.active).length, color: 'var(--accent)' },
                                        { label: 'Total Rules', value: automations.length, color: 'var(--text-secondary)' },
                                        { label: 'Executions (24h)', value: todayLogs.length, color: 'var(--info)' },
                                        { label: 'Avg Success Rate', value: `${successRate}%`, color: successRate >= 80 ? '#4ade80' : '#f87171' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="canvas-card group">
                                            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                            <p className="text-3xl font-bold transition-transform group-hover:scale-[1.02]" style={{ color }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="glass-card p-0 overflow-hidden border border-white/10">
                                    <div className="bg-[#050505] p-4 flex items-center justify-between border-b border-white/10">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: 'var(--accent)' }}><Terminal size={14} /> Live Console Output</h3>
                                        <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Streaming
                                        </span>
                                    </div>

                                    <div className="p-4 bg-black min-h-[250px] max-h-[350px] overflow-y-auto font-mono text-xs space-y-1.5">
                                        {recentLogs.slice(0, 15).map(l => (
                                            <div key={l.id} className="flex items-start gap-4 hover:bg-white/[0.02] p-1 -mx-2 px-2 rounded group">
                                                <span className="text-white/30 whitespace-nowrap hidden sm:block">
                                                    [{new Date(l.created_at).toLocaleTimeString('pt-BR', { hour12: false })}]
                                                </span>
                                                <div className="w-3/12 truncate text-white/70 group-hover:text-white transition-colors">
                                                    {l.automations?.name || 'SYS_PROCESS'}
                                                </div>
                                                <div className="flex-1 text-white/50 truncate">
                                                    <span className="text-[#F97316]">EXEC</span> {l.client_name ? `Payload: { client: "${l.client_name}" }` : 'Internal ping'}
                                                </div>
                                                <div className={`w-16 text-right whitespace-nowrap ${l.status === 'success' ? 'text-emerald-400' : l.status === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {l.status === 'success' ? '200 OK' : '500 ERR'}
                                                </div>
                                            </div>
                                        ))}
                                        {recentLogs.length === 0 && <p className="text-white/30">Waiting for events...</p>}
                                        <div className="text-white/50 animate-pulse mt-2">_</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 1: Automations ── */}
                        {tab === 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-6">
                                    <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="input-canvas max-w-xs">
                                        <option value="">Todas as unidades ({units.length})</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>

                                {filtered.map(auto => {
                                    const successPct = auto.runs_count ? Math.round((auto.success_count || 0) / auto.runs_count * 100) : null;
                                    const lastRun = auto.last_run_at ? new Date(auto.last_run_at).toLocaleString('pt-BR') : 'Nunca executada';
                                    return (
                                        <div key={auto.id} className="canvas-card p-6">
                                            <div className="flex flex-col md:flex-row md:items-start gap-5">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={auto.active ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
                                                    <Zap size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <h3 className="text-base font-bold text-white">{auto.name}</h3>
                                                        <span className="text-[9px] px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-widest border" style={auto.active ? { background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.2)' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                                            {auto.active ? 'Ativa' : 'Inativa'}
                                                        </span>
                                                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{auto.units?.name}</span>
                                                    </div>
                                                    <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>Gatilho: <span style={{ color: 'var(--text-secondary)' }}>{TRIGGER_LABELS[auto.trigger_event] || auto.trigger_event}</span> &bull; Ação: <span style={{ color: 'var(--info)' }}>{auto.action_type === 'webhook' ? 'Webhook' : 'Notificação'}</span></p>

                                                    {/* Stats */}
                                                    <div className="flex items-center gap-4 mt-4 flex-wrap bg-black/40 p-2.5 rounded-xl border border-white/5">
                                                        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}><Clock size={12} /> {lastRun}</div>
                                                        <div className="w-px h-4 bg-white/10" />
                                                        <div className="flex items-center gap-3 text-xs font-mono font-bold">
                                                            <span style={{ color: 'var(--text-secondary)' }}>{auto.runs_count || 0} EXEC</span>
                                                            <span style={{ color: '#34d399' }}>{auto.success_count || 0} ✓</span>
                                                            {(auto.error_count || 0) > 0 && <span style={{ color: '#f87171' }}>{auto.error_count} ✕</span>}
                                                            {successPct !== null && <span style={{ color: successPct >= 80 ? '#34d399' : successPct >= 50 ? '#f59e0b' : '#f87171' }}>{successPct}% OK</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-wrap md:flex-col md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0 md:border-l md:pl-5">
                                                    <button onClick={() => handleToggle(auto)} className="btn-ghost text-xs w-full flex justify-center py-2 uppercase tracking-wide font-bold" style={auto.active ? { color: '#f59e0b' } : { color: '#34d399' }}>
                                                        {auto.active ? <Pause size={14} className="mr-1.5" /> : <Play size={14} className="mr-1.5" />} {auto.active ? 'Pausar' : 'Ativar'}
                                                    </button>
                                                    <button onClick={() => handleTest(auto)} disabled={testingId === auto.id} className="btn-ghost text-xs w-full flex justify-center py-2 uppercase tracking-wide font-bold disabled:opacity-50" style={{ color: 'var(--info)' }}>
                                                        {testingId === auto.id ? <RefreshCw size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />} Testar
                                                    </button>
                                                    <button onClick={() => handleDelete(auto)} disabled={deletingId === auto.id} className="btn-ghost text-xs w-full flex justify-center py-2 uppercase tracking-wide font-bold disabled:opacity-50" style={{ color: 'rgba(239, 68, 68, 0.7)' }}>
                                                        {deletingId === auto.id ? <RefreshCw size={14} className="mr-1.5 animate-spin" /> : <Trash2 size={14} className="mr-1.5" />} Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <div className="text-center py-24 canvas-card max-w-2xl mx-auto">
                                        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                                            <Zap size={24} />
                                        </div>
                                        <p className="text-lg font-bold text-white mb-2">Nenhuma automação encontrada</p>
                                        <button onClick={openModal} className="btn-canvas mt-4">
                                            <span className="corner-accent corner-tl"></span><span className="corner-accent corner-tr"></span>
                                            <span className="corner-accent corner-bl"></span><span className="corner-accent corner-br"></span>
                                            Criar primeira automação
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: History ── */}
                        {tab === 2 && (
                            <div className="space-y-4">
                                <div className="flex gap-3 mb-6">
                                    <select value={logFilters.status} onChange={e => setLogFilters(f => ({ ...f, status: e.target.value }))} className="input-canvas max-w-[200px]">
                                        <option value="">Todos os status</option>
                                        <option value="success">✅ Sucesso</option>
                                        <option value="error">❌ Erro</option>
                                    </select>
                                    <select value={logFilters.unitId} onChange={e => setLogFilters(f => ({ ...f, unitId: e.target.value }))} className="input-canvas max-w-[250px]">
                                        <option value="">Todas as unidades</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                {logs.data.map(l => (
                                    <div key={l.id} className="canvas-card overflow-hidden">
                                        <button onClick={() => setExpandedLog(expandedLog === l.id ? null : l.id)} className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]">
                                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.status === 'success' ? '#4ade80' : '#ef4444', boxShadow: `0 0 10px ${l.status === 'success' ? '#4ade8080' : '#ef444480'}` }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white font-mono truncate mb-0.5">{l.automations?.name}</p>
                                                <p className="text-[11px] font-mono truncate uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{l.client_name || 'N/A'}</p>
                                            </div>
                                            <div className="text-right mr-4 hidden sm:block">
                                                <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(l.created_at).toLocaleString('pt-BR')}</p>
                                                <div className="flex items-center justify-end gap-2 text-[10px] font-mono">
                                                    {l.duration_ms && <span style={{ color: 'var(--text-secondary)' }}>{l.duration_ms}ms</span>}
                                                    {l.response_status && <span className="px-1.5 py-0.5 rounded" style={l.response_status < 300 ? { background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' } : { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>{l.response_status}</span>}
                                                </div>
                                            </div>
                                            {expandedLog === l.id ? <ChevronUp size={16} style={{ color: 'var(--accent)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                        </button>
                                        {expandedLog === l.id && (
                                            <div className="px-6 pb-6 border-t border-white/[0.04] pt-5 space-y-4 bg-black/40">
                                                <div className="sm:hidden mb-4">
                                                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Data e Hora</p>
                                                    <p className="text-xs text-white">{new Date(l.created_at).toLocaleString('pt-BR')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--info)' }}><Code2 size={12} /> Payload Enviado</p>
                                                    <div className="bg-[#050505] rounded-xl p-4 text-[11px] font-mono border border-white/5 overflow-auto max-h-48" style={{ color: 'var(--text-secondary)' }}>
                                                        <pre>{JSON.stringify(l.payload, null, 2)}</pre>
                                                    </div>
                                                </div>
                                                {l.response_body && (
                                                    <div>
                                                        <p className="text-[10px] font-bold font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}><Layers size={12} /> Resposta Recebida</p>
                                                        <div className="bg-[#050505] rounded-xl p-4 text-[11px] font-mono border border-white/5 overflow-auto max-h-40" style={{ color: 'var(--text-muted)' }}>
                                                            <pre>{l.response_body}</pre>
                                                        </div>
                                                    </div>
                                                )}
                                                {l.status === 'error' && (
                                                    <div className="pt-2">
                                                        <button onClick={() => handleResend(l)} className="btn-canvas text-xs px-4 py-2 flex items-center gap-2 border-emerald-500/20 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400">
                                                            <RefreshCw size={14} /> Reenviar Webhook
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {logs.data.length === 0 && <p className="text-center py-16 font-mono text-sm text-neutral-500">Nenhum log encontrado</p>}
                                {logs.total > 20 && (
                                    <div className="flex justify-center gap-3 pt-6 font-mono uppercase">
                                        <button disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-30">← Anterior</button>
                                        <span className="text-xs font-bold tracking-widest flex items-center" style={{ color: 'var(--text-secondary)' }}>Página {logPage + 1} de {Math.ceil(logs.total / 20)}</span>
                                        <button disabled={(logPage + 1) * 20 >= logs.total} onClick={() => setLogPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-30">Próxima →</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: Config ── */}
                        {tab === 3 && (
                            <div className="canvas-card p-8 max-w-xl">
                                <h3 className="text-lg font-bold font-mono text-white mb-2 uppercase tracking-wide">Configurações Globais</h3>
                                <p className="text-sm font-mono text-neutral-500 mb-8">Opções gerais para processamento.</p>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-muted)' }}>Timeout de Requisição</label>
                                        <select className="input-canvas"><option>5 segundos</option><option>10 segundos</option><option>30 segundos</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-muted)' }}>Tentativas (Retries)</label>
                                        <select className="input-canvas"><option>1 tentativa</option><option>2 tentativas</option><option>3 tentativas</option></select>
                                    </div>
                                    <div className="pt-6 border-t border-white/5">
                                        <button className="btn-canvas w-full opacity-50 cursor-not-allowed uppercase tracking-wider font-bold text-xs" disabled>
                                            Salvar Configurações
                                        </button>
                                        <p className="text-[10px] mt-3 tracking-widest font-mono text-center text-neutral-500 uppercase">* Em breve</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
                    <div className="relative border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto dark-scroll shadow-2xl rounded-2xl animate-fadeIn" style={{ background: '#0B0B0F' }}>
                        {/* Modal header */}
                        <div className="sticky top-0 bg-[#0B0B0F]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-20">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Configurar Automação</h3>
                            <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-[var(--accent)] transition-colors"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Templates */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}><Zap size={12} /> Comece com um template</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(automationService.TEMPLATES).map(([k, t]) => (
                                        <button key={k} onClick={() => loadTemplate(k)}
                                            className="text-left p-4 rounded-xl border transition-all"
                                            style={form.name === t.name ? { border: '1px solid var(--border-accent)', background: 'var(--accent-dim)' } : { border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}
                                            onMouseEnter={e => { if (form.name !== t.name) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                            onMouseLeave={e => { if (form.name !== t.name) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                            <span className="text-xl mb-2 block">{TEMPLATE_ICONS[k] || '⚡'}</span>
                                            <p className="text-[11px] font-bold text-white mb-1 uppercase tracking-wide leading-tight">{t.name}</p>
                                            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{TRIGGER_LABELS[t.trigger_event]}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Unidade Alvo *</label>
                                        <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))} className={inp} required>
                                            <option value="">Selecione...</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nome da Regra *</label>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} required placeholder="Ex: Aviso WhatsApp Pronto" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descrição (opcional)</label>
                                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} placeholder="Para organização interna..." />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-xl bg-white/[0.02] border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}><Zap size={12} /> Gatilho</label>
                                        <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} className={inp}>
                                            {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><Clock size={12} /> Atraso / Delay (min)</label>
                                        <input type="number" min="0" value={form.delay_minutes} onChange={e => setForm(f => ({ ...f, delay_minutes: Number(e.target.value) }))} className={inp} placeholder="0 = Imediato" />
                                    </div>
                                </div>

                                {form.trigger_event === 'days_in_production' && (
                                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: '#f59e0b' }}>Quantidade de dias em produção</label>
                                        <input type="number" value={form.trigger_value} onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))} className={inp} placeholder="Ex: 7" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tipo de Ação</label>
                                    <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))} className={inp}>
                                        <option value="webhook">Disparar Webhook HTTP (n8n, Zapier, etc)</option>
                                        <option value="internal_notification">Notificação Interna de Sistema</option>
                                    </select>
                                </div>

                                {form.action_type === 'webhook' && (
                                    <div className="space-y-4 p-5 rounded-xl border border-[var(--border)] bg-black/20">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div className="sm:col-span-3">
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--info)' }}>URL de Destino *</label>
                                                <input value={form.webhook_url} onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))} className={inp} placeholder="https://seu-webhook.com/..." required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Método</label>
                                                <select value={form.webhook_method} onChange={e => setForm(f => ({ ...f, webhook_method: e.target.value }))} className={inp}>
                                                    <option>POST</option><option>GET</option><option>PUT</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-muted)' }}>Headers (JSON opcional)</label>
                                            <input value={form.webhook_headers} onChange={e => setForm(f => ({ ...f, webhook_headers: e.target.value }))} className={`${inp} font-mono`} placeholder='{"Authorization": "Bearer token..."}' />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>Corpo / Payload (JSON)</label>
                                        <button type="button" onClick={() => setPreviewVisible(v => !v)} className="btn-ghost flex items-center gap-1.5 text-[10px] py-1.5 px-3">
                                            <Eye size={12} /> {previewVisible ? 'Esconder Preview' : 'Ver Preview'}
                                        </button>
                                    </div>
                                    <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} className={`${inp} font-mono resize-y min-h-[120px] leading-relaxed`} placeholder='{"text": "Ref: {{cliente_nome}} - Status {{status}}"}' />

                                    <div className="mt-2.5">
                                        <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Variáveis Dinâmicas</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {VARIABLES.map(v => (
                                                <button key={v} type="button" onClick={() => setForm(f => ({ ...f, message_template: f.message_template + v }))}
                                                    className="text-[9px] font-mono px-2 py-1 rounded bg-white/[0.03] border border-[var(--border)] transition-colors hover:border-[var(--accent)]" style={{ color: 'var(--accent)' }}>
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {previewVisible && (
                                        <div className="mt-4 rounded-xl border border-[var(--border)] overflow-hidden bg-[#050508]">
                                            <div className="px-4 py-2 bg-white/[0.02] border-b border-[var(--border)] flex items-center gap-2">
                                                <Code2 size={12} style={{ color: 'var(--info)' }} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--info)' }}>Modo Preview (Amostra de dados)</span>
                                            </div>
                                            <pre className="p-4 text-[11px] font-mono overflow-auto max-h-64" style={{ color: 'var(--text-secondary)' }}>{preview}</pre>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
                                    <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1 py-3 text-xs">Cancelar</button>
                                    <button type="submit" className="btn-canvas flex-1 py-3 flex items-center justify-center gap-2">
                                        <span className="corner-accent corner-tl"></span><span className="corner-accent corner-tr"></span>
                                        <span className="corner-accent corner-bl"></span><span className="corner-accent corner-br"></span>
                                        <Zap size={14} /> Salvar Automação
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
