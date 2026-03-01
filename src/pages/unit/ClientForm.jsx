import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { Input, Select, Textarea } from '../../components/ui';
import { TIPO_LENTE_OPTIONS, CONDICAO_PAGAMENTO_OPTIONS, STATUS_ORDER } from '../../utils/helpers';
import { ArrowLeft, Save } from 'lucide-react';

const INITFORM = {
    status: 'Novo', name: '', doctor_name: '', seller_name: '',
    od_esf: '', od_cil: '', od_eixo: '', od_add: '',
    oe_esf: '', oe_cil: '', oe_eixo: '', oe_add: '',
    lens_type: 'Monofocal',
    cpf: '', phone: '', email: '', birth_date: '', zip_code: '', city: '', address: '',
    payment_method: 'PIX', total_value: '',
    frame_brand: '', frame_model: '', notes: '',
};

function PrescriptionRow({ label, prefix, form, set }) {
    return (
        <tr>
            <td className="py-2 pr-4 text-sm font-medium text-gray-600 whitespace-nowrap">{label}</td>
            {['esf', 'cil', 'eixo', 'add'].map(f => {
                const key = `${prefix}_${f}`;
                return (
                    <td key={f} className="py-1 px-1">
                        <input
                            type="text"
                            value={form[key] || ''}
                            onChange={e => set(key, e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-gray-800 focus:outline-none focus:border-indigo-400 transition-colors"
                        />
                    </td>
                );
            })}
        </tr>
    );
}

function SectionTitle({ children }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{children}</h3>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
    );
}

export default function ClientForm() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;

    const isEdit = Boolean(id);
    const [form, setForm] = useState(INITFORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) return;
        async function fetchClient() {
            const data = await clientService.getClientById(id);
            if (data) {
                // Map DB nulls to empty strings
                const safeData = Object.keys(data).reduce((acc, k) => {
                    acc[k] = data[k] === null ? '' : data[k];
                    return acc;
                }, {});
                setForm({ ...INITFORM, ...safeData });
            }
            setFetching(false);
        }
        fetchClient();
    }, [id, isEdit]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Campo obrigatório';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        if (!unitId) {
            alert('Sessão inválida. Faça login novamente.');
            return;
        }

        setLoading(true);
        const payload = {
            status: form.status, name: form.name, doctor_name: form.doctor_name,
            od_esf: form.od_esf ? Number(form.od_esf) : null,
            od_cil: form.od_cil ? Number(form.od_cil) : null,
            od_eixo: form.od_eixo ? Number(form.od_eixo) : null,
            od_add: form.od_add ? Number(form.od_add) : null,
            oe_esf: form.oe_esf ? Number(form.oe_esf) : null,
            oe_cil: form.oe_cil ? Number(form.oe_cil) : null,
            oe_eixo: form.oe_eixo ? Number(form.oe_eixo) : null,
            oe_add: form.oe_add ? Number(form.oe_add) : null,
            lens_type: form.lens_type,
            cpf: form.cpf, phone: form.phone, email: form.email,
            birth_date: form.birth_date || null, zip_code: form.zip_code, city: form.city, address: form.address,
            payment_method: form.payment_method, total_value: form.total_value ? Number(form.total_value) : 0,
            frame_brand: form.frame_brand, frame_model: form.frame_model, notes: form.notes,
        };

        let result;
        if (isEdit) {
            result = await clientService.updateClient(id, payload);
        } else {
            result = await clientService.createClient(unitId, payload);
        }

        setLoading(false);

        if (result.success) {
            navigate(`/${slug}/clientes/${result.data.id}`);
        } else {
            alert('Erro ao salvar cliente: ' + result.error);
        }
    }

    if (fetching) return <UnitLayout slug={slug}><div className="text-center py-12">Carregando...</div></UnitLayout>;

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-4xl mx-auto">
                <Link to={isEdit ? `/${slug}/clientes/${id}` : `/${slug}/clientes`} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-5 transition-colors">
                    <ArrowLeft size={16} />
                    {isEdit ? 'Voltar ao cliente' : 'Voltar para Clientes'}
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Identificação */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <SectionTitle>Identificação</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
                                {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
                            </Select>
                            <Input label="Nome Completo *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="Nome do cliente" className="lg:col-span-2" />
                            <Input label="Médico Oftalmo" value={form.doctor_name || ''} onChange={e => set('doctor_name', e.target.value)} placeholder="Dr. Nome" className="lg:col-span-3" />
                        </div>
                    </section>

                    {/* Prescrição */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <SectionTitle>Prescrição Oftálmica</SectionTitle>
                        <div className="overflow-x-auto mb-5">
                            <table className="w-full">
                                <thead>
                                    <tr><th /><th className="text-xs font-semibold text-gray-400 pb-2 px-1 text-center">ESF</th><th className="text-xs font-semibold text-gray-400 pb-2 px-1 text-center">CIL</th><th className="text-xs font-semibold text-gray-400 pb-2 px-1 text-center">EIXO</th><th className="text-xs font-semibold text-gray-400 pb-2 px-1 text-center">ADD</th></tr>
                                </thead>
                                <tbody>
                                    <PrescriptionRow label="OD (Direito)" prefix="od" form={form} set={set} />
                                    <PrescriptionRow label="OE (Esquerdo)" prefix="oe" form={form} set={set} />
                                </tbody>
                            </table>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select label="Tipo de Lente" value={form.lens_type || 'Monofocal'} onChange={e => set('lens_type', e.target.value)}>
                                {TIPO_LENTE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                            </Select>
                        </div>
                    </section>

                    {/* Dados Pessoais */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <SectionTitle>Dados Pessoais</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Input label="CPF" value={form.cpf || ''} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                            <Input label="Telefone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
                            <Input label="E-mail" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
                            <Input label="Data de Nascimento" type="date" value={form.birth_date || ''} onChange={e => set('birth_date', e.target.value)} />
                            <Input label="CEP" value={form.zip_code || ''} onChange={e => set('zip_code', e.target.value)} placeholder="00000-000" />
                            <Input label="Cidade" value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="São Paulo" />
                            <Input label="Endereço" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Rua, número" className="sm:col-span-2 lg:col-span-3" />
                        </div>
                    </section>

                    {/* Pagamento */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <SectionTitle>Informações de Pagamento</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select label="Condição de Pagamento" value={form.payment_method || 'PIX'} onChange={e => set('payment_method', e.target.value)}>
                                {CONDICAO_PAGAMENTO_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </Select>
                            <Input label="Valor Total (R$)" type="number" step="0.01" value={form.total_value || ''} onChange={e => set('total_value', e.target.value)} placeholder="0.00" />
                        </div>
                    </section>

                    {/* Informações Adicionais */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <SectionTitle>Informações Adicionais</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Textarea label="Informações da Armação (Marca/Modelo)" value={`${form.frame_brand || ''} ${form.frame_model || ''}`} onChange={e => set('frame_brand', e.target.value)} placeholder="Marca, modelo, cor..." rows={3} />
                            <Textarea label="Observações" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notas sobre o pedido..." rows={3} />
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex gap-3 pb-4">
                        <Link
                            to={isEdit ? `/${slug}/clientes/${id}` : `/${slug}/clientes`}
                            className="flex-1 text-center py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
                        >
                            <Save size={16} />
                            {loading ? 'Salvando...' : isEdit ? 'Atualizar Cliente' : 'Salvar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </UnitLayout>
    );
}
