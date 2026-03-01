import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';

export default function UnitLogin() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { loginUnit } = useAuthStore();

    const [unit, setUnit] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingUnit, setFetchingUnit] = useState(true);

    useEffect(() => {
        async function fetchUnit() {
            setFetchingUnit(true);
            const data = await unitService.getUnitBySlug(slug);
            setUnit(data);
            setFetchingUnit(false);
        }
        fetchUnit();
    }, [slug]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await loginUnit(slug, email, password);
        setLoading(false);
        if (result.success) {
            navigate(`/${slug}/dashboard`);
        } else {
            setError(result.error);
        }
    }

    if (fetchingUnit) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
    }

    if (!unit) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Unidade não encontrada</h1>
                    <p className="text-gray-500 mb-6">O slug "{slug}" não corresponde a nenhuma unidade.</p>
                    <a href="/master/login" className="text-indigo-600 hover:underline text-sm">Ir para o Master Admin</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/25 mb-4">
                        <span className="text-3xl">👁</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">ÓticaSystem</h1>
                    <p className="text-indigo-600 font-semibold text-sm">{unit.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{unit.city}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-8 shadow-xl shadow-indigo-500/10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar na Unidade</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="E-mail da unidade"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all bg-white"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-60 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : 'Acessar Painel'}
                        </button>
                    </form>

                    <div className="mt-6 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-500 text-center">
                            Acesso: Email e Senha configurados no Supabase Auth para a unidade <span className="font-semibold">{slug}</span>
                        </p>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        <a href="/master/login" className="hover:text-indigo-500 transition-colors">← Painel Master Admin</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
