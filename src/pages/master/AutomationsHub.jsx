import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { automationService } from '../../services/automationService';
import { unitService } from '../../services/unitService';
import { useToastStore } from '../../components/ui/Toast';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { Scan, LogOut, Zap, History, Settings, BarChart2, Plus, Play, Pause, Trash2, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const TABS = ['Visão Geral', 'Automações', 'Histórico', 'Configurações'];

const TRIGGER_LABELS = {
    status_changed: 'Status alterado', status_novo: 'Pedido Novo', status_producao: 'Em Produção',
    status_pronto: 'Pronto para Retirada', status_entregue: 'Pedido Entregue', status_cancelado: 'Pedido Cancelado',
    client_created: 'Novo cliente cadastrado', appointment_created: 'Novo agendamento',
    days_in_production: 'Dias em produção', payment_overdue: 'Pagamento pendente',
};

const VARIABLES = ['{{cliente_nome}}', '{{cliente_telefone}}', '{{cliente_email}}', '{{status}}', '{{unidade}}', '{{valor_total}}', '{{valor_pendente}}', '{{data}}'];

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

    const [form, setForm] = useState({
        unit_id: '', name: '', description: '', trigger_event: 'status_pronto',
        trigger_value: '', action_type: 'webhook', webhook_url: '', webhook_method: 'POST',
        webhook_headers: '{}', message_template: '', active: true,
    });

    useEffect(() => { loadAll(); }, []);
    useEffect(() => { if (tab === 2) loadLogs(); }, [tab, logPage, logFilters]);

    async function loadAll() {
        setLoading(true);
        const [autos, u, recent] = await Promise.all([
            automationService.getAll(), unitService.getAllUnits(), automationService.getRecentLogs()
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

    async function handleCreate(e) {
        e.preventDefault();
        const { success, error } = await automationService.create(form);
        if (success) {
            addToast({ type: 'success', message: 'Automação criada!' });
            setModalOpen(false);
            loadAll();
        } else addToast({ type: 'error', message: error });
    }

    async function handleTest(auto) {
        addToast({ type: 'info', message: 'Testando automação...' });
        const result = await automationService.execute(auto, { client_name: 'Teste', phone: '(11)99999-0000', status: 'Pronto', unit_name: auto.units?.name || '' });
        addToast({ type: result.status === 'success' ? 'success' : 'error', message: result.status === 'success' ? 'Teste enviado com sucesso!' : 'Erro no teste: ' + (result.response_body || '') });
        loadAll();
    }

    async function handleResend(log) {
        const auto = await automationService.getById(log.automation_id);
        if (!auto) return addToast({ type: 'error', message: 'Automação não encontrada' });
        const result = await automationService.execute(auto, log.payload || {});
        addToast({ type: result.status === 'success' ? 'success' : 'error', message: result.status === 'success' ? 'Reenviado com sucesso!' : 'Falha no reenvio' });
        loadLogs();
    }

    function loadTemplate(key) {
        const t = automationService.TEMPLATES[key];
        if (t) setForm(f => ({ ...f, name: t.name, trigger_event: t.trigger_event, message_template: t.message_template }));
    }

    const filtered = filterUnit ? automations.filter(a => a.unit_id === filterUnit) : automations;

    // Stats
    const todayLogs = recentLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString());
    const successRate = recentLogs.length ? Math.round(recentLogs.filter(l => l.status === 'success').length / recentLogs.length * 100) : 0;

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            {/* Header */}
            <header className="border-b border-white/[0.04] px-6 py-4 flex items-center gap-4 bg-[#0d1225]/60 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="logo-icon"><Scan size={20} className="text-white" /></div>
                    <div><p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-widest">ÓticaSystem</p><p className="text-sm font-bold text-white">Hub de Automações</p></div>
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
                        <button key={t} onClick={() => setTab(i)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === i ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/25' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
                            {[<BarChart2 size={14} />, <Zap size={14} />, <History size={14} />, <Settings size={14} />][i]}
                            <span className="ml-2">{t}</span>
                        </button>
                    ))}
                </div>

                {loading ? <>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</> : (
                    <>
                        {/* TAB 0: Overview */}
                        {tab === 0 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="metric-card"><p className="text-xs text-white/25 uppercase tracking-wider">Automações Ativas</p><p className="text-3xl font-bold text-white mt-1">{automations.filter(a => a.active).length}</p></div>
                                    <div className="metric-card"><p className="text-xs text-white/25 uppercase tracking-wider">Execuções Hoje</p><p className="text-3xl font-bold text-white mt-1">{todayLogs.length}</p></div>
                                    <div className="metric-card"><p className="text-xs text-white/25 uppercase tracking-wider">Taxa de Sucesso</p><p className="text-3xl font-bold text-emerald-400 mt-1">{successRate}%</p></div>
                                </div>
                                {/* Recent feed */}
                                <div className="glass-card p-6">
                                    <h3 className="text-sm font-bold text-white mb-4">Últimas Execuções</h3>
                                    <div className="space-y-2">
                                        {recentLogs.slice(0, 10).map(l => (
                                            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.status === 'success' ? 'bg-emerald-400' : l.status === 'error' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                                <span className="text-xs text-white/60 flex-1">{l.automations?.name || 'Automação'} — {l.client_name || 'Sistema'}</span>
                                                <span className="text-[10px] text-white/20">{new Date(l.created_at).toLocaleTimeString('pt-BR')}</span>
                                                {l.duration_ms && <span className="text-[10px] text-white/15">{l.duration_ms}ms</span>}
                                            </div>
                                        ))}
                                        {recentLogs.length === 0 && <p className="text-white/15 text-sm text-center py-6">Nenhuma execução recente</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 1: Automations List */}
                        {tab === 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="input-futuristic text-xs py-2">
                                            <option value="">Todas as unidades</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => { setForm({ unit_id: units[0]?.id || '', name: '', description: '', trigger_event: 'status_pronto', trigger_value: '', action_type: 'webhook', webhook_url: '', webhook_method: 'POST', webhook_headers: '{}', message_template: '', active: true }); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Nova Automação</button>
                                </div>

                                {filtered.map(auto => (
                                    <div key={auto.id} className="glass-card p-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${auto.active ? 'bg-cyan-400/15 text-cyan-400' : 'bg-white/5 text-white/20'}`}><Zap size={18} /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-white">{auto.name}</h3><span className={`text-[10px] px-2 py-0.5 rounded-full border ${auto.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/30 border-white/10'}`}>{auto.active ? 'Ativa' : 'Inativa'}</span></div>
                                                <p className="text-xs text-white/30 mt-0.5">{auto.units?.name} · {TRIGGER_LABELS[auto.trigger_event] || auto.trigger_event} → {auto.action_type === 'webhook' ? 'Webhook' : 'Notificação'}</p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-white/20">
                                                <span>{auto.runs_count || 0} exec</span>
                                                <span className="text-emerald-400/60">{auto.success_count || 0}✓</span>
                                                {(auto.error_count || 0) > 0 && <span className="text-red-400/60">{auto.error_count}✕</span>}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleToggle(auto)} className={`p-2 rounded-lg transition-all ${auto.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white/20 hover:bg-white/5'}`}>{auto.active ? <Pause size={14} /> : <Play size={14} />}</button>
                                                <button onClick={() => handleTest(auto)} className="p-2 rounded-lg text-cyan-400/60 hover:bg-cyan-500/10 transition-all"><RefreshCw size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filtered.length === 0 && <div className="text-center py-12 text-white/15"><Zap size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhuma automação criada</p></div>}
                            </div>
                        )}

                        {/* TAB 2: History */}
                        {tab === 2 && (
                            <div className="space-y-4">
                                <div className="flex gap-2 flex-wrap">
                                    <select value={logFilters.status} onChange={e => setLogFilters(f => ({ ...f, status: e.target.value }))} className="input-futuristic text-xs py-2"><option value="">Todos os status</option><option value="success">Sucesso</option><option value="error">Erro</option></select>
                                    <select value={logFilters.unitId} onChange={e => setLogFilters(f => ({ ...f, unitId: e.target.value }))} className="input-futuristic text-xs py-2"><option value="">Todas as unidades</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                                </div>
                                {logs.data.map(l => (
                                    <div key={l.id} className="glass-card">
                                        <button onClick={() => setExpandedLog(expandedLog === l.id ? null : l.id)} className="w-full flex items-center gap-3 p-4 text-left">
                                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                            <span className="text-sm text-white/70 flex-1">{l.automations?.name} — {l.client_name || 'N/A'}</span>
                                            <span className="text-xs text-white/20">{l.duration_ms}ms</span>
                                            <span className="text-xs text-white/15">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
                                            {expandedLog === l.id ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                                        </button>
                                        {expandedLog === l.id && (
                                            <div className="px-4 pb-4 border-t border-white/[0.03] pt-3 space-y-2">
                                                <div className="bg-black/30 rounded-lg p-3 text-xs font-mono text-white/40 overflow-auto max-h-32"><pre>{JSON.stringify(l.payload, null, 2)}</pre></div>
                                                {l.response_body && <div className="bg-black/30 rounded-lg p-3 text-xs font-mono text-white/30 overflow-auto max-h-32"><pre>{l.response_body}</pre></div>}
                                                {l.status === 'error' && <button onClick={() => handleResend(l)} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"><RefreshCw size={12} /> Reenviar</button>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {logs.total > 20 && (
                                    <div className="flex justify-center gap-2">
                                        <button disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)} className="btn-ghost text-xs">← Anterior</button>
                                        <span className="text-xs text-white/20 py-2">Página {logPage + 1} de {Math.ceil(logs.total / 20)}</span>
                                        <button disabled={(logPage + 1) * 20 >= logs.total} onClick={() => setLogPage(p => p + 1)} className="btn-ghost text-xs">Próxima →</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: Config */}
                        {tab === 3 && (
                            <div className="glass-card p-6 max-w-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Configurações Globais</h3>
                                <p className="text-sm text-white/30 mb-6">Configure defaults para webhooks e comportamento de retry.</p>
                                <div className="space-y-4">
                                    <div><label className="text-xs text-cyan-300/60 uppercase tracking-wider block mb-1.5">Timeout de Requisição</label>
                                        <select className="input-futuristic w-full"><option>5 segundos</option><option>10 segundos</option><option>30 segundos</option></select>
                                    </div>
                                    <div><label className="text-xs text-cyan-300/60 uppercase tracking-wider block mb-1.5">Tentativas em caso de erro</label>
                                        <select className="input-futuristic w-full"><option>1 tentativa</option><option>2 tentativas</option><option>3 tentativas</option></select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setModalOpen(false)} />
                    <div className="relative glass-card glow-border p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto dark-scroll animate-fadeIn">
                        <h3 className="text-xl font-bold text-white mb-5">Nova Automação</h3>

                        {/* Templates */}
                        <div className="mb-5">
                            <p className="text-xs text-cyan-400/60 uppercase tracking-widest mb-2">Templates Prontos</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(automationService.TEMPLATES).map(([k, t]) => (
                                    <button key={k} onClick={() => loadTemplate(k)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-400/20 transition-all">{t.name}</button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-cyan-300/60 block mb-1.5">Unidade</label>
                                    <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))} className="input-futuristic w-full" required>
                                        <option value="">Selecionar...</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-xs text-cyan-300/60 block mb-1.5">Nome</label>
                                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-futuristic w-full" required />
                                </div>
                            </div>
                            <div><label className="text-xs text-cyan-300/60 block mb-1.5">Descrição</label>
                                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-futuristic w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-cyan-300/60 block mb-1.5">Gatilho</label>
                                    <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} className="input-futuristic w-full">
                                        {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-xs text-cyan-300/60 block mb-1.5">Ação</label>
                                    <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))} className="input-futuristic w-full">
                                        <option value="webhook">Webhook (n8n, Make, Zapier)</option>
                                        <option value="internal_notification">Notificação Interna</option>
                                    </select>
                                </div>
                            </div>
                            {form.trigger_event === 'days_in_production' && (
                                <div><label className="text-xs text-cyan-300/60 block mb-1.5">Dias em produção</label>
                                    <input type="number" value={form.trigger_value} onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))} className="input-futuristic w-full" placeholder="7" />
                                </div>
                            )}
                            {form.action_type === 'webhook' && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2"><label className="text-xs text-cyan-300/60 block mb-1.5">URL do Webhook</label>
                                            <input value={form.webhook_url} onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))} className="input-futuristic w-full" placeholder="https://..." />
                                        </div>
                                        <div><label className="text-xs text-cyan-300/60 block mb-1.5">Método</label>
                                            <select value={form.webhook_method} onChange={e => setForm(f => ({ ...f, webhook_method: e.target.value }))} className="input-futuristic w-full"><option>POST</option><option>GET</option></select>
                                        </div>
                                    </div>
                                    <div><label className="text-xs text-cyan-300/60 block mb-1.5">Headers (JSON)</label>
                                        <input value={form.webhook_headers} onChange={e => setForm(f => ({ ...f, webhook_headers: e.target.value }))} className="input-futuristic w-full font-mono text-xs" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-xs text-cyan-300/60 block mb-1.5">Template do Payload</label>
                                <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} className="input-futuristic w-full font-mono text-xs resize-none" rows={4} />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {VARIABLES.map(v => (<button key={v} type="button" onClick={() => setForm(f => ({ ...f, message_template: f.message_template + v }))} className="text-[10px] px-2 py-1 rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 transition-all">{v}</button>))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Criar Automação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
