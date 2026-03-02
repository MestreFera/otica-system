import { useState, useEffect } from 'react';
import UnitLayout from '../../components/UnitLayout';
import { useParams } from 'react-router-dom';
import { Bot, Save, RefreshCw, ChevronDown, ChevronUp, Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { unitService } from '../../services/unitService';
import { aiAgentService } from '../../services/aiAgentService';

const inp = `w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-200 text-sm`;
const labelClass = `block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5 text-neutral-500`;

function Accordion({ title, icon: Icon, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden mb-4 transition-all duration-300">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={18} className="text-[var(--accent)]" />}
                    <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
                </div>
                {open ? <ChevronUp size={18} className="text-neutral-500" /> : <ChevronDown size={18} className="text-neutral-500" />}
            </button>

            <div className={`transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 border-t border-white/5">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function AgentePage() {
    const { slug } = useParams();

    // API loading state
    const [unitId, setUnitId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Identidade do Agente
    const [identidade, setIdentidade] = useState({
        nome: 'Luna',
        genero: 'Feminino',
        cargo: 'Consultor(a) Especialista',
        tomVoz: 'profissional e empático',
        personalidade: 'empática, profissional, consultiva',
        usarEmojis: true
    });

    // Info Unidade
    const [unidade, setUnidade] = useState({
        nome: 'Vox Maceió',
        endereco: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        referencias: '',
        telefone: '',
        email: '',
        contexto: '',
        estacionamento: '',
        transporte: ''
    });

    // Horarios
    const [horarios, setHorarios] = useState({
        semInicio: '09:00',
        semFim: '20:00',
        sabInicio: '08:00',
        sabFim: '11:00',
        domingo: false,
        almoco: false
    });

    // Equipe
    const [equipe, setEquipe] = useState([{ id: 1, nome: '', cargo: '' }]);

    // Produto
    const [produto, setProduto] = useState({
        nome: 'Curso',
        duracao: '',
        descricao: '',
        gratuitoNome: 'Diagnóstico Estratégico',
        gratuitoDuracao: '30 a 60 minutos'
    });

    // Preços
    const [precos, setPrecos] = useState({
        minimo: '0',
        maximo: '0',
        texto: ''
    });

    useEffect(() => {
        async function load() {
            setLoading(true);
            const unit = await unitService.getUnitBySlug(slug);
            if (unit) {
                setUnitId(unit.id);
                // Pré-preenche info básica
                setUnidade(u => ({ ...u, nome: unit.name, cidade: unit.city, estado: unit.state }));

                const settings = await aiAgentService.getSettings(unit.id);
                if (settings) {
                    setIdentidade({
                        nome: settings.agent_name || 'Bia',
                        genero: settings.agent_gender || 'Feminino',
                        cargo: settings.agent_role || '',
                        tomVoz: 'profissional e empático',
                        personalidade: settings.agent_personality || '',
                        usarEmojis: settings.use_emojis
                    });
                    setUnidade(u => ({
                        ...u,
                        endereco: settings.unit_address || '',
                        bairro: settings.unit_neighborhood || '',
                        cep: settings.unit_zip || '',
                        referencias: settings.unit_references || '',
                        telefone: settings.unit_phones || '',
                        contexto: settings.regional_context || '',
                        estacionamento: settings.parking_info || '',
                        transporte: settings.transport_info || ''
                    }));
                    setHorarios({
                        semInicio: settings.hours_weekdays?.split(' as ')[0] || '09:00',
                        semFim: settings.hours_weekdays?.split(' as ')[1] || '18:00',
                        sabInicio: settings.hours_saturday?.split(' as ')[0] || '09:00',
                        sabFim: settings.hours_saturday?.split(' as ')[1] || '13:00',
                        domingo: settings.hours_sunday !== 'Fechado',
                        almoco: settings.hours_lunch !== 'Sem pausa para almoço'
                    });
                    setProduto(p => ({
                        ...p,
                        nome: settings.service_name || '',
                        duracao: settings.service_duration || '',
                        descricao: settings.service_desc || ''
                    }));
                    setPrecos({
                        minimo: settings.price_min?.toString() || '0',
                        maximo: settings.price_max?.toString() || '0',
                        texto: settings.price_text || ''
                    });
                    if (settings.team_members && Array.isArray(settings.team_members) && settings.team_members.length > 0) {
                        setEquipe(settings.team_members);
                    }
                }
            }
            setLoading(false);
        }
        load();
    }, [slug]);

    async function handleSave() {
        if (!unitId) return;
        setSaving(true);
        const payload = {
            agent_name: identidade.nome,
            agent_gender: identidade.genero,
            agent_role: identidade.cargo,
            agent_personality: identidade.personalidade,
            use_emojis: identidade.usarEmojis,

            unit_address: unidade.endereco,
            unit_neighborhood: unidade.bairro,
            unit_city: unidade.cidade,
            unit_state: unidade.estado,
            unit_zip: unidade.cep,
            unit_references: unidade.referencias,
            unit_phones: unidade.telefone,
            regional_context: unidade.contexto,
            parking_info: unidade.estacionamento,
            transport_info: unidade.transporte,

            hours_weekdays: `${horarios.semInicio} as ${horarios.semFim}`,
            hours_saturday: `${horarios.sabInicio} as ${horarios.sabFim}`,
            hours_sunday: horarios.domingo ? 'Aberto' : 'Fechado',
            hours_lunch: horarios.almoco ? 'Com pausa para almoço' : 'Sem pausa para almoço',

            service_name: produto.nome,
            service_duration: produto.duracao,
            service_desc: produto.descricao,

            price_min: Number(precos.minimo) || 0,
            price_max: Number(precos.maximo) || 0,
            price_text: precos.texto,

            team_members: equipe
        };

        const res = await aiAgentService.upsertSettings(unitId, payload);
        setSaving(false);
        if (res.success) {
            alert('Configurações salvas com sucesso!');
        } else {
            alert('Erro ao salvar configurações: ' + res.error);
        }
    }

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[1000px] mx-auto pb-24 relative">
                {loading && (
                    <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm z-30 flex items-center justify-center rounded-3xl">
                        <Loader2 size={32} className="text-[#F97316] animate-spin" />
                    </div>
                )}

                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Configuração do Agente AI</h1>
                            <p className="text-sm text-neutral-400 mt-1">Personalize seu assistente virtual</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn-ghost flex items-center gap-2 px-4 py-2 border-white/10 text-neutral-300">
                            <Eye size={16} /> Preview
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary flex items-center justify-center gap-2"
                            style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Salvar
                        </button>
                        <button className="btn-primary flex items-center gap-2" style={{ background: '#22c55e', borderColor: '#22c55e' }}>
                            <RefreshCw size={16} /> Sincronizar n8n
                        </button>
                    </div>
                </div>

                {/* ── Accordions ── */}
                <div className="space-y-4">

                    {/* 1. Identidade */}
                    <Accordion title="Identidade do Agente" defaultOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className={labelClass}>Nome do Agente</label>
                                <input type="text" className={inp} value={identidade.nome} onChange={e => setIdentidade({ ...identidade, nome: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Gênero</label>
                                <select className={inp} value={identidade.genero} onChange={e => setIdentidade({ ...identidade, genero: e.target.value })}>
                                    <option>Feminino</option>
                                    <option>Masculino</option>
                                    <option>Neutro</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Cargo</label>
                                <input type="text" className={inp} value={identidade.cargo} onChange={e => setIdentidade({ ...identidade, cargo: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Tom de Voz</label>
                                <input type="text" className={inp} value={identidade.tomVoz} onChange={e => setIdentidade({ ...identidade, tomVoz: e.target.value })} />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className={labelClass}>Personalidade</label>
                            <input type="text" className={inp} value={identidade.personalidade} onChange={e => setIdentidade({ ...identidade, personalidade: e.target.value })} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={identidade.usarEmojis} onChange={e => setIdentidade({ ...identidade, usarEmojis: e.target.checked })}
                                className="w-4 h-4 rounded border-white/10 bg-black text-[#F97316] focus:ring-[#F97316] focus:ring-offset-black" />
                            <span className="text-sm text-neutral-300">Usar emojis nas conversas</span>
                        </label>
                    </Accordion>

                    {/* 2. Unidade */}
                    <Accordion title="Informações da Unidade" defaultOpen={true}>
                        <div className="mb-5">
                            <label className={labelClass}>Nome da Unidade *</label>
                            <input type="text" className={inp} value={unidade.nome} onChange={e => setUnidade({ ...unidade, nome: e.target.value })} />
                        </div>
                        <div className="mb-5">
                            <label className={labelClass}>Endereço Completo</label>
                            <input type="text" className={inp} placeholder="Rua, número, sala, edifício..." value={unidade.endereco} onChange={e => setUnidade({ ...unidade, endereco: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className={labelClass}>Bairro</label>
                                <input type="text" className={inp} value={unidade.bairro} onChange={e => setUnidade({ ...unidade, bairro: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Cidade *</label>
                                <input type="text" className={inp} value={unidade.cidade} onChange={e => setUnidade({ ...unidade, cidade: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Estado</label>
                                <input type="text" className={inp} placeholder="Ex: ES, SP, RJ..." value={unidade.estado} onChange={e => setUnidade({ ...unidade, estado: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>CEP</label>
                                <input type="text" className={inp} value={unidade.cep} onChange={e => setUnidade({ ...unidade, cep: e.target.value })} />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className={labelClass}>Referências</label>
                            <input type="text" className={inp} placeholder="Ex: Em frente ao Restaurante X, próximo ao Shopping Y" value={unidade.referencias} onChange={e => setUnidade({ ...unidade, referencias: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className={labelClass}>Telefone</label>
                                <input type="text" className={inp} value={unidade.telefone} onChange={e => setUnidade({ ...unidade, telefone: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" className={inp} value={unidade.email} onChange={e => setUnidade({ ...unidade, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className={labelClass}>Contexto Regional</label>
                            <textarea className={`${inp} resize-none h-24`} placeholder="Descreva o contexto da região..." value={unidade.contexto} onChange={e => setUnidade({ ...unidade, contexto: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Informações de Estacionamento</label>
                                <textarea className={`${inp} resize-none h-24`} value={unidade.estacionamento} onChange={e => setUnidade({ ...unidade, estacionamento: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Transporte Público</label>
                                <textarea className={`${inp} resize-none h-24`} value={unidade.transporte} onChange={e => setUnidade({ ...unidade, transporte: e.target.value })} />
                            </div>
                        </div>
                    </Accordion>

                    {/* 3. Horários */}
                    <Accordion title="Horários de Funcionamento" defaultOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className={labelClass}>Segunda a Sexta - Início</label>
                                <input type="time" className={inp} value={horarios.semInicio} onChange={e => setHorarios({ ...horarios, semInicio: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Segunda a Sexta - Fim</label>
                                <input type="time" className={inp} value={horarios.semFim} onChange={e => setHorarios({ ...horarios, semFim: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Sábado - Início</label>
                                <input type="time" className={inp} value={horarios.sabInicio} onChange={e => setHorarios({ ...horarios, sabInicio: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Sábado - Fim</label>
                                <input type="time" className={inp} value={horarios.sabFim} onChange={e => setHorarios({ ...horarios, sabFim: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={horarios.domingo} onChange={e => setHorarios({ ...horarios, domingo: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/10 bg-black text-[#F97316] focus:ring-[#F97316] focus:ring-offset-black" />
                                <span className="text-sm text-neutral-300">Funciona domingo</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={horarios.almoco} onChange={e => setHorarios({ ...horarios, almoco: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/10 bg-black text-[#F97316] focus:ring-[#F97316] focus:ring-offset-black" />
                                <span className="text-sm text-neutral-300">Fecha para almoço</span>
                            </label>
                        </div>
                    </Accordion>

                    {/* 4. Equipe */}
                    <Accordion title="Equipe" defaultOpen={true}>
                        {equipe.map((membro, i) => (
                            <div key={membro.id} className="flex flex-col md:flex-row items-end gap-3 mb-3">
                                <div className="flex-1 w-full">
                                    {i === 0 && <label className={labelClass}>Nome</label>}
                                    <input type="text" className={inp} placeholder="Nome" value={membro.nome} onChange={e => {
                                        const n = [...equipe]; n[i].nome = e.target.value; setEquipe(n);
                                    }} />
                                </div>
                                <div className="flex-1 w-full">
                                    {i === 0 && <label className={labelClass}>Cargo</label>}
                                    <input type="text" className={inp} placeholder="Cargo" value={membro.cargo} onChange={e => {
                                        const n = [...equipe]; n[i].cargo = e.target.value; setEquipe(n);
                                    }} />
                                </div>

                                {i === 0 ? (
                                    <button
                                        onClick={() => setEquipe([...equipe, { id: Date.now(), nome: '', cargo: '' }])}
                                        className="btn-primary w-full md:w-auto mt-2 md:mt-0"
                                        style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                                        Adicionar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setEquipe(equipe.filter(e => e.id !== membro.id))}
                                        className="p-3 w-full md:w-auto h-full rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors mt-2 md:mt-0 flex items-center justify-center">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <p className="text-[10px] text-neutral-500 mt-4 italic">O agente mencionará nesses nomes para parecer mais humano.</p>
                    </Accordion>

                    {/* 5. Serviço */}
                    <Accordion title="Produto / Serviço" defaultOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className={labelClass}>Nome do Produto/Curso</label>
                                <input type="text" className={inp} value={produto.nome} onChange={e => setProduto({ ...produto, nome: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Duração Média</label>
                                <input type="text" className={inp} placeholder="Ex: 6 meses" value={produto.duracao} onChange={e => setProduto({ ...produto, duracao: e.target.value })} />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className={labelClass}>Descrição</label>
                            <textarea className={`${inp} resize-none h-24`} value={produto.descricao} onChange={e => setProduto({ ...produto, descricao: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Serviço Gratuito (Diagnóstico/Avaliação)</label>
                                <input type="text" className={inp} value={produto.gratuitoNome} onChange={e => setProduto({ ...produto, gratuitoNome: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Duração Fixa</label>
                                <input type="text" className={inp} value={produto.gratuitoDuracao} onChange={e => setProduto({ ...produto, gratuitoDuracao: e.target.value })} />
                            </div>
                        </div>
                    </Accordion>

                    {/* 6. Preços */}
                    <Accordion title="Preços" defaultOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className={labelClass}>Preço Mínimo (R$)</label>
                                <input type="number" className={inp} value={precos.minimo} onChange={e => setPrecos({ ...precos, minimo: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Preço Máximo (R$)</label>
                                <input type="number" className={inp} value={precos.maximo} onChange={e => setPrecos({ ...precos, maximo: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Texto de Apresentação de Preço</label>
                            <textarea className={`${inp} resize-none h-24`} value={precos.texto} onChange={e => setPrecos({ ...precos, texto: e.target.value })} />
                        </div>
                    </Accordion>

                </div>
            </div>
        </UnitLayout>
    );
}
