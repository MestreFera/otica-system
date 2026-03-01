import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { Input, Select } from '../../components/ui';
import { formatCurrency, getStatusStyle, STATUS_ORDER } from '../../utils/helpers';
import { Search, Plus, Filter, Users, Eye } from 'lucide-react';

export default function ClientsPanel() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;
    const [searchParams, setSearchParams] = useSearchParams();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'Todos');

    useEffect(() => {
        if (!unitId) return;
        async function loadClients() {
            setLoading(true);
            const data = await clientService.getClients(unitId, {
                status: statusFilter !== 'Todos' ? statusFilter : undefined,
                name: searchTerm || undefined
            });
            setClients(data);
            setLoading(false);
        }
        // Debounce search
        const timeoutId = setTimeout(loadClients, 300);
        return () => clearTimeout(timeoutId);
    }, [unitId, searchTerm, statusFilter]);

    // Update URL when filter changes
    useEffect(() => {
        if (statusFilter === 'Todos') {
            searchParams.delete('status');
        } else {
            searchParams.set('status', statusFilter);
        }
        setSearchParams(searchParams, { replace: true });
    }, [statusFilter, setSearchParams, searchParams]);

    return (
        <UnitLayout slug={slug}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerenciamento de clientes e pedidos</p>
                </div>
                <Link
                    to={`/${slug}/clientes/novo`}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-200"
                >
                    <Plus size={18} />
                    <span>Novo Cliente</span>
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, telefone ou CPF..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="w-full md:w-64 flex items-center gap-3">
                        <Filter className="text-gray-400" size={18} />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                        >
                            <option value="Todos">Todos os Status</option>
                            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-indigo-600 font-medium bg-white px-4 py-2 rounded-xl shadow-lg">
                            <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            Atualizando...
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 hidden sm:table-row">
                                <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contato</th>
                                <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {clients.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="4" className="py-16 text-center text-gray-400">
                                        <Users size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-base font-medium text-gray-600">Nenhum cliente encontrado</p>
                                        {searchTerm || statusFilter !== 'Todos' ? (
                                            <button onClick={() => { setSearchTerm(''); setStatusFilter('Todos'); }} className="text-sm text-indigo-500 hover:underline mt-1">Limpar filtros</button>
                                        ) : (
                                            <p className="text-sm">Cadastre o primeiro cliente da unidade</p>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                clients.map(client => {
                                    const style = getStatusStyle(client.status);
                                    return (
                                        <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500">
                                                        {client.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{client.name}</p>
                                                        <p className="text-xs text-gray-400 truncate sm:w-auto w-32">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                                {/* Mobile only content */}
                                                <div className="sm:hidden mt-2 flex flex-col gap-1">
                                                    <p className="text-xs text-gray-500">{client.phone || client.email}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border leading-none" style={{ background: style.bg, color: style.color, borderColor: style.border }}>{client.status}</span>
                                                        <span className="text-sm font-bold text-gray-700">{formatCurrency(client.total_value)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 hidden md:table-cell">
                                                <p className="text-sm text-gray-800">{client.phone || '-'}</p>
                                                <p className="text-xs text-gray-400">{client.email || '-'}</p>
                                            </td>
                                            <td className="py-4 px-5 hidden sm:table-cell">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <Link to={`/${slug}/clientes/${client.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">
                                                    <Eye size={16} />
                                                    <span className="hidden sm:inline">Detalhes</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </UnitLayout>
    );
}
