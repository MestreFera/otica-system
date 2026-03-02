import { useState } from 'react';
import { useParams } from 'react-router-dom';
import UnitLayout from '../../components/UnitLayout';
import { Activity, Zap, X, Calendar, MessageSquare, Bot, User, Clock, ChevronRight } from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STAGES = [
    { id: 'novo', name: 'INBOX', isAI: false },
    { id: 'qualificacao', name: 'QUALIFICATION', isAI: true },
    { id: 'agendado', name: 'SCHEDULED', isAI: false },
    { id: 'atendimento', name: 'ATTENDED', isAI: false }
];

const INITIAL_LEADS = [
    { id: 1, name: 'João Silva', stageId: 'novo', phone: '(11) 98888-1111', lastMsg: 'Olá, gostaria de saber o preço.' },
    { id: 2, name: 'Maria Souza', stageId: 'qualificacao', phone: '(11) 97777-2222', lastMsg: 'Sim, eu tenho receita médica atualizada.', botActive: true },
    { id: 3, name: 'Carlos Santos', stageId: 'qualificacao', phone: '(11) 96666-3333', lastMsg: 'Pode ser na quinta de manhã?', botActive: true },
    { id: 4, name: 'Ana Costa', stageId: 'agendado', phone: '(11) 95555-4444', appointment: '15/10/2026 - 10:00', lastMsg: 'Agendamento confirmado para o dia 15.' },
    { id: 5, name: 'Roberto Lima', stageId: 'atendimento', phone: '(11) 94444-5555', lastMsg: 'Atendimento concluído. Lente Office encomendada.' },
];

const MOCK_CHAT = [
    { id: 1, sender: 'user', time: '10:00', text: 'Bom dia, fazem exame?' },
    { id: 2, sender: 'bot', time: '10:01', text: 'Bom dia! Tudo bem? Nós fazemos exame sim. Você já tem a receita ou precisa passar com o nosso optometrista?' },
    { id: 3, sender: 'user', time: '10:05', text: 'Preciso passar. Quanto custa?' },
    { id: 4, sender: 'bot', time: '10:06', text: 'O exame é cortesia na compra dos óculos completos! Gostaria de agendar para essa semana?' },
];

