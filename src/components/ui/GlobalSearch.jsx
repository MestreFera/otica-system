import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';
import { Search, X, User, Calendar, Zap } from 'lucide-react';

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { profile } = useAuthStore();

    useEffect(() => {
        function handleKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(o => !o);
            }
            if (e.key === 'Escape') setOpen(false);
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        if (open) { inputRef.current?.focus(); setQuery(''); setResults([]); }
    }, [open]);

    useEffect(() => {
        if (!query || query.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            const { data } = await supabase.from('clients')
                .select('id, name, client_name, phone, status, unit_id, units(slug, name)')
                .or(`name.ilike.%${query}%,client_name.ilike.%${query}%,phone.ilike.%${query}%,cpf.ilike.%${query}%`)
                .limit(8);
            setResults(data || []);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    function handleSelect(client) {
        const slug = client.units?.slug || 'centro';
        navigate(`/${slug}/clientes/${client.id}`);
        setOpen(false);
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-lg animate-fadeIn">
                <div className="glass-card glow-border overflow-hidden shadow-2xl shadow-cyan-500/10">
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
                        <Search size={18} className="text-cyan-400/60 flex-shrink-0" />
                        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente por nome, CPF ou telefone..." className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-sm" />
                        <kbd className="hidden sm:inline text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
                        <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/60"><X size={16} /></button>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto dark-scroll">
                        {loading && (
                            <div className="text-center py-8">
                                <div className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
                            </div>
                        )}
                        {!loading && results.length === 0 && query.length >= 2 && (
                            <div className="text-center py-8 text-white/20 text-sm">Nenhum resultado para "{query}"</div>
                        )}
                        {!loading && query.length < 2 && (
                            <div className="text-center py-8 text-white/15 text-sm">Digite ao menos 2 caracteres</div>
                        )}
                        {results.map(c => (
                            <button key={c.id} onClick={() => handleSelect(c)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors text-left group">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/15 to-purple-500/15 border border-white/[0.06] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {(c.client_name || c.name)?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/80 group-hover:text-white truncate">{c.client_name || c.name}</p>
                                    <p className="text-xs text-white/25">{c.units?.name || ''} · {c.phone || 'Sem telefone'}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${c.status === 'Entregue' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                                        c.status === 'Pronto' ? 'bg-purple-500/15 text-purple-400 border-purple-500/25' :
                                            'bg-white/5 text-white/30 border-white/10'
                                    }`}>{c.status}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
