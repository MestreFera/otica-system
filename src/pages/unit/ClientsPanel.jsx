import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { Plus, Search } from 'lucide-react';

const STATUS_FILTERS = ['Todos', 'Novo', 'Em Produção', 'Pronto', 'Entregue'];

export default function ClientsPanel() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    useEffect(() => {
        if (!unitId) return;
        async function load() {
            setLoading(true);
            const data = await clientService.getClients(unitId);
            setClients(data);
            setLoading(false);
        }
        load();
    }, [unitId]);

    const filtered = clients.filter(c => {
        const matchSearch = !search || (c.name || c.client_name)?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
        const matchStatus = statusFilter === 'Todos' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <UnitLayout slug={slug}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clientes</h1>
                    <p className="text-white/30 text-sm mt-1">{filtered.length} resultado(s)</p>
                </div>
                <Link to={`/${slug}/clientes/novo`} className="flex items-center gap-2 btn-primary text-sm px-4 py-2.5">
                    <Plus size={16} /> Novo Atendimento
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou telefone..."
                        className="input-futuristic w-full pl-10"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {STATUS_FILTERS.map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s
                                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/25'
                                : 'text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients list */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-white/20">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                    <p className="text-sm mt-1">Ajuste os filtros ou cadestre um novo atendimento</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map(c => (
                        <Link key={c.id} to={`/${slug}/clientes/${c.id}`} className="glass-card p-4 group block hover:border-cyan-400/15">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/15 to-purple-500/15 border border-white/[0.06] flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {(c.name || c.client_name)?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-white/80 group-hover:text-white">{c.name || c.client_name}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${c.status === 'Entregue' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                                            c.status === 'Pronto' ? 'bg-purple-500/15 text-purple-400 border-purple-500/25' :
                                                c.status === 'Em Produção' ? 'bg-amber-500/12 text-amber-400 border-amber-500/20' :
                                                    c.status === 'Novo' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                                                        'bg-white/5 text-white/30 border-white/10'
                                            }`}>{c.status}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-xs text-white/25">{c.phone || 'Sem telefone'}</p>
                                        <p className="text-xs text-white/25">{c.lens_type || 'Sem lente'}</p>
                                        {c.total_value && <p className="text-xs text-emerald-400/70 font-medium">R$ {Number(c.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                                    </div>
                                </div>
                                <span className="text-white/15 group-hover:text-cyan-400/50 transition-colors text-sm">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </UnitLayout>
    );
}
