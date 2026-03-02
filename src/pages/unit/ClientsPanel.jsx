import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { Plus, Search, ChevronRight, Package, Clock, CheckCircle, Truck, AlertTriangle } from 'lucide-react';

const STATUS_FILTERS = ['Todos', 'Novo', 'Em Produção', 'Pronto', 'Entregue'];

const STATUS_STYLING = {
    'Todos': { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-secondary)', border: 'transparent' },
    'Novo': { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
    'Em Produção': { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' },
    'Pronto': { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' },
    'Entregue': { bg: 'rgba(34, 197, 94, 0.1)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.2)' },
    'Cancelado': { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' },
};

const STATUS_ICONS = { 'Novo': Package, 'Em Produção': Clock, 'Pronto': CheckCircle, 'Entregue': Truck, 'Cancelado': AlertTriangle };

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
            <div className="max-w-[1440px] mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Pacientes & Clientes</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{filtered.length} registro(s) encontrado(s)</p>
                    </div>
                    <Link to={`/${slug}/clientes/novo`} className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                        <Plus size={16} /> Novo Atendimento
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou telefone..."
                            className="input-futuristic w-full pl-10"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center bg-white/[0.02] p-1.5 rounded-xl border border-white/[0.05]">
                        {STATUS_FILTERS.map(s => {
                            const isAct = statusFilter === s;
                            const st = STATUS_STYLING[s] || STATUS_STYLING['Todos'];
                            const Icon = STATUS_ICONS[s];
                            return (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isAct ? 'shadow-lg' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                                    style={isAct ? { background: st.bg, color: st.text, border: `1px solid ${st.border}` } : { color: 'var(--text-secondary)' }}
                                >
                                    {Icon && <Icon size={12} />} {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Clients list */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 glass-card">
                        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                            <Search size={24} />
                        </div>
                        <p className="text-lg font-bold text-white mb-1">Nenhum cliente encontrado</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ajuste os filtros ou cadastre um novo atendimento</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Cliente / Contato</th>
                                    <th>Status do Pedido</th>
                                    <th>Produto / Lente</th>
                                    <th>Valor Total</th>
                                    <th>Data Cadastro</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => {
                                    const st = STATUS_STYLING[c.status] || STATUS_STYLING['Novo'];
                                    const Icon = STATUS_ICONS[c.status] || Package;
                                    return (
                                        <tr key={c.id} className="group cursor-pointer" onClick={() => window.location.href = `/${slug}/clientes/${c.id}`}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}>
                                                        {(c.name || c.client_name)?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors">{c.name || c.client_name}</p>
                                                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{c.phone || 'Sem telefone'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-bold"
                                                    style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                                    <Icon size={12} /> {c.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-xs">
                                                    <p className="font-medium text-white/80">{c.lens_type || '—'}</p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.frame_brand ? `Armação: ${c.frame_brand}` : '—'}</p>
                                                </div>
                                            </td>
                                            <td className="font-semibold" style={{ color: 'var(--accent)' }}>
                                                {c.total_value ? `R$ ${Number(c.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                                            </td>
                                            <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="text-right">
                                                <ChevronRight size={16} className="inline-block opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" style={{ color: 'var(--accent)' }} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </UnitLayout>
    );
}
