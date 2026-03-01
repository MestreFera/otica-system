import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import { useToastStore } from '../../components/ui/Toast';
import UnitLayout from '../../components/UnitLayout';
import { ArrowLeft, Save, User, Eye, Wallet, Package, FileText, Phone } from 'lucide-react';

const LENS_TYPES = ['Monofocal', 'Monofocal Anti-Reflexo', 'Progressiva', 'Progressiva Premium', 'Bifocal', 'Ocupacional', 'Digital Free-Form', 'Lente de Contato'];
const LENS_MATERIALS = ['Orgânica 1.50', 'Orgânica 1.56', 'Orgânica 1.60', 'Orgânica 1.67', 'Orgânica 1.74', 'Policarbonato', 'Trivex', 'Cristal'];
const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Boleto', 'Convênio'];
const GENDERS = ['Masculino', 'Feminino', 'Outro', 'Não informado'];
const STATUS_OPTIONS = ['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];

const EMPTY_FORM = {
    // Identificação
    client_name: '', cpf: '', rg: '', birth_date: '', gender: '',
    // Prescrição OD
    od_esf: '', od_cil: '', od_eixo: '', od_dnp: '', od_add: '',
    // Prescrição OE
    oe_esf: '', oe_cil: '', oe_eixo: '', oe_dnp: '', oe_add: '',
    doctor_name: '', exam_date: '',
    // Contato
    phone: '', email: '', address: '', city: '', zip_code: '',
    // Pagamento
    total_value: '', paid_value: '', payment_method: 'PIX', installments: '1',
    // Produto
    frame_brand: '', frame_model: '', frame_color: '',
    lens_type: '', lens_material: '', lab: '',
    // Status + Obs
    status: 'Novo', notes: '',
};

// ─── Field helpers ──────────────────────────────────────────────────────────
const inp = (hasErr) =>
    `w-full bg-white/5 border rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all ${hasErr ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'}`;

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.05]">
                <div className="w-7 h-7 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                    <Icon size={14} className="text-cyan-400" />
                </div>
                <h3 className="text-xs font-bold text-cyan-400/80 uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

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
        if (isEdit && id) {
            setLoading(true);
            clientService.getClientById(id).then(data => {
                if (data) {
                    setForm({
                        client_name: data.client_name || data.name || '',
                        cpf: data.cpf || '', rg: data.rg || '',
                        birth_date: data.birth_date || '', gender: data.gender || '',
                        od_esf: data.od_esf ?? '', od_cil: data.od_cil ?? '', od_eixo: data.od_eixo ?? '',
                        od_dnp: data.od_dnp ?? '', od_add: data.od_add ?? '',
                        oe_esf: data.oe_esf ?? '', oe_cil: data.oe_cil ?? '', oe_eixo: data.oe_eixo ?? '',
                        oe_dnp: data.oe_dnp ?? '', oe_add: data.oe_add ?? '',
                        doctor_name: data.doctor_name || '', exam_date: data.exam_date || '',
                        phone: data.phone || '', email: data.email || '',
                        address: data.address || '', city: data.city || '', zip_code: data.zip_code || '',
                        total_value: data.total_value ?? '', paid_value: data.paid_value ?? '',
                        payment_method: data.payment_method || 'PIX', installments: data.installments || '1',
                        frame_brand: data.frame_brand || '', frame_model: data.frame_model || '',
                        frame_color: data.frame_color || '', lens_type: data.lens_type || '',
                        lens_material: data.lens_material || '', lab: data.lab || '',
                        status: data.status || 'Novo', notes: data.notes || '',
                    });
                }
                setLoading(false);
            });
        }
    }, [id, isEdit]);

    function set(key, val) {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: '' }));
        setGlobalError('');
    }

    function validate() {
        const errs = {};
        if (!form.client_name.trim()) errs.client_name = 'Nome é obrigatório';
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
            let result;
            if (isEdit) {
                result = await clientService.updateClient(id, form);
            } else {
                result = await clientService.createClient(unitId, form);
            }

            if (!result.success) {
                setGlobalError(result.error || 'Erro ao salvar. Tente novamente.');
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

    // ── Input field renderer ──────────────────────────────────────────────────
    const F = ({ k, label, type = 'text', placeholder = '', full = false }) => (
        <div className={full ? 'col-span-full' : ''}>
            <label className="block text-[10px] font-semibold text-cyan-300/50 mb-1.5 uppercase tracking-wider">{label}</label>
            <input
                type={type}
                value={form[k]}
                onChange={e => set(k, e.target.value)}
                placeholder={placeholder}
                className={inp(!!errors[k])}
            />
            {errors[k] && <p className="text-xs text-red-400 mt-1">{errors[k]}</p>}
        </div>
    );

    const Select = ({ k, label, options, full = false }) => (
        <div className={full ? 'col-span-full' : ''}>
            <label className="block text-[10px] font-semibold text-cyan-300/50 mb-1.5 uppercase tracking-wider">{label}</label>
            <select value={form[k]} onChange={e => set(k, e.target.value)} className={inp(false)}>
                <option value="">Selecionar...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    const cols = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
    const cols2 = 'grid grid-cols-1 md:grid-cols-2 gap-3';

    if (loading) return (
        <UnitLayout slug={slug}>
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        </UnitLayout>
    );

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/30 hover:text-cyan-400 text-sm mb-5 transition-colors">
                    <ArrowLeft size={16} /> Voltar
                </button>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{isEdit ? 'Editar' : 'Novo'} Atendimento</h1>
                        <p className="text-white/30 text-sm mt-0.5">Preencha os dados do paciente e da receita</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="block text-[10px] font-semibold text-cyan-300/50 uppercase tracking-wider mr-1">Status</label>
                        <select value={form.status} onChange={e => set('status', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/60 transition-all">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {globalError && (
                    <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">
                        ⚠️ {globalError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ── Seção 1: Identificação ── */}
                    <Section icon={User} title="1. Identificação">
                        <div className={cols}>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-semibold text-cyan-300/50 mb-1.5 uppercase tracking-wider">
                                    Nome Completo <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text" value={form.client_name}
                                    onChange={e => set('client_name', e.target.value)}
                                    placeholder="Maria da Silva"
                                    className={inp(!!errors.client_name)}
                                />
                                {errors.client_name && <p className="text-xs text-red-400 mt-1">{errors.client_name}</p>}
                            </div>
                            <F k="cpf" label="CPF" placeholder="000.000.000-00" />
                            <F k="birth_date" label="Nascimento" type="date" />
                            <Select k="gender" label="Gênero" options={GENDERS} />
                        </div>
                    </Section>

                    {/* ── Seção 2: Prescrição ── */}
                    <Section icon={Eye} title="2. Prescrição Óptica">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-white/30 mb-2 font-medium uppercase tracking-wider">OD — Olho Direito</p>
                                <div className="grid grid-cols-5 gap-2">
                                    <F k="od_esf" label="Esférico" placeholder="+0.00" />
                                    <F k="od_cil" label="Cilíndrico" placeholder="-0.00" />
                                    <F k="od_eixo" label="Eixo" placeholder="180" />
                                    <F k="od_dnp" label="DNP" placeholder="32" />
                                    <F k="od_add" label="Adição" placeholder="+2.00" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30 mb-2 font-medium uppercase tracking-wider">OE — Olho Esquerdo</p>
                                <div className="grid grid-cols-5 gap-2">
                                    <F k="oe_esf" label="Esférico" placeholder="+0.00" />
                                    <F k="oe_cil" label="Cilíndrico" placeholder="-0.00" />
                                    <F k="oe_eixo" label="Eixo" placeholder="180" />
                                    <F k="oe_dnp" label="DNP" placeholder="32" />
                                    <F k="oe_add" label="Adição" placeholder="+2.00" />
                                </div>
                            </div>
                            <div className={cols2}>
                                <F k="doctor_name" label="Médico / Oftalmologista" placeholder="Dr. Carlos" />
                                <F k="exam_date" label="Data do Exame" type="date" />
                            </div>
                        </div>
                    </Section>

                    {/* ── Seção 3: Dados Pessoais ── */}
                    <Section icon={Phone} title="3. Contato e Endereço">
                        <div className={cols}>
                            <F k="phone" label="Telefone / WhatsApp" placeholder="(11) 99999-0000" />
                            <F k="email" label="E-mail" type="email" placeholder="maria@email.com" />
                            <div className="col-span-2">
                                <F k="address" label="Endereço" placeholder="Rua das Flores, 100" full />
                            </div>
                            <F k="city" label="Cidade" placeholder="São Paulo" />
                            <F k="zip_code" label="CEP" placeholder="01310-100" />
                        </div>
                    </Section>

                    {/* ── Seção 4: Pagamento ── */}
                    <Section icon={Wallet} title="4. Pagamento">
                        <div className={cols}>
                            <F k="total_value" label="Valor Total (R$)" type="number" placeholder="850.00" />
                            <F k="paid_value" label="Valor Pago (R$)" type="number" placeholder="425.00" />
                            <Select k="payment_method" label="Forma de Pagamento" options={PAYMENT_METHODS} />
                            <F k="installments" label="Parcelas" type="number" placeholder="1" />
                        </div>
                    </Section>

                    {/* ── Seção 5: Produto ── */}
                    <Section icon={Package} title="5. Produto">
                        <div className={cols}>
                            <F k="frame_brand" label="Marca da Armação" placeholder="Ray-Ban" />
                            <F k="frame_model" label="Modelo" placeholder="RB3025" />
                            <F k="frame_color" label="Cor" placeholder="Preto" />
                            <Select k="lens_type" label="Tipo de Lente" options={LENS_TYPES} />
                            <Select k="lens_material" label="Material" options={LENS_MATERIALS} />
                            <F k="lab" label="Laboratório" placeholder="Essilor, Zeiss..." />
                        </div>
                    </Section>

                    {/* ── Seção 6: Observações ── */}
                    <Section icon={FileText} title="6. Observações">
                        <textarea
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            rows={3}
                            placeholder="Anotações adicionais sobre o pedido, cliente ou pagamento..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/60 transition-all resize-none"
                        />
                    </Section>

                    {/* ── Actions ── */}
                    <div className="flex gap-3 pb-6">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 py-3 text-sm text-white/50 border border-white/10 hover:border-white/30 hover:text-white rounded-xl transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                            {saving ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                            ) : (
                                <><Save size={16} /> {isEdit ? 'Atualizar' : 'Cadastrar Cliente'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </UnitLayout>
    );
}
