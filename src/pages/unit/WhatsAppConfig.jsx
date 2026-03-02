import { useState, useEffect } from 'react';
import UnitLayout from '../../components/UnitLayout';
import { useParams } from 'react-router-dom';
import { MessageCircle, Check, ChevronDown, Loader2 } from 'lucide-react';
import { unitService } from '../../services/unitService';
import { whatsappConfigService } from '../../services/whatsappConfigService';

const inp = `w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all duration-200 text-sm`;
const labelClass = `block text-sm font-semibold mb-1.5 text-white`;

const PROVIDERS = ['Z-API', 'Evolution API', 'Meta Cloud API'];

export default function WhatsAppConfig() {
    const { slug } = useParams();

    const [provider, setProvider] = useState('Z-API');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // API loading state
    const [unitId, setUnitId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [config, setConfig] = useState({
        url: '',
        clientToken: '',
        apiUrl: '',
        instanceId: '',
        token: ''
    });

    useEffect(() => {
        async function init() {
            setLoading(true);
            const unit = await unitService.getUnitBySlug(slug);
            if (unit) {
                setUnitId(unit.id);
                const savedConf = await whatsappConfigService.getConfig(unit.id);
                if (savedConf) {
                    setProvider(savedConf.provider || 'Z-API');
                    setConfig({
                        url: savedConf.send_text_url || '',
                        clientToken: savedConf.client_token || '',
                        apiUrl: savedConf.api_url || '',
                        instanceId: savedConf.instance_id || '',
                        token: savedConf.instance_token || ''
                    });
                }
            }
            setLoading(false);
        }
        init();
    }, [slug]);

    const isFormValid = config.url.length > 5 && config.clientToken.length > 5;

    async function handleSave() {
        if (!unitId || !isFormValid) return;
        setSaving(true);
        const res = await whatsappConfigService.upsertConfig(unitId, {
            provider,
            send_text_url: config.url,
            client_token: config.clientToken,
            api_url: config.apiUrl,
            instance_id: config.instanceId,
            instance_token: config.token
        });
        setSaving(false);
        if (res.success) {
            alert('Configuração WhatsApp salva com sucesso!');
        } else {
            alert('Erro ao salvar: ' + res.error);
        }
    }

    return (
        <UnitLayout slug={slug}>
            <div className="max-w-[800px] mx-auto pb-24">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]">
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Configuração WhatsApp</h1>
                        <p className="text-sm text-neutral-400 mt-1">Configure o envio manual de mensagens no chat.</p>
                    </div>
                </div>

                {/* ── Main Card ── */}
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-[#111]/80 backdrop-blur-sm z-30 flex items-center justify-center rounded-3xl border border-white/5">
                            <Loader2 size={32} className="text-[#F97316] animate-spin" />
                        </div>
                    )}

                    {/* Provider Dropdown */}
                    <div className="mb-6 relative">
                        <label className={labelClass}>Provider</label>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
                        >
                            <span className="text-sm font-medium">{provider}</span>
                            <ChevronDown size={16} className={`text-neutral-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                                <div className="absolute top-[105%] left-0 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-2 z-20 flex flex-col gap-1">
                                    {PROVIDERS.map(p => {
                                        const isActive = provider === p;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => { setProvider(p); setDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-all duration-200 ${isActive
                                                    ? 'bg-[#F97316] text-black font-bold'
                                                    : 'text-neutral-300 font-medium hover:bg-white/5'
                                                    }`}
                                            >
                                                {p}
                                                {isActive && <Check size={16} className="text-black" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Send-text URL (completo)</label>
                            <input
                                type="text"
                                className={inp}
                                placeholder="https://api.z-api.io/instances/XXX/token/YYY/send-text"
                                value={config.url}
                                onChange={e => setConfig({ ...config, url: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Client-Token</label>
                            <input
                                type="text"
                                className={inp}
                                placeholder="Client-Token do header"
                                value={config.clientToken}
                                onChange={e => setConfig({ ...config, clientToken: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>API URL <span className="text-neutral-500 font-normal">(opcional)</span></label>
                            <input
                                type="text"
                                className={inp}
                                placeholder="https://api.z-api.io"
                                value={config.apiUrl}
                                onChange={e => setConfig({ ...config, apiUrl: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Instance ID <span className="text-neutral-500 font-normal">(opcional)</span></label>
                            <input
                                type="text"
                                className={inp}
                                placeholder="instance id"
                                value={config.instanceId}
                                onChange={e => setConfig({ ...config, instanceId: e.target.value })}
                            />
                        </div>

                        <div className="pb-4">
                            <label className={labelClass}>Token <span className="text-neutral-500 font-normal">(opcional)</span></label>
                            <input
                                type="text"
                                className={inp}
                                placeholder="token da instancia"
                                value={config.token}
                                onChange={e => setConfig({ ...config, token: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            className={`w-48 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isFormValid && !saving
                                    ? 'bg-[#F97316] text-black hover:bg-[#F97316]/90 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                                    : 'bg-[#1A1A1A] text-neutral-600 cursor-not-allowed'
                                }`}
                            disabled={!isFormValid || saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar configuração'
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </UnitLayout>
    );
}
