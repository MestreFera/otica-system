import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { unitService } from '../../services/unitService';
import { ArrowLeft } from 'lucide-react';

export default function NewUnit() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', slug: '', email: '',
        city: '', state: 'SP', active: true,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Campo obrigatório';
        if (!form.slug.trim()) errs.slug = 'Campo obrigatório';
        if (!/^[a-z0-9-_]+$/.test(form.slug)) errs.slug = 'Apenas letras minúsculas, números e hífens';
        if (!form.email.trim()) errs.email = 'Campo obrigatório';
        if (!form.city.trim()) errs.city = 'Campo obrigatório';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        const { success, error } = await unitService.createUnit({
            name: form.name,
            slug: form.slug,
            email: form.email,
            city: form.city,
            state: form.state,
            active: form.active
        });
        setLoading(false);

        if (success) {
            navigate('/master/unidades');
        } else {
            setErrors({ slug: error || 'Erro ao criar unidade (slug/email já existem?)' });
        }
    }

    const field = (key, label, type = 'text', props = {}) => (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 ${errors[key] ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-yellow-500'}`}
                {...props}
            />
            {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <div className="min-h-screen gradient-master dark-scroll">
            <header className="border-b border-gray-800/50 px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xl">👁</div>
                    <div>
                        <p className="text-xs text-gray-500">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Master Admin</p>
                    </div>
                </div>
            </header>

            <div className="p-6 max-w-2xl mx-auto">
                <Link to="/master/unidades" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
                    <ArrowLeft size={16} />
                    Voltar para Unidades
                </Link>

                <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Nova Unidade</h1>
                    <p className="text-gray-500 text-sm mb-8">Cadastre uma nova ótica no sistema (Acesso do usuário deve ser criado via painel Auth do Supabase separadamente).</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {field('name', 'Nome da Ótica', 'text', { placeholder: 'Ex: Ótica Leste' })}
                            {field('slug', 'Slug / Identificador', 'text', { placeholder: 'ex: otica-leste', onBlur: e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })) })}
                            {field('email', 'E-mail Institucional', 'email', { placeholder: 'leste@otica.com' })}
                            {field('city', 'Cidade', 'text', { placeholder: 'São Paulo' })}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
                            <select
                                value={form.active}
                                onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
                            >
                                <option value="true">Ativa</option>
                                <option value="false">Inativa</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Link
                                to="/master/unidades"
                                className="flex-1 text-center py-3 text-sm text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white rounded-xl transition-all"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-all shadow-lg disabled:opacity-60"
                            >
                                {loading ? 'Criando...' : 'Criar Unidade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
