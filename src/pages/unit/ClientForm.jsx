import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import { useToastStore } from '../../components/ui/Toast';
import UnitLayout from '../../components/UnitLayout';
import { ArrowLeft, Save, User, Eye, Wallet, Package, FileText, Phone } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const LENS_MATERIALS = ['Resina', 'Policarbonato', 'Alto Índice', 'Outro'];
const LENS_TYPES = [
    'Mult Incolor', 'Mult Foto Blue', 'Mult Blue', 'V.S Foto/AR', 'V.S Blue', 'V.S Blue Foto',
    'Digital HD', 'Multi/V.S Poli', 'Monofocal', 'Bifocal', 'Multifocal/Progressiva',
    'Anti-reflexo', 'Transitions/Fotocromática', 'Outro'
];
const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Boleto', 'Crediário Próprio'];
const GENDERS = ['Masculino', 'Feminino', 'Outro', 'Não informado'];
const STATUS_OPTIONS = ['Novo', 'Pedir Lente', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];

const EMPTY_FORM = {
    // 1. Identificação
    tso: '', status: 'Novo', name: '', hp: '', laboratorio: '', medico: '',
    // 2. Prescrição Principal
    od_esf: '', od_cil: '', od_eixo: '',
    oe_esf: '', oe_cil: '', oe_eixo: '',
    // Prescrição Biblioteca
    bib_od_esf: '', bib_od_cil: '', bib_od_eixo: '',
    bib_oe_esf: '', bib_oe_cil: '', bib_oe_eixo: '',
    adicao: '', tipo_lente: '', material_lente: '', tom_lente: '',
    // 3. Dados Pessoais
    cpf: '', phone: '', email: '', birth_date: '', boleto_vencimento: '', city: '', address: '',
    // 4. Pagamento
    payment_method: '', data_pagamento: '', total_value: '', data_expedicao: '',
    // 5. Info Adicionais
    info_armacao: '', notes: ''
};

// ─── Componentes de UI ────────────────────────────────────────────────────────

const inputCls = (err) =>
    `w-full bg-[#0A0A0A] border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition-all ${err ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-[#2563EB]/60'}`;

const lbl = 'block text-xs font-bold text-white mb-2 tracking-wide';

function TF({ label, value, onChange, type = 'text', placeholder = '', error, icon: Icon }) {
    return (
        <div>
            <label className={lbl}>{label}</label>
            <div className="relative">
                <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputCls(error)} />
                {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />}
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}

