import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { unitService } from '../../services/unitService';
import { Scan, Lock, AlertTriangle } from 'lucide-react';

export default function UnitLogin() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { loginUnit } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Check unit exists
        const unit = await unitService.getUnitBySlug(slug);
        if (!unit) {
            setError('Unidade não encontrada');
            setLoading(false);
            return;
        }
        if (!unit.active) {
            setError('Esta unidade está desativada');
            setLoading(false);
            return;
        }

        const result = await loginUnit(slug, email, password);
        setLoading(false);
        if (result.success) {
            navigate(`/${slug}/dashboard`);
        } else {
            setError(result.error);
        }
    }

    return (
        <div className="min-h-screen gradient-unit flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: 'var(--accent-dim)' }} />
            <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: 'var(--blue-dim)' }} />

            <div className="relative w-full max-w-md animate-fadeIn">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-2xl mb-4 relative" style={{ background: 'var(--accent-gradient)', boxShadow: '0 12px 30px var(--accent-glow)' }}>
                        <Scan size={28} className="text-[#0B0B0F]" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Ótica<span style={{ color: 'var(--accent)' }}>System</span>
                    </h1>
                    <p className="text-[11px] uppercase tracking-widest mt-1 font-medium capitalize" style={{ color: 'var(--text-muted)' }}>{slug?.replace(/-/g, ' ')} — Painel da Unidade</p>
                </div>

                {/* Login card */}
                <div className="glass-card glow-border p-8 shadow-2xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Lock size={16} style={{ color: 'var(--accent)' }} />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Acesso da Unidade</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>E-mail</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="unidade@otica.com" className="input-futuristic w-full" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Senha</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-futuristic w-full" required />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 text-red-400 text-sm rounded-xl px-4 py-3">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
