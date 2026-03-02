import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Scan, Lock } from 'lucide-react';

export default function MasterLogin() {
    const navigate = useNavigate();
    const { loginMaster } = useAuthStore();
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
        <div className="min-h-screen gradient-master flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ background: 'var(--accent-dim)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ background: 'var(--blue-dim)' }} />

            <div className="relative w-full max-w-md animate-fadeIn">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl mb-5 relative" style={{ background: 'var(--accent-gradient)', boxShadow: '0 12px 40px var(--accent-glow)' }}>
                        <Scan size={36} className="text-[#0B0B0F]" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Ótica<span style={{ color: 'var(--accent)' }}>System</span>
                    </h1>
                    <p className="text-[11px] uppercase tracking-widest mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>Painel de Controle Master</p>
                </div>

                {/* Login Card */}
                <div className="glass-card glow-border p-8 shadow-2xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Lock size={16} style={{ color: 'var(--accent)' }} />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Acesso Administrativo</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@master.com"
                                className="input-futuristic w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-futuristic w-full"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Autenticando...
                                </span>
                            ) : 'Entrar no Painel'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
