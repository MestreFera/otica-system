import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Scan, Lock, AlertTriangle, ChevronRight } from 'lucide-react';

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
                        Master Node
                    </h1>
                    <p className="text-xs uppercase font-mono tracking-widest mt-2 text-neutral-500">
                        Admin clearance required
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
                            <h2 className="text-sm font-bold uppercase font-mono tracking-widest text-white">System Override gateway</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-mono mb-2 uppercase tracking-widest text-neutral-500">Root Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@master.com" className="input-canvas" required />
                            </div>
                            <div>
                                <label className="block text-xs font-mono mb-2 uppercase tracking-widest text-neutral-500">Root Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-canvas" required />
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
                                        Authenticating...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center w-full gap-2 text-sm uppercase font-bold tracking-wider">
                                        Initialize Override <ChevronRight size={16} />
                                    </span>
                                )}
                            </button>
                        </form>
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
