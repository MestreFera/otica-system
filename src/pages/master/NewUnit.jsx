import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { unitService } from '../../services/unitService';
import { ArrowLeft, Building2, Eye, EyeOff } from 'lucide-react';

export default function NewUnit() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', slug: '', email: '', password: '',
        city: '', state: 'SP', active: true,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(''); // progress feedback

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Campo obrigatório';
        if (!form.slug.trim()) errs.slug = 'Campo obrigatório';
        if (!/^[a-z0-9-_]+$/.test(form.slug)) errs.slug = 'Apenas letras minúsculas, números e hífens';
        if (!form.email.trim()) errs.email = 'Campo obrigatório';
        if (!form.password || form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
        if (!form.city.trim()) errs.city = 'Campo obrigatório';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setStep('');
        try {
            const result = await unitService.createUnit({
                name: form.name,
                slug: form.slug,
                email: form.email,
                password: form.password,
                city: form.city,
                state: form.state,
                active: form.active,
                onStep: (msg) => setStep(msg),
            });

            if (!result.success) {
                setErrors({ slug: result.error || 'Erro ao criar unidade.' });
                setLoading(false);
                setStep('');
                return;
            }

            navigate('/master/unidades');
        } catch (err) {
            setErrors({ slug: 'Erro inesperado: ' + err.message });
        }
        setLoading(false);
        setStep('');
    }

    const field = (key, label, type = 'text', props = {}) => (
        <div>
            <label className="block text-sm font-medium text-cyan-300/80 mb-1.5">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 ${errors[key] ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-cyan-400'}`}
                {...props}
            />
            {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0f1e]">
            <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4 bg-[#0d1225]/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-cyan-400/60">ÓticaSystem</p>
                        <p className="text-sm font-bold text-white">Master Admin</p>
                    </div>
                </div>
            </header>

            <div className="p-6 max-w-2xl mx-auto">
                <Link to="/master/unidades" className="flex items-center gap-2 text-white/40 hover:text-cyan-400 text-sm mb-6 transition-colors">
                    <ArrowLeft size={16} />
                    Voltar para Unidades
                </Link>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
                    <h1 className="text-2xl font-bold text-white mb-2">Nova Unidade</h1>
                    <p className="text-white/40 text-sm mb-8">Cadastre uma nova ótica. O sistema criará automaticamente o usuário de acesso.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {field('name', 'Nome da Ótica', 'text', { placeholder: 'Ex: Ótica Leste' })}
                            {field('slug', 'Slug / Identificador', 'text', { placeholder: 'ex: otica-leste', onBlur: e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })) })}
                            {field('email', 'E-mail de Acesso', 'email', { placeholder: 'leste@otica.com' })}
                            <div>
                                <label className="block text-sm font-medium text-cyan-300/80 mb-1.5">Senha de Acesso</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
                                        placeholder="Mínimo 6 caracteres"
                                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 ${errors.password ? 'border-red-500' : 'border-white/10 focus:border-cyan-400'}`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                            </div>
                            {field('city', 'Cidade', 'text', { placeholder: 'São Paulo' })}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-cyan-300/80 mb-1.5">Status</label>
                            <select
                                value={form.active}
                                onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
                            >
                                <option value="true">Ativa</option>
                                <option value="false">Inativa</option>
                            </select>
                        </div>

                        {step && (
                            <div className="flex items-center gap-2 text-cyan-400 text-sm bg-cyan-400/10 border border-cyan-400/20 rounded-xl px-4 py-3">
                                <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                                {step}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Link to="/master/unidades" className="flex-1 text-center py-3 text-sm text-white/50 border border-white/10 hover:border-white/30 hover:text-white rounded-xl transition-all">
                                Cancelar
                            </Link>
                            <button type="submit" disabled={loading} className="flex-1 py-3 text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60">
                                {loading ? 'Criando...' : 'Criar Unidade + Usuário'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