export default function CRMKanban() {
    const { slug } = useParams();
    const [leads, setLeads] = useState(INITIAL_LEADS);
    const [selectedLead, setSelectedLead] = useState(null);
    const [draggedLead, setDraggedLead] = useState(null);

    // Drag and Drop Logic
    const onDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
        // Transparent drag ghost
        const crt = e.target.cloneNode(true);
        crt.style.opacity = '0.01';
        document.body.appendChild(crt);
        e.dataTransfer.setDragImage(crt, 0, 0);
        setTimeout(() => document.body.removeChild(crt), 10);
    };

    const onDragOver = (e) => e.preventDefault();

    const onDrop = (e, stageId) => {
        e.preventDefault();
        if (!draggedLead) return;
        setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, stageId } : l));
        setDraggedLead(null);
    };

    const getStageLeads = (stageId) => leads.filter(l => l.stageId === stageId);

    const triggerN8N = (e, lead) => {
        e.stopPropagation();
        alert(`Forçando gatilho do n8n para o lead: ${lead.name}`);
    };

    return (
        <UnitLayout slug={slug}>
            <div className="h-[calc(100vh-140px)] flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase" style={{ fontFamily: 'var(--font-sans)' }}>CRM <span className="text-[#F97316]">Pipeline</span></h1>
                        <p className="text-xs uppercase font-mono tracking-widest mt-2 text-neutral-500">Intelligent Workflows & Routing</p>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 flex gap-6 overflow-x-auto dark-scroll pb-4">
                    {STAGES.map(col => {
                        const colLeads = getStageLeads(col.id);
                        return (
                            <div
                                key={col.id}
                                className="flex flex-col min-w-[320px] w-[320px] bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden"
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, col.id)}
                            >
                                {/* Column Header */}
                                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                        {col.isAI && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                        {col.name} <span className="text-neutral-600 bg-white/5 px-2 py-0.5 rounded-sm">[{colLeads.length}]</span>
                                    </h3>
                                    {col.isAI && <Bot size={14} className="text-emerald-500" />}
                                </div>

                                {/* Cards Area */}
                                <div className="p-3 flex-1 overflow-y-auto dark-scroll space-y-3">
                                    {colLeads.map(lead => {
                                        const isDragging = draggedLead?.id === lead.id;
                                        return (
                                            <div
                                                key={lead.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, lead)}
                                                onDragEnd={() => setDraggedLead(null)}
                                                onClick={() => setSelectedLead(lead)}
                                                className={`canvas-card p-4 rounded-md cursor-grab active:cursor-grabbing relative overflow-hidden group ${isDragging ? 'opacity-40 border-dashed border-[#F97316]' : ''}`}
                                            >
                                                {/* Beam border visual feedback on drag/hover */}
                                                <div className="beam-border-h opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                                <div className="beam-border-v opacity-0 group-hover:opacity-50 transition-opacity"></div>

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-sm font-bold text-white group-hover:text-[#F97316] transition-colors">{lead.name}</h4>
                                                        {col.isAI && (
                                                            <button
                                                                onClick={(e) => triggerN8N(e, lead)}
                                                                className="text-neutral-500 hover:text-[#F97316] bg-white/5 hover:bg-[#F97316]/10 p-1.5 rounded-sm transition-all"
                                                                title="Force Workflow Trigger"
                                                            >
                                                                <Zap size={12} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="bg-black/60 border border-white/5 rounded-sm p-2 mb-3">
                                                        <p className="text-[10px] font-mono text-neutral-400 line-clamp-2 leading-relaxed">
                                                            <span className="text-[#F97316] mr-1">{'>'}</span>{lead.lastMsg}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-2">
                                                        <span>{lead.phone}</span>
                                                        {lead.appointment && (
                                                            <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-500/20">
                                                                <Calendar size={10} /> {lead.appointment.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Lead Detail Sidebar (Brain View) */}
                <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#050505] border-l border-white/10 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedLead && (
                        <>
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-sm bg-[#111] border border-white/10 flex items-center justify-center text-[#F97316] font-bold font-mono text-lg">
                                        {selectedLead.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white uppercase tracking-wider">{selectedLead.name}</h2>
                                        <p className="text-xs font-mono text-neutral-500">{selectedLead.phone}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLead(null)} className="p-2 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-sm transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Inner Scrollable Area */}
                            <div className="flex-1 overflow-y-auto dark-scroll p-6 space-y-6">

                                {/* IA Status Card */}
                                <div className="canvas-card p-4 rounded-md">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Activity size={14} className="text-emerald-500" />
                                        <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-500">AI Engine Engine Status</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 bg-black border border-white/5 rounded-sm p-3">
                                            <p className="text-[10px] font-mono text-neutral-500 uppercase flex justify-between">Lead Score <span className="text-white">85/100</span></p>
                                        </div>
                                        <div className="flex-1 bg-black border border-white/5 rounded-sm p-3">
                                            <p className="text-[10px] font-mono text-neutral-500 uppercase flex justify-between">Stage <span className="text-white">{STAGES.find(s => s.id === selectedLead.stageId)?.name}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointments Area if exists */}
                                {selectedLead.appointment && (
                                    <div>
                                        <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-600 mb-3 border-b border-white/5 pb-2">Scheduling Data</h3>
                                        <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-sm bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Calendar size={14} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Visual Exam</p>
                                                    <p className="text-[10px] font-mono text-emerald-400 mt-0.5">{selectedLead.appointment}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-sm">Confirmed</span>
                                        </div>
                                    </div>
                                )}

                                {/* Chat History (The Brain) */}
                                <div className="flex-1 flex flex-col">
                                    <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-600 mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                                        <MessageSquare size={12} /> Communication Logs
                                    </h3>

                                    <div className="space-y-4">
                                        {MOCK_CHAT.map(msg => {
                                            const isBot = msg.sender === 'bot';
                                            return (
                                                <div key={msg.id} className={`flex flex-col ${isBot ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono uppercase tracking-wider text-neutral-500">
                                                        {isBot ? <><Bot size={10} className="text-[#F97316]" /> AI Agent</> : <><User size={10} /> User</>}
                                                        <span className="opacity-50">• {msg.time}</span>
                                                    </div>
                                                    <div className={`max-w-[85%] p-3 rounded-md text-sm leading-relaxed ${isBot ? 'bg-[#F97316]/10 text-orange-50 border border-[#F97316]/20 rounded-tr-none' : 'bg-white/5 text-neutral-300 border border-white/10 rounded-tl-none'}`}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-4 border-t border-white/10 bg-[#0A0A0A] flex gap-3">
                                <button className="flex-1 btn-canvas !py-3">
                                    <span className="corner-accent corner-tl"></span><span className="corner-accent corner-tr"></span>
                                    <span className="corner-accent corner-bl"></span><span className="corner-accent corner-br"></span>
                                    <span className="text-xs font-bold tracking-wider uppercase">Takeover Chat</span>
                                </button>
                                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-md px-4 py-2 transition-all flex items-center justify-center">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar Backdrop */}
                {selectedLead && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 sm:hidden" onClick={() => setSelectedLead(null)} />
                )}
            </div>
        </UnitLayout>
    );
}
