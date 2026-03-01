import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Scan, Package, CheckCircle, Truck, Clock, AlertTriangle, Phone, MapPin } from 'lucide-react';

const STATUS_CONFIG = {
    'Novo': { icon: Package, color: 'text-blue-400', bg: 'bg-blue-400', label: 'Pedido Registrado' },
    'Em Produção': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400', label: 'Em Produção' },
    'Pronto': { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-400', label: 'Pronto para Retirada' },
    'Entregue': { icon: Truck, color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Entregue' },
    'Cancelado': { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400', label: 'Cancelado' },
};

const STATUS_ORDER = ['Novo', 'Em Produção', 'Pronto', 'Entregue'];

export default function ClientStatusPage() {
    const { token } = useParams();
    const [client, setClient] = useState(null);
    const [unit, setUnit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function load() {
            const { data, error: err } = await supabase
                .from('clients')
                .select('*, status_history(*), units(name, city, state, email, slug)')
                .eq('public_token', token)
                .single();

            if (err || !data) {
                setError('Link inválido ou expirado');
                setLoading(false);
                return;
            }

            if (data.status_history) {
                data.status_history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            }
            setClient(data);
            setUnit(data.units);

            // Try to load unit settings for branding
            if (data.unit_id) {
                const { data: settings } = await supabase.from('unit_settings').select('*').eq('unit_id', data.unit_id).single();
                if (settings) setUnit(u => ({ ...u, ...settings }));
            }
            setLoading(false);
        }
        load();
    }, [token]);

    if (loading) return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
            <div className="text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
                <p className="text-white/30 text-sm">Solicite um novo link à sua ótica.</p>
            </div>
        </div>
    );

    const currentIdx = STATUS_ORDER.indexOf(client.status);
    const StatusIcon = STATUS_CONFIG[client.status]?.icon || Package;
    const accentColor = unit?.primary_color || '#00d4ff';

    return (
        <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-10 pointer-events-none" style={{ background: accentColor }} />

            <div className="max-w-lg mx-auto px-4 py-8 relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative" style={{ background: `linear-gradient(135deg, ${accentColor}, #7c3aed)` }}>
                        <Scan size={28} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">{unit?.name || 'ÓticaSystem'}</h1>
                    {unit?.city && <p className="text-xs text-white/30 flex items-center justify-center gap-1 mt-1"><MapPin size={10} /> {unit.city}, {unit.state}</p>}
                </div>

                {/* Client card */}
                <div className="glass-card glow-border p-6 mb-6">
                    <p className="text-xs text-white/25 uppercase tracking-widest mb-1">Acompanhamento do Pedido</p>
                    <h2 className="text-xl font-bold text-white mb-4">{client.client_name || client.name}</h2>

                    {/* Current status */}
                    <div className="flex items-center gap-4 p-4 rounded-xl mb-6" style={{ background: `${accentColor}10`, borderColor: `${accentColor}25`, borderWidth: 1, borderStyle: 'solid' }}>
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center animate-pulse-glow" style={{ background: `${accentColor}20` }}>
                            <StatusIcon size={28} style={{ color: accentColor }} />
                        </div>
                        <div>
                            <p className="text-white/40 text-xs uppercase tracking-widest">Status Atual</p>
                            <p className="text-lg font-bold text-white">{STATUS_CONFIG[client.status]?.label || client.status}</p>
                        </div>
                    </div>

                    {/* Progress pipeline */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        {STATUS_ORDER.map((s, i) => {
                            const Icon = STATUS_CONFIG[s].icon;
                            const isActive = i <= currentIdx;
                            const isCurrent = s === client.status;
                            return (
                                <div key={s} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#0a0f1e]' : ''} ${isActive ? '' : 'bg-white/5'}`}
                                            style={isActive ? { background: `${accentColor}25`, color: accentColor, ringColor: accentColor } : {}}>
                                            <Icon size={14} className={isActive ? '' : 'text-white/20'} style={isActive ? { color: accentColor } : {}} />
                                        </div>
                                        <span className={`text-[9px] mt-1.5 ${isActive ? 'text-white/60' : 'text-white/15'}`}>{s}</span>
                                    </div>
                                    {i < STATUS_ORDER.length - 1 && (
                                        <div className="flex-1 h-0.5 mx-1 rounded-full" style={{ background: i < currentIdx ? accentColor : 'rgba(255,255,255,0.05)' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Timeline */}
                    {client.status_history?.length > 0 && (
                        <div>
                            <h3 className="text-xs text-white/25 uppercase tracking-widest mb-3">Histórico</h3>
                            <div className="space-y-3">
                                {client.status_history.map((h, i) => (
                                    <div key={i} className="flex items-start gap-3 relative">
                                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: accentColor, opacity: 0.6 }} />
                                        {i < client.status_history.length - 1 && <div className="absolute left-[3px] top-3 w-0.5 h-full bg-white/[0.04]" />}
                                        <div>
                                            <p className="text-xs font-semibold text-white/60">{h.new_status}</p>
                                            {h.note && <p className="text-[10px] text-white/25 italic">{h.note}</p>}
                                            <p className="text-[10px] text-white/15">{new Date(h.created_at).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact */}
                {unit?.email && (
                    <div className="text-center">
                        <p className="text-xs text-white/20 mb-2">Dúvidas? Entre em contato</p>
                        <div className="flex justify-center gap-3">
                            {unit.whatsapp_number && (
                                <a href={`https://wa.me/55${unit.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10 transition-all">
                                    <Phone size={12} /> WhatsApp
                                </a>
                            )}
                            <a href={`mailto:${unit.email}`} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border text-cyan-400 border-cyan-400/20 hover:bg-cyan-400/10 transition-all">
                                ✉ E-mail
                            </a>
                        </div>
                    </div>
                )}

                <p className="text-center text-[10px] text-white/10 mt-8">Powered by ÓticaSystem</p>
            </div>
        </div>
    );
}
