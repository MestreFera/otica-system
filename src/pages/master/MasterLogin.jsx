import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function MasterLogin() {
    const navigate = useNavigate();
    const loginMaster = useAuthStore(s => s.loginMaster);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await loginMaster(email, password);
        setLoading(false);
        if (result.success) {
            navigate('/master/dashboard');
        } else {
            setError(result.error);
        }
    }

    return (
        <div className="min-h-screen gradient-master flex items-center justify-center p-4 dark-scroll">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl mb-4">
                        <span className="text-3xl">👁</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">ÓticaSystem</h1>
                    <p className="text-gray-400 text-sm">Painel Master — Acesso Administrativo</p>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Entrar como Master</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@master.com"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all duration-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all duration-200"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-500/25 disabled:opacity-60 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : 'Acessar Painel Master'}
                        </button>
                    </form>

                    <div className="mt-6 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <p className="text-xs text-gray-500 text-center">
                            Demo: <span className="text-yellow-500/80">admin@master.com</span> / <span className="text-yellow-500/80">master123</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
