import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { Plus, Search, ChevronRight, Package, Clock, CheckCircle, Truck, AlertTriangle, Link as LinkIcon, Activity } from 'lucide-react';

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
                        <h1 className="text-3xl font-black text-white tracking-tight">Client Overview</h1>
                        <p className="text-xs uppercase font-mono mt-2 text-neutral-500">Live monitoring & automation status</p>
                    </div>
                    <Link to={`/${slug}/clientes/novo`} className="btn-canvas">
                        <span className="corner-accent corner-tl"></span>
                        <span className="corner-accent corner-tr"></span>
                        <span className="corner-accent corner-bl"></span>
                        <span className="corner-accent corner-br"></span>
                        <Plus size={16} /> New Client
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou telefone..."
                            className="input-canvas pl-10"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(c => {
                            const st = STATUS_STYLING[c.status] || STATUS_STYLING['Novo'];
                            const Icon = STATUS_ICONS[c.status] || Package;
                            const isActive = c.status !== 'Cancelado';

                            return (
                                <div key={c.id} onClick={() => window.location.href = `/${slug}/clientes/${c.id}`} className="canvas-card p-5 rounded-md cursor-pointer flex flex-col group">
                                    {/* Card Header & Dot */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-sm bg-[#111] border border-white/10 flex items-center justify-center text-[#F97316] font-bold font-mono text-lg transition-colors group-hover:border-[#F97316]">
                                                {(c.name || c.client_name)?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-[#F97316] transition-colors">{c.name || c.client_name}</h3>
                                                <p className="text-xs font-mono text-neutral-500 mt-0.5">{c.phone || 'Sem telefone'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5" title={isActive ? 'System Active' : 'System Offline'}>
                                            <span className="relative flex h-2 w-2">
                                                {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500' : 'bg-neutral-600'}`}></span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="flex items-center gap-2 mb-5">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider px-2 py-1 rounded-sm border"
                                            style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                                            <Icon size={12} /> {c.status}
                                        </span>
                                        <span className="text-[10px] font-mono text-neutral-500 uppercase">
                                            {c.lens_type || 'N/A'}
                                        </span>
                                    </div>

                                    {/* n8n Automations Prep */}
                                    <div className="mt-auto border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Activity size={12} className="text-[#F97316]/70" />
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F97316]/70">Automations</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-2 py-1 bg-[#111] border border-white/5 rounded-sm text-[9px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Lead Capture: ON
                                            </span>
                                            <span className="px-2 py-1 bg-[#111] border border-white/5 rounded-sm text-[9px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span> Email Seq: RUNNING
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mt-4">
                                            <div className="font-mono font-bold text-white text-sm">
                                                {c.total_value ? `R$ ${Number(c.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                                            </div>
                                            <button className="text-[10px] font-mono uppercase text-neutral-500 hover:text-[#F97316] flex items-center gap-1.5 transition-colors" onClick={(e) => { e.stopPropagation(); /* logic here later */ }}>
                                                <LinkIcon size={12} /> Connect Workflow
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </UnitLayout>
    );
}
