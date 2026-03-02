import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { formatCurrency } from '../../utils/helpers';
import { Plus, LogOut, Power, Eye, Send, Scan, Pencil, Trash2, X, AlertTriangle, TrendingUp, Building2, Zap, Terminal } from 'lucide-react';

// ─── Reusable input style ─────────────────────────────────────────────────────
const inp = `w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-200 text-sm`;

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ unit, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: unit.name || '',
        city: unit.city || '',
        email: unit.email || '',
        whatsapp: unit.whatsapp || '',
        active: unit.active,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSave() {
        if (!form.name.trim() || !form.city.trim()) {
            setError('Nome e cidade são obrigatórios.');
            return;
        }
        setSaving(true);
        setError('');
        const { success, data, error: err } = await unitService.updateUnit(unit.id, form);
        setSaving(false);
        if (!success) { setError(err || 'Erro ao salvar.'); return; }
        onSaved(data);
        onClose();
    }

    const f = (key, label, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inp} />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn" style={{ background: '#0B0B0F' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wide">Editar Unidade</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-[var(--accent)] transition-colors"><X size={18} /></button>
                </div>

                <div className="space-y-4">
                    {f('name', 'Nome da Ótica', 'text', 'Ex: Ótica Centro')}
                    {f('city', 'Cidade', 'text', 'São Paulo')}
                    {f('email', 'E-mail', 'email', 'contato@otica.com')}
                    {f('whatsapp', 'WhatsApp', 'text', '(11) 99999-9999')}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
                        <select value={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))} className={inp}>
                            <option value="true">Ativa</option>
                            <option value="false">Inativa</option>
                        </select>
                    </div>
                </div>

                {error && <p className="text-red-400 text-xs mt-3 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Canvas Deploy Modal ───────────────────────────────────────────────────────
function DeployModal({ onClose, onDeployed }) {
    const [form, setForm] = useState({ name: '', slug: '', webhook: '' });
    const [status, setStatus] = useState('idle'); // idle -> deploying -> done
    const [logs, setLogs] = useState([]);

    const runDeploySequence = async () => {
        setStatus('deploying');
        const appendLog = (msg, time = 600) => new Promise(res => {
            setTimeout(() => { setLogs(l => [...l, msg]); res(); }, time);
        });

        await appendLog('> Initializing Database... [OK]');
        await appendLog('> Allocating storage buckets... [OK]');

        // Simulating actual API call conceptually
        const { success, data, error } = await unitService.createUnit({
            name: form.name,
            slug: form.slug.toLowerCase().replace(/\s+/g, '-'),
            active: true
        });

        if (!success) {
            await appendLog(`> ERROR: ${error}`);
            setStatus('idle');
            return;
        }

        await appendLog('> Deploying AI Agents... [OK]');
        await appendLog(`> Connecting n8n Webhook: ${form.webhook || 'Skipped'}... [OK]`);
        await appendLog('> Setting up CRM Pipelines... [OK]');
        await appendLog('> System Online. Access Granted.', 1000);

        setStatus('done');
        setTimeout(() => {
            onDeployed(data);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => status === 'idle' && onClose()} />

            <div className="relative border border-white/10 rounded-xl p-[1px] w-full max-w-lg shadow-2xl animate-on-scroll overflow-hidden">
                {/* Canvas borders if deploying */}
                {status === 'deploying' && (
                    <>
                        <div className="beam-border-h"></div>
                        <div className="beam-border-v"></div>
                    </>
                )}

                <div className="bg-[#0A0A0A] p-8 rounded-xl relative z-10 font-mono">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Terminal className="text-[#F97316]" size={20} />
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest leading-none">Deploy Unit</h3>
                        </div>
                        {status === 'idle' && <button onClick={onClose} className="text-white/30 hover:text-[#F97316] transition-colors"><X size={20} /></button>}
                    </div>

                    {status === 'idle' ? (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Unit Name</label>
                                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: MegaVision Center" className="input-canvas" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">System Slug</label>
                                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ex: megavision" className="input-canvas" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">n8n Webhook URL (Optional)</label>
                                <input type="url" value={form.webhook} onChange={e => setForm(f => ({ ...f, webhook: e.target.value }))} placeholder="https://n8n.domain.com/webhook/..." className="input-canvas" />
                            </div>

                            <button onClick={runDeploySequence} disabled={!form.name || !form.slug} className="btn-canvas w-full mt-6 !py-3">
                                <span className="corner-accent corner-tl"></span><span className="corner-accent corner-tr"></span>
                                <span className="corner-accent corner-bl"></span><span className="corner-accent corner-br"></span>
                                <span className="text-sm font-bold tracking-wider uppercase">Execute Deploy</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-black border border-white/5 rounded-md p-4 h-48 overflow-y-auto text-xs text-emerald-400 space-y-1.5 leading-relaxed">
                            {logs.map((l, i) => (
                                <div key={i} className="animate-fadeIn">{l}</div>
                            ))}
                            {status === 'deploying' && (
                                <div className="animate-pulse">_</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ unit, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    async function handleDelete() {
        setDeleting(true);
        const { success, error: err } = await unitService.deleteUnit(unit.id);
        setDeleting(false);
        if (!success) { setError(err || 'Erro ao excluir.'); return; }
        onDeleted(unit.id);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn" style={{ background: '#0B0B0F' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white uppercase tracking-wider">Excluir Unidade</h3>
                        <p className="text-xs text-white/40 mt-0.5">Ação irreversível</p>
                    </div>
                </div>
                <p className="text-sm text-white/60 mb-1">Você está prestes a excluir permanentemente:</p>
                <p className="text-white font-semibold mb-4 text-lg">"{unit.name}"</p>
                <p className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 font-medium leading-relaxed">
                    ⚠️ Todos os clientes, agendamentos e dados associados serão excluídos em cascata.
                </p>
                {error && <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1 border-white/10">Cancelar</button>
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all disabled:opacity-60">
                        {deleting ? 'Excluindo...' : 'Definitivo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UnitsList() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [notification, setNotification] = useState({ open: false, target: 'all', message: '' });
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deployOpen, setDeployOpen] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const data = await unitService.getAllUnits();
        setUnits(data);
        setLoading(false);
    }

    async function handleToggle(unit) {
        const { success } = await unitService.toggleUnitActive(unit.id, !unit.active);
        if (success) setUnits(units.map(u => u.id === unit.id ? { ...u, active: !u.active } : u));
    }

    async function handleSend() {
        if (!notification.message.trim()) return;
        await unitService.createNotification({ unitId: notification.target, title: 'Mensagem do Admin', message: notification.message, type: 'info' });
        setNotification({ open: false, target: 'all', message: '' });
    }

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
                    <Link to="/master/unidades" className="px-3 py-2 rounded-lg text-xs font-bold transition-all bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center gap-2">
                        <Building2 size={14} className="text-[#F97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" /> Nodes
                    </Link>
                    <Link to="/master/automations" className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-white/[0.02] flex items-center gap-2 transition-all">
                        <Zap size={14} /> Automations
                    </Link>
                </nav>

                <div className="flex items-center gap-3 font-mono">
                    <button onClick={async () => { await logout(); navigate('/master/login'); }}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold tracking-widest uppercase rounded-lg border border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-all ml-2">
                        <LogOut size={14} /> Disconnect
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase" style={{ fontFamily: 'var(--font-sans)' }}>System <span className="text-[#F97316]">Nodes</span></h1>
                        <p className="text-xs uppercase font-mono tracking-widest mt-2 text-neutral-500">{units.length} unit(s) deployed</p>
                    </div>
                    <button onClick={() => setDeployOpen(true)} className="btn-canvas">
                        <span className="corner-accent corner-tl"></span>
                        <span className="corner-accent corner-tr"></span>
                        <span className="corner-accent corner-bl"></span>
                        <span className="corner-accent corner-br"></span>
                        <Plus size={16} /> New Node Deployment
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-24">
                        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
                    </div>
                ) : (
                    <div className="grid gap-4 stagger-children">
                        {units.map(unit => (
                            <div key={unit.id || unit.slug} className="glass-card p-6 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" style={{ background: 'var(--accent-glow)' }} />
                                <div className="flex flex-col lg:flex-row lg:items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 font-bold" style={unit.active ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
                                        {unit.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-white font-bold text-lg">{unit.name}</h3>
                                            <span className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest border`} style={unit.active ? { background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.2)' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                                {unit.active ? '● Ativa' : '● Inativa'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                                            {[
                                                { label: 'Cidade', val: unit.city || '—' },
                                                { label: 'Slug', val: unit.slug },
                                                { label: 'Clientes', val: unit.total_clients || '0' },
                                                { label: 'Faturamento', val: formatCurrency(unit.total_revenue || 0) },
                                            ].map(({ label, val }) => (
                                                <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                                    <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:border-l lg:border-[var(--border)] lg:pl-5 lg:ml-2">
                                        {/* Access */}
                                        <button onClick={() => navigate(`/${unit.slug}/dashboard`)} className="btn-accent flex items-center gap-1.5 px-3 py-2 text-xs">
                                            <Eye size={14} /> Acessar
                                        </button>

                                        {/* Toggle active */}
                                        <button onClick={() => handleToggle(unit)} title={unit.active ? 'Desativar' : 'Ativar'} className="p-2 rounded-lg transition-all border" style={unit.active ? { color: '#34d399', background: 'rgba(52, 211, 153, 0.05)', borderColor: 'rgba(52, 211, 153, 0.15)' } : { color: 'var(--text-muted)', background: 'transparent', borderColor: 'var(--border)' }}>
                                            <Power size={18} />
                                        </button>

                                        {/* Send notification */}
                                        <button onClick={() => setNotification({ open: true, target: unit.id, message: '' })} title="Enviar notificação" className="p-2 border border-[var(--border)] rounded-lg transition-all" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--info)'; e.currentTarget.style.borderColor = 'var(--info)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                            <Send size={18} />
                                        </button>

                                        {/* Edit */}
                                        <button onClick={() => setEditTarget(unit)} title="Editar unidade" className="p-2 border border-[var(--border)] rounded-lg transition-all" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                            <Pencil size={18} />
                                        </button>

                                        {/* Delete */}
                                        <button onClick={() => setDeleteTarget(unit)} title="Excluir unidade" className="p-2 border border-[var(--border)] rounded-lg transition-all" style={{ color: 'rgba(239, 68, 68, 0.6)' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Notification modal */}
                {notification.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setNotification(n => ({ ...n, open: false }))} />
                        <div className="relative border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn" style={{ background: '#0B0B0F' }}>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5" style={{ color: 'var(--info)' }}>Enviar Notificação</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Destinatário</label>
                                    <select value={notification.target} onChange={e => setNotification(n => ({ ...n, target: e.target.value }))} className={inp}>
                                        <option value="all">Todas as unidades</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Mensagem</label>
                                    <textarea value={notification.message} onChange={e => setNotification(n => ({ ...n, message: e.target.value }))} placeholder="Digite..." rows={3} className={`${inp} resize-none`} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setNotification(n => ({ ...n, open: false }))} className="btn-ghost flex-1">Cancelar</button>
                                    <button onClick={handleSend} className="btn-primary flex-1" style={{ background: 'var(--info)' }}>Enviar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit modal */}
                {editTarget && (
                    <EditModal
                        unit={editTarget}
                        onClose={() => setEditTarget(null)}
                        onSaved={updated => setUnits(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))}
                    />
                )}

                {/* Delete confirmation modal */}
                {deleteTarget && (
                    <DeleteModal
                        unit={deleteTarget}
                        onClose={() => setDeleteTarget(null)}
                        onDeleted={id => setUnits(prev => prev.filter(u => u.id !== id))}
                    />
                )}

                {/* Canvas Deploy Modal */}
                {deployOpen && (
                    <DeployModal
                        onClose={() => setDeployOpen(false)}
                        onDeployed={newUnit => setUnits(prev => [newUnit, ...prev])}
                    />
                )}
            </main>
        </div>
    );
}
