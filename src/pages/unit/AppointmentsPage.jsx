import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UnitLayout from '../../components/UnitLayout';
import { unitTablesService } from '../../services/unitTablesService';
import { Calendar as CalendarIcon, Loader2, Plus, Clock, Search, MapPin, User, CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppointmentsPage() {
    const { slug } = useParams();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('HOJE'); // 'HOJE' | 'ESTA SEMANA' | 'PRÓXIMOS' | 'TODOS'
    const [searchTerm, setSearchTerm] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        nome_cliente: '',
        telefone_cliente: '',
        data_agendamento: '',
        hora: '',
        tipo: 'Consulta',
        observacoes: ''
    });

    useEffect(() => {
        if (!slug) return;
        loadData();
    }, [slug, filterPeriod]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await unitTablesService.getAgendamentos(slug, filterPeriod);
            setAppointments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = appointments.filter(a => {
        const search = searchTerm.toLowerCase();
        return (a.nome_cliente?.toLowerCase() || '').includes(search) ||
            (a.telefone_cliente || '').includes(search);
    });

    async function handleStatusChange(id, newStatus) {
        try {
            await unitTablesService.updateAgendamento(slug, id, newStatus);
            await loadData();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await unitTablesService.createAgendamento(slug, formData);
            setShowModal(false);
            setFormData({
                nome_cliente: '',
                telefone_cliente: '',
                data_agendamento: '',
                hora: '',
                tipo: 'Consulta',
                observacoes: ''
            });
            await loadData();
        } catch (error) {
            alert('Erro ao criar agendamento');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[1200px] mx-auto pb-24 flex flex-col h-screen pt-4 gap-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <CalendarIcon className="text-[#FF6B2B]" size={28} />
                            Agendamentos
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            Gerencie consultas e retornos de clientes (Visualizando {filterPeriod})
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="h-11 px-5 rounded-xl font-bold flex items-center gap-2 bg-[#FF6B2B] hover:bg-[#ff7b42] text-white transition-all shadow-lg shadow-[#FF6B2B]/20 w-full md:w-auto"
                    >
                        <Plus size={18} />
                        Novo Agendamento
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-between">
                    <div className="flex items-center gap-1 bg-[#111118] p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto dark-scroll">
                        {['HOJE', 'ESTA SEMANA', 'PRÓXIMOS', 'TODOS'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterPeriod(f)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterPeriod === f ? 'bg-[#FF6B2B] text-white shadow-lg shadow-[#FF6B2B]/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar agendamento..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#111118] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B2B]/50 transition-colors text-sm"
                        />
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto dark-scroll pr-2 -mr-2 space-y-4 pb-24">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                            <Loader2 size={32} className="animate-spin mb-4 text-[#FF6B2B]" />
                            <p>Carregando agenda...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-[#111118] border border-white/5 rounded-2xl">
                            <CalendarIcon size={48} className="mb-4 opacity-20" />
                            <p>Nenhum agendamento encontrado para este período.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(app => (
                                <div key={app.id} className="bg-[#111118] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col h-full relative group overflow-hidden">
                                    {/* Left accent color based on status */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${app.status === 'Agendado' ? 'bg-[#FF6B2B]' : app.status === 'Concluído' ? 'bg-green-500' : 'bg-red-500'}`} />

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white leading-tight">{app.nome_cliente || 'Sem Nome'}</h3>
                                            <p className="text-sm text-neutral-400 font-mono mt-1">{app.telefone_cliente}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border 
                                            ${app.status === 'Agendado' ? 'bg-[#FF6B2B]/20 text-[#FF6B2B] border-[#FF6B2B]/30' :
                                                app.status === 'Concluído' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                    'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-6 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                                            <CalendarIcon size={14} className="text-[#FF6B2B]" />
                                            {app.data_agendamento ? format(parseISO(app.data_agendamento), "dd 'de' MMMM", { locale: ptBR }) : ''} às {app.hora}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                                            <User size={14} className="text-[#FF6B2B]" />
                                            {app.tipo}
                                        </div>
                                        {app.observacoes && (
                                            <div className="mt-4 p-3 rounded-xl bg-white/5 text-xs text-neutral-400 italic">
                                                "{app.observacoes}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {app.status === 'Agendado' && (
                                        <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => handleStatusChange(app.id, 'Cancelado')}
                                                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-colors text-xs"
                                            >
                                                <XCircle size={14} /> Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(app.id, 'Concluído')}
                                                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold transition-colors text-xs"
                                            >
                                                <CheckCircle2 size={14} /> Concluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Novo Agendamento */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-transparent via-[#FF6B2B]/5 to-transparent">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-[#FF6B2B]" />
                                Novo Agendamento
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Nome do Cliente *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome_cliente}
                                    onChange={e => setFormData({ ...formData, nome_cliente: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#FF6B2B]/50 focus:ring-1 focus:ring-[#FF6B2B]/50 transition-all outline-none"
                                    placeholder="Ex: Ana Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Telefone *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.telefone_cliente}
                                        onChange={e => setFormData({ ...formData, telefone_cliente: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#FF6B2B]/50 transition-all outline-none font-mono"
                                        placeholder="11999999999"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#FF6B2B]/50 transition-all outline-none appearance-none"
                                    >
                                        <option value="Consulta">Consulta</option>
                                        <option value="Retorno">Retorno</option>
                                        <option value="Exame">Exame</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Data *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data_agendamento}
                                        onChange={e => setFormData({ ...formData, data_agendamento: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#FF6B2B]/50 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Hora *</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.hora}
                                        onChange={e => setFormData({ ...formData, hora: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#FF6B2B]/50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Observações (Opcional)</label>
                                <textarea
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#FF6B2B]/50 transition-all outline-none resize-none"
                                    placeholder="Alguma nota sobre este cliente..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl font-bold bg-[#FF6B2B] hover:bg-[#ff7b42] text-white transition-all shadow-lg shadow-[#FF6B2B]/20 disabled:opacity-50 flex justify-center items-center"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </UnitLayout>
    );
}
