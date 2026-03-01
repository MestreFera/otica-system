import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import { useToastStore } from '../../components/ui/Toast';
import UnitLayout from '../../components/UnitLayout';
import { ArrowLeft, Save, User, Eye, Wallet, Package, FileText, Phone } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const LENS_TYPES = ['Monofocal', 'Monofocal Anti-Reflexo', 'Progressiva', 'Progressiva Premium', 'Bifocal', 'Ocupacional', 'Digital Free-Form', 'Lente de Contato'];
const LENS_MATERIALS = ['Orgânica 1.50', 'Orgânica 1.56', 'Orgânica 1.60', 'Orgânica 1.67', 'Orgânica 1.74', 'Policarbonato', 'Trivex', 'Cristal'];
const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Boleto', 'Convênio'];
const GENDERS = ['Masculino', 'Feminino', 'Outro', 'Não informado'];
const STATUS_OPTIONS = ['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];

const EMPTY_FORM = {
    name: '', cpf: '', rg: '', birth_date: '', gender: '',
    od_esf: '', od_cil: '', od_eixo: '', od_dnp: '', od_add: '',
    oe_esf: '', oe_cil: '', oe_eixo: '', oe_dnp: '', oe_add: '',
    doctor_name: '', exam_date: '',
    phone: '', email: '', address: '', city: '', zip_code: '',
    total_value: '', paid_value: '', payment_method: 'PIX', installments: '1',
    frame_brand: '', frame_model: '', frame_color: '',
    lens_type: '', lens_material: '',
    status: 'Novo', notes: '',
};

// ─── Sub-components defined OUTSIDE ClientForm so React doesn't remount them ──

const inputCls = (err) =>
    `w-full bg-white/5 border rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all ${err ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'}`;

const lbl = 'block text-[10px] font-semibold text-cyan-300/50 mb-1.5 uppercase tracking-wider';

// Plain text/number/date input
function TF({ label, value, onChange, type = 'text', placeholder = '', error }) {
    return (
        <div>
            <label className={lbl}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputCls(error)} />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}

// Select input
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

// Section card wrapper
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

    // Load existing client into form when editing
    useEffect(() => {
        if (!isEdit || !id) return;
        setLoading(true);
        clientService.getClientById(id).then(data => {
            if (data) {
                setForm({
                    name: data.name || '',
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
                    payment_method: data.payment_method || 'PIX',
                    installments: data.installments?.toString() || '1',
                    frame_brand: data.frame_brand || '', frame_model: data.frame_model || '',
                    frame_color: data.frame_color || '', lens_type: data.lens_type || '',
                    lens_material: data.lens_material || '', lab: data.lab || '',
                    status: data.status || 'Novo', notes: data.notes || '',
                });
            }
            setLoading(false);
        });
    }, [id, isEdit]);

    // Stable field updater — doesn't recreate on every render
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
        if (!form.name.trim()) errs.name = 'Nome é obrigatório';
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

    const g4 = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
    const g2 = 'grid grid-cols-1 md:grid-cols-2 gap-3';

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

                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{isEdit ? 'Editar' : 'Novo'} Atendimento</h1>
                        <p className="text-white/30 text-sm mt-0.5">Preencha os dados do paciente e da receita</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={lbl + ' mr-1'}>Status</span>
                        <select value={form.status} onChange={upd('status')}
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

                    {/* ── 1. Identificação ── */}
                    <Section icon={User} title="1. Identificação">
                        <div className={g4}>
                            <div className="col-span-2">
                                <label className={lbl}>Nome Completo <span className="text-red-400">*</span></label>
                                <input type="text" value={form.name} onChange={upd('name')}
                                    placeholder="Maria da Silva"
                                    className={inputCls(!!errors.name)} />
                                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                            </div>
                            <TF label="CPF" value={form.cpf} onChange={upd('cpf')} placeholder="000.000.000-00" />
                            <TF label="Nascimento" value={form.birth_date} onChange={upd('birth_date')} type="date" />
                            <SF label="Gênero" value={form.gender} onChange={upd('gender')} options={GENDERS} />
                        </div>
                    </Section>

                    {/* ── 2. Prescrição ── */}
                    <Section icon={Eye} title="2. Prescrição Óptica">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-white/30 mb-2 font-medium uppercase tracking-wider">OD — Olho Direito</p>
                                <div className="grid grid-cols-5 gap-2">
                                    <TF label="Esférico" value={form.od_esf} onChange={upd('od_esf')} placeholder="+0.00" />
                                    <TF label="Cilíndrico" value={form.od_cil} onChange={upd('od_cil')} placeholder="-0.00" />
                                    <TF label="Eixo" value={form.od_eixo} onChange={upd('od_eixo')} placeholder="180" />
                                    <TF label="DNP" value={form.od_dnp} onChange={upd('od_dnp')} placeholder="32" />
                                    <TF label="Adição" value={form.od_add} onChange={upd('od_add')} placeholder="+2.00" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30 mb-2 font-medium uppercase tracking-wider">OE — Olho Esquerdo</p>
                                <div className="grid grid-cols-5 gap-2">
                                    <TF label="Esférico" value={form.oe_esf} onChange={upd('oe_esf')} placeholder="+0.00" />
                                    <TF label="Cilíndrico" value={form.oe_cil} onChange={upd('oe_cil')} placeholder="-0.00" />
                                    <TF label="Eixo" value={form.oe_eixo} onChange={upd('oe_eixo')} placeholder="180" />
                                    <TF label="DNP" value={form.oe_dnp} onChange={upd('oe_dnp')} placeholder="32" />
                                    <TF label="Adição" value={form.oe_add} onChange={upd('oe_add')} placeholder="+2.00" />
                                </div>
                            </div>
                            <div className={g2}>
                                <TF label="Médico / Oftalmologista" value={form.doctor_name} onChange={upd('doctor_name')} placeholder="Dr. Carlos" />
                                <TF label="Data do Exame" value={form.exam_date} onChange={upd('exam_date')} type="date" />
                            </div>
                        </div>
                    </Section>

                    {/* ── 3. Contato ── */}
                    <Section icon={Phone} title="3. Contato e Endereço">
                        <div className={g4}>
                            <TF label="Telefone / WhatsApp" value={form.phone} onChange={upd('phone')} placeholder="(11) 99999-0000" />
                            <TF label="E-mail" value={form.email} onChange={upd('email')} type="email" placeholder="maria@email.com" />
                            <div className="col-span-2">
                                <TF label="Endereço" value={form.address} onChange={upd('address')} placeholder="Rua das Flores, 100" />
                            </div>
                            <TF label="Cidade" value={form.city} onChange={upd('city')} placeholder="São Paulo" />
                            <TF label="CEP" value={form.zip_code} onChange={upd('zip_code')} placeholder="01310-100" />
                        </div>
                    </Section>

                    {/* ── 4. Pagamento ── */}
                    <Section icon={Wallet} title="4. Pagamento">
                        <div className={g4}>
                            <TF label="Valor Total (R$)" value={form.total_value} onChange={upd('total_value')} type="number" placeholder="850.00" />
                            <TF label="Valor Pago (R$)" value={form.paid_value} onChange={upd('paid_value')} type="number" placeholder="425.00" />
                            <SF label="Forma de Pagamento" value={form.payment_method} onChange={upd('payment_method')} options={PAYMENT_METHODS} />
                            <TF label="Parcelas" value={form.installments} onChange={upd('installments')} type="number" placeholder="1" />
                        </div>
                    </Section>

                    {/* ── 5. Produto ── */}
                    <Section icon={Package} title="5. Produto">
                        <div className={g4}>
                            <TF label="Marca da Armação" value={form.frame_brand} onChange={upd('frame_brand')} placeholder="Ray-Ban" />
                            <TF label="Modelo" value={form.frame_model} onChange={upd('frame_model')} placeholder="RB3025" />
                            <TF label="Cor" value={form.frame_color} onChange={upd('frame_color')} placeholder="Preto" />
                            <SF label="Tipo de Lente" value={form.lens_type} onChange={upd('lens_type')} options={LENS_TYPES} />
                            <SF label="Material" value={form.lens_material} onChange={upd('lens_material')} options={LENS_MATERIALS} />
                            <TF label="Laboratório" value={form.lab} onChange={upd('lab')} placeholder="Essilor, Zeiss..." />
                        </div>
                    </Section>

                    {/* ── 6. Observações ── */}
                    <Section icon={FileText} title="6. Observações">
                        <textarea
                            value={form.notes}
                            onChange={upd('notes')}
                            rows={3}
                            placeholder="Anotações sobre o pedido, cliente ou pagamento..."
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
