import { useState, useEffect } from 'react';
import UnitLayout from '../../components/UnitLayout';
import { useParams } from 'react-router-dom';
import { Bot, RefreshCw, Settings, Play, Pause, Search, User, List, MessageSquare, Clock } from 'lucide-react';

// Dados Mokados para o UI (baseado na referência)
const mockMetrics = [
    { label: 'Contatos', value: 0, icon: User, color: 'text-white' },
    { label: 'Etapas', value: 0, icon: List, color: 'text-white' },
    { label: 'Conversas', value: 0, icon: MessageSquare, color: 'text-yellow-500' },
    { label: 'Vagas', value: 0, icon: Clock, color: 'text-red-500' },
    { label: 'Agendados', value: 0, icon: Clock, color: 'text-green-500' },
    { label: 'Filtrados', value: 0, icon: List, color: 'text-white' }
];

export default function FollowUps() {
    const { slug } = useParams();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('followups');
    const [pauseNumber, setPauseNumber] = useState('');
    const [disparoMsg, setDisparoMsg] = useState('');
    const [disparoNumbers, setDisparoNumbers] = useState('');

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-6xl mx-auto pb-24">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                            <List size={24} />
                            <h1 className="text-2xl font-black tracking-tight text-white">Central de Mensagens</h1>
                        </div>
                        <p className="text-sm text-neutral-400">Gerencie campanhas, follow-ups e pausas da IA</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button onClick={() => setActiveTab('followups')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'followups' ? 'bg-yellow-500 text-black' : 'bg-[#111] text-white/50 hover:text-white'}`}>Dashboard de Follow-ups</button>
                    <button onClick={() => setActiveTab('pausas')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'pausas' ? 'bg-yellow-500 text-black' : 'bg-[#111] text-white/50 hover:text-white'}`}>Pausar Agente de IA</button>
                    <button onClick={() => setActiveTab('disparos')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'disparos' ? 'bg-yellow-500 text-black' : 'bg-[#111] text-white/50 hover:text-white'}`}>Disparo em Lote</button>
                </div>

                {/* TAB: FOLLOWUPS */}
                {activeTab === 'followups' && (
                    <div className="animate-fadeIn">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {mockMetrics.map((m, i) => (
                                <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32">
                                    <div className="flex items-center gap-2 text-white/50 text-xs font-semibold">
                                        <m.icon size={14} /> {m.label}
                                    </div>
                                    <div className={`text-3xl font-black ${m.color}`}>
                                        {m.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Table Search & Drops */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                <input type="text" placeholder="Buscar por numero, nome ou tipo..." className="w-full bg-[#111] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                            <select className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none w-full md:w-48">
                                <option>Todas as etapas</option>
                            </select>
                            <select className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none w-full md:w-48">
                                <option>Todos os tipos</option>
                            </select>
                        </div>

                        {/* Table List */}
                        <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-white bg-[#111] border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold flex items-center gap-2 text-yellow-500"><Phone size={14} /> Numero</th>
                                        <th className="px-6 py-4 font-bold"><div className="flex items-center gap-2 text-yellow-500"><User size={14} /> Contato</div></th>
                                        <th className="px-6 py-4 font-bold">Etapa</th>
                                        <th className="px-6 py-4 font-bold">Tipo de Contato</th>
                                        <th className="px-6 py-4 font-bold"><div className="flex items-center gap-2 text-yellow-500"><MessageSquare size={14} /> Conversa</div></th>
                                        <th className="px-6 py-4 font-bold"><div className="flex items-center gap-2 text-yellow-500"><Clock size={14} /> Ultima Mensagem</div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-white/30 text-sm">
                                            <RefreshCw className="inline-block mr-2 animate-spin" size={16} /> Carregando follow-ups...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: PAUSAS */}
                {activeTab === 'pausas' && (
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-3xl animate-fadeIn">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <Pause className="text-yellow-500" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-white">Controle de Pausas</h2>
                                <p className="text-sm text-white/50">Pause o agente de IA para um número específico para você prosseguir com o atendimento humano.</p>
                            </div>
                        </div>

                        <label className="block text-xs font-bold text-white mb-2 tracking-wide">Número do Cliente (WhatsApp)</label>
                        <input
                            type="text"
                            placeholder="Ex: 5511999999999"
                            value={pauseNumber}
                            onChange={e => setPauseNumber(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 mb-6"
                        />

                        <div className="flex gap-4">
                            <button className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-colors">
                                ⏸ Pausar IA para este número
                            </button>
                            <button className="flex-1 py-3 rounded-xl border border-white/10 text-green-400 font-bold text-sm hover:bg-white/5 transition-colors">
                                ▶️ Reativar IA
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB: DISPAROS */}
                {activeTab === 'disparos' && (
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-4xl animate-fadeIn">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <MessageSquare className="text-yellow-500" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-white">Disparo em Lote</h2>
                                <p className="text-sm text-white/50">Envie mensagens em massa para múltiplos números simultaneamente.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-white mb-2 tracking-wide">Números (Um por linha)</label>
                                <textarea
                                    rows={8}
                                    placeholder="5511999999999&#10;5511888888888"
                                    value={disparoNumbers}
                                    onChange={e => setDisparoNumbers(e.target.value)}
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 resize-none font-mono"
                                />
                                <p className="text-xs text-white/30 mt-2">Dica: Inclua sempre o código do país (55) e o DDD.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white mb-2 tracking-wide">Mensagem a ser enviada</label>
                                <textarea
                                    rows={8}
                                    placeholder="Olá! Temos uma novidade especial para você..."
                                    value={disparoMsg}
                                    onChange={e => setDisparoMsg(e.target.value)}
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button className="px-8 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                🚀 Iniciar Disparo
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </UnitLayout>
    );
}

// Phone icon is not in the top import, let's fix that inline
function Phone(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
}
