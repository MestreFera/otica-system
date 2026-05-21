import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Scan, Lock, AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { updatePassword } = useAuthStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Regex para senha forte: mínimo 8 caracteres, uma letra maiúscula, um número, um caractere especial
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            // If no session is found after redirect, the link might be invalid or expired.
            // But we'll let the user try to submit and it will fail gracefully.
        };
        checkSession();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (!strongPasswordRegex.test(password)) {
            setError('Senha deve conter no mínimo 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial (@$!%*?&).');
            return;
        }

        setLoading(true);
        const result = await updatePassword(password);
        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
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
                        Nova Senha
                    </h1>
                    <p className="text-xs uppercase font-mono tracking-widest mt-2 text-neutral-500">
                        Defina sua nova credencial de acesso
                    </p>
                </div>

                {/* Form card */}
                <div className="relative p-[1px] rounded-lg">
                    {/* Beam Borders */}
                    <div className="beam-border-h"></div>
                    <div className="beam-border-v"></div>

                    <div className="canvas-card p-8 rounded-lg relative z-10 bg-[#0A0A0A]">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock size={16} className="text-[#F97316]" />
                            <h2 className="text-sm font-bold uppercase font-mono tracking-widest text-white">Security Update</h2>
                        </div>

                        {success ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-400 mb-4">
                                    <CheckCircle size={24} />
                                </div>
                                <h3 className="text-white font-bold mb-2">Senha Atualizada!</h3>
                                <p className="text-neutral-400 text-sm mb-6">Sua senha foi redefinida com segurança. Redirecionando para o sistema...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-mono mb-2 uppercase tracking-widest text-neutral-500">Nova Senha</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-canvas" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono mb-2 uppercase tracking-widest text-neutral-500">Confirmar Nova Senha</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input-canvas" required />
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
                                            Salvando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center w-full gap-2 text-sm uppercase font-bold tracking-wider">
                                            Confirmar Alteração <ChevronRight size={16} />
                                        </span>
                                    )}
                                </button>
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
