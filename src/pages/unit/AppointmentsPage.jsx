import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { appointmentService } from '../../services/appointmentService';
import UnitLayout from '../../components/UnitLayout';
import { useToastStore } from '../../components/ui/Toast';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Search, X } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, addMonths, isSameDay, isSameMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_COLORS = { Consulta: 'bg-cyan-400', Entrega: 'bg-emerald-400', Ajuste: 'bg-amber-400', Retorno: 'bg-purple-400', Exame: 'bg-blue-400' };
const TIMES = Array.from({ length: 25 }, (_, i) => { const h = 8 + Math.floor(i / 2); const m = i % 2 === 0 ? '00' : '30'; return `${String(h).padStart(2, '0')}:${m}`; });

export default function AppointmentsPage() {
    const { slug } = useParams();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;
    const addToast = useToastStore(s => s.addToast);

    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState([]);

    const [form, setForm] = useState({
        client_name: '', phone: '', client_id: null,
        date: '', time: '09:00', duration_min: 30,
        type: 'Consulta', notes: '',
    });

    useEffect(() => { if (unitId) loadAppointments(); }, [unitId, currentDate]);

    async function loadAppointments() {
        setLoading(true);
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const data = await appointmentService.getByUnit(unitId, {
            dateFrom: format(start, 'yyyy-MM-dd'),
            dateTo: format(end, 'yyyy-MM-dd'),
        });
        setAppointments(data);
        setLoading(false);
    }

    async function handleSearch(q) {
        setClientSearch(q);
        if (q.length >= 2 && unitId) {
            const results = await appointmentService.searchClients(unitId, q);
            setClientResults(results);
        } else setClientResults([]);
    }

    function selectClient(c) {
        setForm(f => ({ ...f, client_name: c.client_name || c.name, phone: c.phone || '', client_id: c.id }));
        setClientSearch('');
        setClientResults([]);
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.client_name || !form.date || !form.time) return addToast({ type: 'error', message: 'Preencha nome, data e hora' });

        const conflict = await appointmentService.checkConflict(unitId, form.date, form.time);
        if (conflict) return addToast({ type: 'warning', message: `Conflito: ${conflict.client_name} já agendado às ${conflict.time}` });

        const { success, error } = await appointmentService.create({ ...form, unit_id: unitId });
        if (success) {
            addToast({ type: 'success', message: 'Agendamento criado!' });
            setModalOpen(false);
            setForm({ client_name: '', phone: '', client_id: null, date: '', time: '09:00', duration_min: 30, type: 'Consulta', notes: '' });
            loadAppointments();
        } else addToast({ type: 'error', message: error });
    }

    async function handleStatusChange(apt, newStatus) {
        await appointmentService.update(apt.id, { status: newStatus });
        setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus } : a));
        addToast({ type: 'success', message: `Status alterado para ${newStatus}` });
    }

    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end: addDays(start, 41) });
    }, [currentDate]);

    const dayAppointments = (date) => appointments.filter(a => a.date === format(date, 'yyyy-MM-dd'));
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
                    <p className="text-white/30 text-sm mt-1 capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl border border-white/10 overflow-hidden">
                        {['month', 'week', 'day'].map(v => (
                            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === v ? 'bg-cyan-400/15 text-cyan-400' : 'text-white/30 hover:text-white/60'}`}>
                                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setForm(f => ({ ...f, date: format(selectedDate || new Date(), 'yyyy-MM-dd') })); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Agendar</button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setCurrentDate(d => addMonths(d, -1))} className="p-2 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-white/5"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg hover:bg-cyan-400/10 transition-all">Hoje</button>
                <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="p-2 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-white/5"><ChevronRight size={18} /></button>
            </div>

            {/* Month View */}
            {view === 'month' && (
                <div className="glass-card overflow-hidden">
                    <div className="grid grid-cols-7">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="text-center text-[10px] text-white/20 uppercase tracking-widest py-3 border-b border-white/[0.04]">{d}</div>
                        ))}
                        {monthDays.map(day => {
                            const apts = dayAppointments(day);
                            const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            return (
                                <button key={day.toString()} onClick={() => { setSelectedDate(day); setView('day'); }}
                                    className={`min-h-[80px] p-2 border-b border-r border-white/[0.02] text-left transition-all hover:bg-white/[0.03] ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                                    <span className={`text-xs font-medium ${isToday ? 'w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center' : 'text-white/40'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {apts.slice(0, 3).map(a => (
                                            <span key={a.id} className={`w-2 h-2 rounded-full ${TYPE_COLORS[a.type] || 'bg-white/20'}`} title={`${a.time} ${a.client_name}`} />
                                        ))}
                                        {apts.length > 3 && <span className="text-[9px] text-white/20">+{apts.length - 3}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Day View */}
            {view === 'day' && (
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-white mb-4">{format(selectedDate || new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
                    <div className="space-y-2">
                        {dayAppointments(selectedDate || new Date()).length === 0 && <p className="text-center py-8 text-white/15 text-sm">Nenhum agendamento</p>}
                        {dayAppointments(selectedDate || new Date()).map(a => (
                            <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:border-cyan-400/15 transition-all">
                                <div className={`w-1 h-12 rounded-full ${TYPE_COLORS[a.type]}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-white/20" />
                                        <span className="text-sm font-medium text-white">{a.time}</span>
                                        <span className="text-xs text-white/20">({a.duration_min}min)</span>
                                    </div>
                                    <p className="text-sm text-white/60 font-medium">{a.client_name}</p>
                                    <p className="text-xs text-white/25">{a.type} · {a.phone || 'Sem telefone'}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {['Confirmado', 'Concluído', 'Faltou'].map(s => (
                                        <button key={s} onClick={() => handleStatusChange(a, s)}
                                            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${a.status === s ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/25' : 'text-white/20 border-white/[0.06] hover:text-white/50 hover:bg-white/[0.03]'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Week View */}
            {view === 'week' && (
                <div className="glass-card p-6">
                    <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const day = addDays(startOfWeek(selectedDate || new Date(), { weekStartsOn: 0 }), i);
                            const apts = dayAppointments(day);
                            const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                            return (
                                <div key={i} className="min-h-[200px]">
                                    <button onClick={() => { setSelectedDate(day); setView('day'); }}
                                        className={`w-full text-center py-2 rounded-lg mb-2 text-xs font-medium transition-all ${isToday ? 'bg-cyan-400 text-black' : 'text-white/40 hover:bg-white/5'}`}>
                                        {format(day, 'EEE d', { locale: ptBR })}
                                    </button>
                                    <div className="space-y-1">
                                        {apts.map(a => (
                                            <div key={a.id} className="text-[10px] p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] cursor-pointer hover:border-cyan-400/15 transition-all" onClick={() => { setSelectedDate(day); setView('day'); }}>
                                                <span className="text-white/40">{a.time}</span>
                                                <p className="text-white/60 truncate">{a.client_name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setModalOpen(false)} />
                    <form onSubmit={handleCreate} className="relative glass-card glow-border p-6 w-full max-w-lg animate-fadeIn">
                        <h3 className="text-lg font-bold text-white mb-5">Novo Agendamento</h3>

                        {/* Client autocomplete */}
                        <div className="mb-4 relative">
                            <label className="text-xs text-cyan-300/60 block mb-1.5">Buscar Cliente</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                <input value={clientSearch} onChange={e => handleSearch(e.target.value)} placeholder="Nome ou telefone..." className="input-futuristic w-full pl-9" />
                            </div>
                            {clientResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 glass-card border border-white/10 shadow-xl max-h-40 overflow-y-auto">
                                    {clientResults.map(c => (
                                        <button key={c.id} type="button" onClick={() => selectClient(c)} className="w-full text-left px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                                            {c.client_name || c.name} · {c.phone || ''}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="text-xs text-cyan-300/60 block mb-1.5">Nome do Cliente</label>
                                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className="input-futuristic w-full" required />
                            </div>
                            <div><label className="text-xs text-cyan-300/60 block mb-1.5">Telefone</label>
                                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-futuristic w-full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><label className="text-xs text-cyan-300/60 block mb-1.5">Data</label>
                                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-futuristic w-full" required />
                            </div>
                            <div><label className="text-xs text-cyan-300/60 block mb-1.5">Hora</label>
                                <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="input-futuristic w-full">
                                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div><label className="text-xs text-cyan-300/60 block mb-1.5">Tipo</label>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-futuristic w-full">
                                    {Object.keys(TYPE_COLORS).map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4"><label className="text-xs text-cyan-300/60 block mb-1.5">Observações</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-futuristic w-full resize-none" rows={2} />
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
                            <button type="submit" className="btn-primary flex-1">Agendar</button>
                        </div>
                    </form>
                </div>
            )}
        </UnitLayout>
    );
}
