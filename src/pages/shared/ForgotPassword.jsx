import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Scan, Lock, AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { sendPasswordReset } = useAuthStore();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await sendPasswordReset(email);
        setLoading(false);
        if (result.success) {
            setSuccess(true);
        } else {
            setError(result.error);
        }
    }

    return (
        <div className="min-h-screen canvas-bg-wrapper flex items-center justify-center p-4 overflow-hidden">
            <div className="grid-bg"></div>
            <div className="aura-glow"></div>

            <div className="relative w-full max-w-md animate-on-scroll z-10">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl border border-white/10 mb-4 bg-black/50 backdrop-blur-md relative overflow-hidden" style={{ boxShadow: '0 0 30px rgba(249, 115, 22, 0.15)' }}>
                        <Scan size={28} className="text-[#F97316]" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase" style={{ fontFamily: 'var(--font-sans)' }}>
                        Recuperar Senha
                    </h1>
                    <p className="text-xs uppercase font-mono tracking-widest mt-2 text-neutral-500">
                        Insira seu e-mail para continuar
                    </p>
                </div>

                {/* Login card */}
                <div className="relative p-[1px] rounded-lg">
                    {/* Beam Borders */}
                    <div className="beam-border-h"></div>
                    <div className="beam-border-v"></div>

                    <div className="canvas-card p-8 rounded-lg relative z-10 bg-[#0A0A0A]">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock size={16} className="text-[#F97316]" />
                            <h2 className="text-sm font-bold uppercase font-mono tracking-widest text-white">Security Gateway</h2>
                        </div>

                        {success ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-400 mb-4">
                                    <CheckCircle size={24} />
                                </div>
                                <h3 className="text-white font-bold mb-2">E-mail Enviado!</h3>
                                <p className="text-neutral-400 text-sm mb-6">Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada e spam.</p>
                                <button onClick={() => navigate(-1)} className="text-xs font-mono text-[#F97316] hover:text-white transition-colors">
                                    ← Voltar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-mono mb-2 uppercase tracking-widest text-neutral-500">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@system.com" className="input-canvas" required />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-md px-4 py-3">
                                        <AlertTriangle size={14} /> {error}
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="btn-canvas w-full mt-4 !py-4">
                                    <span className="corner-accent corner-tl"></span>
                                    <span className="corner-accent corner-tr"></span>
                                    <span className="corner-accent corner-bl"></span>
                                    <span className="corner-accent corner-br"></span>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Enviando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center w-full gap-2 text-sm uppercase font-bold tracking-wider">
                                            Enviar Link <ChevronRight size={16} />
                                        </span>
                                    )}
                                </button>

                                <div className="text-center mt-4">
                                    <button type="button" onClick={() => navigate(-1)} className="text-[10px] font-mono text-neutral-500 hover:text-[#F97316] transition-colors">
                                        ← Voltar para o Login
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                        © 2026 ÓticaSystem. All rights reserved. V-2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
