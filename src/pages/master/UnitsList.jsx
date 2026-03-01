import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { formatRelativeTime, formatCurrency } from '../../utils/helpers';
import { Plus, LogOut, Power, Eye, Send, ArrowLeft } from 'lucide-react';

export default function UnitsList() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [notification, setNotification] = useState({ open: false, target: 'all', message: '' });

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const data = await unitService.getAllUnits();
        setUnits(data);
        setLoading(false);
    }

    async function handleToggle(unit) {
        const { success } = await unitService.toggleUnitActive(unit.id, unit.active);
        if (success) {
            setUnits(units.map(u => u.id === unit.id ? { ...u, active: !u.active } : u));
        }
    }

    async function handleSend() {
        if (!notification.message.trim()) return;
        await unitService.createNotification({
            unitId: notification.target,
            title: 'Mensagem do Admin',
            message: notification.message,
            type: 'info'
        });
        setNotification({ open: false, target: 'all', message: '' });
    }

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            <header className="border-b border-gray-800/50 px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xl">👁</div>
                    <div>
                        <p className="text-xs text-gray-500">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Master Admin</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1 ml-8">
                    <Link to="/master/dashboard" className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">Dashboard</Link>
                    <Link to="/master/unidades" className="px-4 py-2 text-sm text-yellow-400 bg-yellow-400/10 rounded-lg font-medium">Unidades</Link>
                </nav>
                <div className="flex-1" />
                <button onClick={async () => { await logout(); navigate('/master/login'); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all">
                    <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
                </button>
            </header>

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gerenciar Unidades</h1>
                        <p className="text-gray-500 text-sm mt-1">{units.length} unidade(s) cadastrada(s)</p>
                    </div>
                    <Link
                        to="/master/unidades/nova"
                        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-yellow-500/30"
                    >
                        <Plus size={16} />
                        Nova Unidade
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Carregando unidades...</div>
                ) : (
                    <div className="grid gap-4">
                        {units.map(unit => (
                            <div key={unit.slug} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="text-white font-semibold text-lg">{unit.name}</h3>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${unit.active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-700/40 text-gray-500 border-gray-600/30'}`}>
                                                {unit.active ? '● Ativa' : '● Inativa'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                            {[
                                                { label: 'Cidade', val: unit.city },
                                                { label: 'Slug/ID', val: unit.slug },
                                                { label: 'Clientes', val: unit.total_clients || '0' },
                                                { label: 'Faturamento', val: formatCurrency(unit.total_revenue || 0) },
                                            ].map(({ label, val }) => (
                                                <div key={label} className="bg-gray-800/50 rounded-xl p-3">
                                                    <p className="text-xs text-gray-600">{label}</p>
                                                    <p className="text-sm font-semibold text-gray-300 mt-0.5">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-3">
                                            Admin: Não disponível · Último acesso: {unit.last_access ? formatRelativeTime(unit.last_access) : 'Nunca'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleToggle(unit)} title={unit.active ? 'Desativar' : 'Ativar'} className={`p-2.5 rounded-xl transition-all ${unit.active ? 'text-green-400 hover:bg-green-500/10 border border-green-500/20' : 'text-gray-500 hover:bg-gray-700 border border-gray-700'}`}>
                                            <Power size={16} />
                                        </button>
                                        <button onClick={() => setNotification({ open: true, target: unit.id, message: '' })} className="p-2.5 rounded-xl text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 border border-gray-700 transition-all" title="Enviar aviso">
                                            <Send size={16} />
                                        </button>
                                        <button onClick={() => navigate(`/${unit.slug}/dashboard`)} className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-sm font-medium rounded-xl transition-all">
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
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNotification(n => ({ ...n, open: false }))} />
                    <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md animate-fadeIn">
                        <h3 className="text-lg font-semibold text-white mb-4">Enviar Notificação</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1.5 block">Destinatário</label>
                                <select value={notification.target} onChange={e => setNotification(n => ({ ...n, target: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                                    <option value="all">Todas as unidades</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1.5 block">Mensagem</label>
                                <textarea value={notification.message} onChange={e => setNotification(n => ({ ...n, message: e.target.value }))} placeholder="Digite a mensagem..." rows={3} className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setNotification(n => ({ ...n, open: false }))} className="flex-1 py-2.5 text-sm text-gray-400 border border-gray-700 rounded-xl hover:border-gray-600 transition-all">Cancelar</button>
                                <button onClick={handleSend} className="flex-1 py-2.5 text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-all">Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
