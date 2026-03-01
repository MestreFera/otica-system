import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { clientService } from '../../services/clientService';
import UnitLayout from '../../components/UnitLayout';
import { ArrowLeft, Save } from 'lucide-react';

const LENS_TYPES = ['Monofocal', 'Bifocal', 'Progressiva', 'Ocupacional', 'Digital Free-Form'];

export default function ClientForm() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const unitId = profile?.unit_id;
    const isEdit = !!id;

    const [form, setForm] = useState({
        client_name: '', phone: '', doctor_name: '',
        od_esf: '', od_cil: '', od_eixo: '',
        oe_esf: '', oe_cil: '', oe_eixo: '',
        lens_type: '', lab: '', total_value: '', notes: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEdit && unitId) {
            setLoading(true);
            clientService.getClientById(id).then(data => {
                if (data) setForm({
                    client_name: data.client_name || '',
                    phone: data.phone || '',
                    doctor_name: data.doctor_name || '',
                    od_esf: data.od_esf || '', od_cil: data.od_cil || '', od_eixo: data.od_eixo || '',
                    oe_esf: data.oe_esf || '', oe_cil: data.oe_cil || '', oe_eixo: data.oe_eixo || '',
                    lens_type: data.lens_type || '',
                    lab: data.lab || '',
                    total_value: data.total_value || '',
                    notes: data.notes || '',
                });
                setLoading(false);
            });
        }
    }, [id, isEdit, unitId]);

    function validate() {
        const errs = {};
        if (!form.client_name.trim()) errs.client_name = 'Obrigatório';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        const payload = { ...form, unit_id: unitId, total_value: form.total_value ? Number(form.total_value) : null };

        if (isEdit) {
            await clientService.updateClient(id, payload);
        } else {
            await clientService.createClient(payload);
        }
        setSaving(false);
        navigate(`/${slug}/clientes`);
    }

    const field = (key, label, type = 'text', props = {}) => (
        <div>
            <label className="block text-xs font-medium text-cyan-300/60 mb-1.5 uppercase tracking-wider">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(e2 => ({ ...e2, [key]: '' })); }}
                className={`input-futuristic w-full ${errors[key] ? 'border-red-500/50' : ''}`}
                {...props}
            />
            {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <UnitLayout slug={slug}>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/30 hover:text-cyan-400 text-sm mb-6 transition-colors">
                <ArrowLeft size={16} /> Voltar
            </button>

            <div className="glass-card glow-border p-8 max-w-3xl">
                <h1 className="text-2xl font-bold text-white mb-1">{isEdit ? 'Editar' : 'Novo'} Atendimento</h1>
                <p className="text-white/30 text-sm mb-8">Preencha os dados do paciente e da receita</p>

                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Info */}
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Paciente</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {field('client_name', 'Nome Completo', 'text', { placeholder: 'João Silva' })}
                                {field('phone', 'Telefone', 'text', { placeholder: '(11) 99999-0000' })}
                                {field('doctor_name', 'Médico', 'text', { placeholder: 'Dr. Carlos' })}
                            </div>
                        </div>

                        {/* Prescription */}
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Receita — OD (Olho Direito)</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {field('od_esf', 'Esférico', 'text', { placeholder: '+0.00' })}
                                {field('od_cil', 'Cilíndrico', 'text', { placeholder: '-0.00' })}
                                {field('od_eixo', 'Eixo', 'text', { placeholder: '180' })}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Receita — OE (Olho Esquerdo)</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {field('oe_esf', 'Esférico', 'text', { placeholder: '+0.00' })}
                                {field('oe_cil', 'Cilíndrico', 'text', { placeholder: '-0.00' })}
                                {field('oe_eixo', 'Eixo', 'text', { placeholder: '180' })}
                            </div>
                        </div>

                        {/* Order info */}
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400/60 uppercase tracking-widest mb-3">Pedido</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-cyan-300/60 mb-1.5 uppercase tracking-wider">Tipo de Lente</label>
                                    <select value={form.lens_type} onChange={e => setForm(f => ({ ...f, lens_type: e.target.value }))} className="input-futuristic w-full">
                                        <option value="">Selecionar...</option>
                                        {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                {field('lab', 'Laboratório', 'text', { placeholder: 'Essilor, Zeiss...' })}
                                {field('total_value', 'Valor Total (R$)', 'number', { placeholder: '350.00', step: '0.01' })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-medium text-cyan-300/60 mb-1.5 uppercase tracking-wider">Observações</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notas sobre o pedido..." className="input-futuristic w-full resize-none" />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1 text-center">Cancelar</button>
                            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                <Save size={16} /> {saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </UnitLayout>
    );
}
