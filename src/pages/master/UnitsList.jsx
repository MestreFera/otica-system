import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { formatCurrency } from '../../utils/helpers';
import { Plus, LogOut, Power, Eye, Send, Scan, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

// ─── Reusable input style ─────────────────────────────────────────────────────
const inp = `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white
 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/30
 focus:border-cyan-400 transition-all duration-200 text-sm`;

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
            <label className="block text-xs text-cyan-300/60 mb-1.5 font-medium uppercase tracking-wider">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className={inp}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#0d1225] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/60 animate-fadeIn">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Editar Unidade</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
                </div>

                <div className="space-y-4">
                    {f('name', 'Nome da Ótica', 'text', 'Ex: Ótica Centro')}
                    {f('city', 'Cidade', 'text', 'São Paulo')}
                    {f('email', 'E-mail', 'email', 'contato@otica.com')}
                    {f('whatsapp', 'WhatsApp', 'text', '(11) 99999-9999')}
                    <div>
                        <label className="block text-xs text-cyan-300/60 mb-1.5 font-medium uppercase tracking-wider">Status</label>
                        <select
                            value={form.active}
                            onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}
                            className={inp}
                        >
                            <option value="true">Ativa</option>
                            <option value="false">Inativa</option>
                        </select>
                    </div>
                </div>

                {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm text-white/50 border border-white/10 hover:border-white/30 hover:text-white rounded-xl transition-all">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60">
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
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
            <div className="relative bg-[#0d1225] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/60 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Excluir Unidade</h3>
                        <p className="text-xs text-white/40 mt-0.5">Esta ação não pode ser desfeita</p>
                    </div>
                </div>

                <p className="text-sm text-white/60 mb-1">
                    Você está prestes a excluir permanentemente:
                </p>
                <p className="text-white font-semibold mb-4">"{unit.name}"</p>
                <p className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-5">
                    ⚠️ Todos os clientes, agendamentos e dados associados serão excluídos em cascata.
                </p>

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm text-white/50 border border-white/10 hover:border-white/30 hover:text-white rounded-xl transition-all">
                        Cancelar
                    </button>
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all disabled:opacity-60">
                        {deleting ? 'Excluindo...' : 'Sim, Excluir'}
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
    const [editTarget, setEditTarget] = useState(null); // unit being edited
    const [deleteTarget, setDeleteTarget] = useState(null); // unit being deleted

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const data = await unitService.getAllUnits();
        setUnits(data);
        setLoading(false);
    }

    async function handleToggle(unit) {
        const { success } = await unitService.toggleUnitActive(unit.id, unit.active);
        if (success) setUnits(units.map(u => u.id === unit.id ? { ...u, active: !u.active } : u));
    }

    async function handleSend() {
        if (!notification.message.trim()) return;
        await unitService.createNotification({ unitId: notification.target, title: 'Mensagem do Admin', message: notification.message, type: 'info' });
        setNotification({ open: false, target: 'all', message: '' });
    }

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            <header className="border-b border-white/[0.04] px-6 py-4 flex items-center gap-4 bg-[#0d1225]/60 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="logo-icon"><Scan size={20} className="text-white" /></div>
                    <div>
                        <p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-widest">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Master Admin</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1 ml-8">
                    <Link to="/master/dashboard" className="px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">Dashboard</Link>
                    <Link to="/master/unidades" className="px-4 py-2 text-sm text-cyan-400 bg-cyan-400/10 rounded-lg font-medium border border-cyan-400/20">Unidades</Link>
                </nav>
                <div className="flex-1" />
                <button onClick={async () => { await logout(); navigate('/master/login'); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
                </button>
            </header>

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gerenciar <span className="text-cyan-400">Unidades</span></h1>
                        <p className="text-white/30 text-sm mt-1">{units.length} unidade(s) cadastrada(s)</p>
                    </div>
                    <Link to="/master/unidades/nova" className="flex items-center gap-2 btn-primary text-sm px-4 py-2.5">
                        <Plus size={16} /> Nova Unidade
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-white/30">
                        <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
                        Carregando unidades...
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {units.map(unit => (
                            <div key={unit.id || unit.slug} className="glass-card p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="text-white font-semibold text-lg">{unit.name}</h3>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${unit.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                                {unit.active ? '● Ativa' : '● Inativa'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                            {[
                                                { label: 'Cidade', val: unit.city },
                                                { label: 'Slug', val: unit.slug },
                                                { label: 'Clientes', val: unit.total_clients || '0' },
                                                { label: 'Faturamento', val: formatCurrency(unit.total_revenue || 0) },
                                            ].map(({ label, val }) => (
                                                <div key={label} className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                                                    <p className="text-[10px] text-white/25 uppercase tracking-wider">{label}</p>
                                                    <p className="text-sm font-semibold text-white/70 mt-0.5">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Toggle active */}
                                        <button onClick={() => handleToggle(unit)} title={unit.active ? 'Desativar' : 'Ativar'} className={`p-2.5 rounded-xl transition-all ${unit.active ? 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20' : 'text-white/30 hover:bg-white/5 border border-white/10'}`}>
                                            <Power size={16} />
                                        </button>

                                        {/* Send notification */}
                                        <button onClick={() => setNotification({ open: true, target: unit.id, message: '' })} title="Enviar notificação" className="p-2.5 rounded-xl text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/10 transition-all">
                                            <Send size={16} />
                                        </button>

                                        {/* Edit */}
                                        <button onClick={() => setEditTarget(unit)} title="Editar unidade" className="p-2.5 rounded-xl text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10 border border-white/10 transition-all">
                                            <Pencil size={16} />
                                        </button>

                                        {/* Delete */}
                                        <button onClick={() => setDeleteTarget(unit)} title="Excluir unidade" className="p-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-all">
                                            <Trash2 size={16} />
                                        </button>

                                        {/* Access */}
                                        <button onClick={() => navigate(`/${unit.slug}/dashboard`)} className="flex items-center gap-1.5 px-3 py-2.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 text-sm font-medium rounded-xl transition-all">
                                            <Eye size={14} /> Acessar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notification modal */}
            {notification.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setNotification(n => ({ ...n, open: false }))} />
                    <div className="relative glass-card glow-border p-6 w-full max-w-md animate-fadeIn">
                        <h3 className="text-lg font-semibold text-white mb-4">Enviar Notificação</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-cyan-300/70 mb-1.5 block">Destinatário</label>
                                <select value={notification.target} onChange={e => setNotification(n => ({ ...n, target: e.target.value }))} className="input-futuristic w-full">
                                    <option value="all">Todas as unidades</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-cyan-300/70 mb-1.5 block">Mensagem</label>
                                <textarea value={notification.message} onChange={e => setNotification(n => ({ ...n, message: e.target.value }))} placeholder="Digite..." rows={3} className="input-futuristic w-full resize-none" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setNotification(n => ({ ...n, open: false }))} className="btn-ghost flex-1">Cancelar</button>
                                <button onClick={handleSend} className="btn-primary flex-1">Enviar</button>
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
        </div>
    );
}