function SF({ label, value, onChange, options }) {
    return (
        <div>
            <label className={lbl}>{label}</label>
            <select value={value} onChange={onChange} className={inputCls(false)}>
                <option value="">Selecionar...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="bg-[#111111] rounded-2xl border border-white/5 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-white/10">
                <h3 className="text-lg font-bold text-[#F97316]">{title}</h3>
                <div className="h-0.5 w-full bg-gradient-to-r from-[#2563EB] to-transparent mt-3"></div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientForm() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const unitId = profile?.unit_id;
    const isEdit = !!id;

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [globalError, setGlobalError] = useState('');

    useEffect(() => {
        if (!isEdit || !id) return;
        setLoading(true);
        clientService.getClientById(id).then(data => {
            if (data) {
                let bibOd = {};
                let bibOe = {};
                try { bibOd = JSON.parse(data.prescricao_od || '{}'); } catch (e) { }
                try { bibOe = JSON.parse(data.prescricao_oe || '{}'); } catch (e) { }

                setForm({
                    ...EMPTY_FORM, // Garante que campos novos não quebrem
                    tso: data.tso || '',
                    status: data.status || 'Novo',
                    name: data.name || '',
                    hp: data.hp || '',
                    laboratorio: data.laboratorio || '',
                    medico: data.medico || '',

                    od_esf: data.od_esf ?? '', od_cil: data.od_cil ?? '', od_eixo: data.od_eixo ?? '',
                    oe_esf: data.oe_esf ?? '', oe_cil: data.oe_cil ?? '', oe_eixo: data.oe_eixo ?? '',

                    bib_od_esf: bibOd.bib_esf || '', bib_od_cil: bibOd.bib_cil || '', bib_od_eixo: bibOd.bib_eixo || '',
                    bib_oe_esf: bibOe.bib_esf || '', bib_oe_cil: bibOe.bib_cil || '', bib_oe_eixo: bibOe.bib_eixo || '',

                    adicao: data.adicao || '', tipo_lente: data.tipo_lente || '', material_lente: data.material_lente || '', tom_lente: data.tom_lente || '',

                    cpf: data.cpf || '', phone: data.phone || '', email: data.email || '', birth_date: data.birth_date || '', boleto_vencimento: data.boleto_vencimento || '', city: data.city || '', address: data.address || '',

                    payment_method: data.payment_method || '', data_pagamento: data.data_pagamento || '', total_value: data.total_value ?? '', data_expedicao: data.data_expedicao || '',

                    info_armacao: data.info_armacao || '', notes: data.notes || ''
                });
            }
            setLoading(false);
        });
    }, [id, isEdit]);

    function upd(key) {
        return (e) => {
            const val = e.target.value;
            setForm(prev => ({ ...prev, [key]: val }));
            setErrors(prev => ({ ...prev, [key]: '' }));
            setGlobalError('');
        };
    }

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Nome Obrigatório';
        if (!unitId) errs._global = 'Sessão expirada. Faça login novamente.';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            if (errs._global) setGlobalError(errs._global);
            return;
        }
        setSaving(true);
        setGlobalError('');

        try {
            const result = isEdit
                ? await clientService.updateClient(id, form)
                : await clientService.createClient(unitId, form);

            if (!result.success) {
                setGlobalError(result.error || 'Erro ao salvar.');
                addToast({ type: 'error', message: result.error || 'Erro ao salvar cliente' });
                setSaving(false);
                return;
            }

            addToast({ type: 'success', message: isEdit ? 'Cliente atualizado!' : 'Cliente cadastrado com sucesso!' });
            navigate(`/${slug}/clientes`);
        } catch (err) {
            setGlobalError('Erro inesperado: ' + err.message);
            addToast({ type: 'error', message: 'Erro inesperado: ' + err.message });
            setSaving(false);
        }
    }

    if (loading) return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
            </div>
        </UnitLayout>
    );

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-5xl mx-auto pb-24">

                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} disabled={saving} className="px-8 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors font-medium flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20">
                            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            Salvar
                        </button>
                    </div>
                </div>

                {globalError && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/25 text-red-500 text-sm rounded-xl px-4 py-3">
                        ⚠️ {globalError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── 1. Identificação ── */}
                    <Section title="Identificação">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <TF label="TSO" value={form.tso} onChange={upd('tso')} placeholder="2230" />
                            <SF label="Status" value={form.status} onChange={upd('status')} options={STATUS_OPTIONS} />
                            <TF label="Nome Completo *" value={form.name} onChange={upd('name')} placeholder="Nome completo" error={errors.name} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <TF label="HP" value={form.hp} onChange={upd('hp')} placeholder="Ex: loja" />
                            <TF label="Laboratório" value={form.laboratorio} onChange={upd('laboratorio')} placeholder="Nome do laboratório" />
                            <TF label="Médico" value={form.medico} onChange={upd('medico')} placeholder="Nome do médico" />
                        </div>
                    </Section>

                    {/* ── 2. Prescrição Oftálmica ── */}
                    <div className="bg-[#FFFFFF] text-black rounded-lg border border-gray-200 overflow-hidden mb-8 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Prescrição Oftálmica</h3>
                            <div className="h-0.5 w-full bg-[#2563EB] mt-3"></div>
                        </div>
                        <div className="p-6 space-y-8">

                            {/* Principal Table */}
                            <div>
                                <h4 className="text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Prescrição Principal</h4>
                                <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#F8FAFC] text-gray-500 text-xs uppercase border-b border-gray-200">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold border-r border-gray-200">Olho</th>
                                                <th className="px-5 py-3 font-semibold border-r border-gray-200">ESF</th>
                                                <th className="px-5 py-3 font-semibold border-r border-gray-200">CIL</th>
                                                <th className="px-5 py-3 font-semibold">EIXO</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-5 py-3 font-bold text-gray-800 border-r border-gray-200 w-24">OD</td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="ESF" value={form.od_esf} onChange={upd('od_esf')} /></td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="CIL" value={form.od_cil} onChange={upd('od_cil')} /></td>
                                                <td className="p-0"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="EIXO" value={form.od_eixo} onChange={upd('od_eixo')} /></td>
                                            </tr>
                                            <tr>
                                                <td className="px-5 py-3 font-bold text-gray-800 border-r border-gray-200 w-24">OE</td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="ESF" value={form.oe_esf} onChange={upd('oe_esf')} /></td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="CIL" value={form.oe_cil} onChange={upd('oe_cil')} /></td>
                                                <td className="p-0"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="EIXO" value={form.oe_eixo} onChange={upd('oe_eixo')} /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Biblioteca Table */}
                            <div>
                                <h4 className="text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Prescrição Biblioteca</h4>
                                <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#F8FAFC] text-gray-500 text-xs uppercase border-b border-gray-200">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold border-r border-gray-200">Olho</th>
                                                <th className="px-5 py-3 font-semibold border-r border-gray-200">ESF</th>
                                                <th className="px-5 py-3 font-semibold border-r border-gray-200">CIL</th>
                                                <th className="px-5 py-3 font-semibold">EIXO</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-5 py-3 font-bold text-gray-800 border-r border-gray-200 w-24">OD</td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="ESF" value={form.bib_od_esf} onChange={upd('bib_od_esf')} /></td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="CIL" value={form.bib_od_cil} onChange={upd('bib_od_cil')} /></td>
                                                <td className="p-0"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="EIXO" value={form.bib_od_eixo} onChange={upd('bib_od_eixo')} /></td>
                                            </tr>
                                            <tr>
                                                <td className="px-5 py-3 font-bold text-gray-800 border-r border-gray-200 w-24">OE</td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="ESF" value={form.bib_oe_esf} onChange={upd('bib_oe_esf')} /></td>
                                                <td className="p-0 border-r border-gray-200"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="CIL" value={form.bib_oe_cil} onChange={upd('bib_oe_cil')} /></td>
                                                <td className="p-0"><input type="text" className="w-full bg-transparent px-5 py-3 outline-none text-gray-800 placeholder-gray-300 focus:bg-blue-50/50" placeholder="EIXO" value={form.bib_oe_eixo} onChange={upd('bib_oe_eixo')} /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Selects at bottom of Prescription block */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-2 tracking-wide">Adição</label>
                                    <input type="text" value={form.adicao} onChange={upd('adicao')} placeholder="Ex: 300"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-2 tracking-wide">Tipo de Lente</label>
                                    <select value={form.tipo_lente} onChange={upd('tipo_lente')} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
                                        <option value="">Selecione o tipo</option>
                                        {LENS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── 3. Dados Pessoais ── */}
                    <Section title="Dados Pessoais">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <TF label="CPF" value={form.cpf} onChange={upd('cpf')} placeholder="000.000.000-00" />
                            <TF label="Telefone" value={form.phone} onChange={upd('phone')} placeholder="(11) 99999-9999" />
                            <TF label="E-mail" value={form.email} onChange={upd('email')} placeholder="cliente@email.com" />
                            <TF label="Data de Nascimento (DD/MM/AAAA)" value={form.birth_date} onChange={upd('birth_date')} type="date" />
                            <TF label="Boleto Vencimento" value={form.boleto_vencimento} onChange={upd('boleto_vencimento')} type="date" />
                            <TF label="Cidade" value={form.city} onChange={upd('city')} placeholder="Nome da cidade" />
                        </div>
                        <TF label="Endereço" value={form.address} onChange={upd('address')} placeholder="Endereço completo" />
                    </Section>

                    {/* ── 4. Informações de Pagamento ── */}
                    <Section title="Informações de Pagamento">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <SF label="Condições de Pagamento" value={form.payment_method} onChange={upd('payment_method')} options={PAYMENT_METHODS} />
                            <TF label="Data do Pagamento" value={form.data_pagamento} onChange={upd('data_pagamento')} type="date" />
                            <TF label="Valor Total (R$)" value={form.total_value} onChange={upd('total_value')} type="number" placeholder="0,00" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <TF label="Data de Expedição" value={form.data_expedicao} onChange={upd('data_expedicao')} type="date" />
                        </div>
                    </Section>

                    {/* ── 5. Informações Adicionais ── */}
                    <Section title="Informações Adicionais">
                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Informações da Armação</label>
                                <textarea value={form.info_armacao} onChange={upd('info_armacao')} rows={3} placeholder="Informações sobre a armação..."
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none" />
                            </div>
                            <div>
                                <label className={lbl}>Observações Gerais</label>
                                <textarea value={form.notes} onChange={upd('notes')} rows={3} placeholder="Observações adicionais..."
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none" />
                            </div>
                        </div>
                    </Section>

                    <div className="flex gap-4 pt-4 border-t border-white/10 mt-8 mb-8">
                        <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm font-bold">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20">
                            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            {isEdit ? 'Atualizar Ficha do Cliente' : 'Salvar Novo Cliente'}
                        </button>
                    </div>

                </form>
            </div>
        </UnitLayout>
    );
}
