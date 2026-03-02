import { useState } from 'react';
import UnitLayout from '../../components/UnitLayout';
import { useParams } from 'react-router-dom';
import { MessageCircle, Check, ChevronDown } from 'lucide-react';

const inp = `w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all duration-200 text-sm`;
const labelClass = `block text-sm font-semibold mb-1.5 text-white`;

const PROVIDERS = ['Z-API', 'Evolution API', 'Meta Cloud API'];

export default function WhatsAppConfig() {
    const { slug } = useParams();

    const [provider, setProvider] = useState('Z-API');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Form state
    const [config, setConfig] = useState({
        url: '',
        clientToken: '',
        apiUrl: '',
        instanceId: '',
        token: ''
    });

    const isFormValid = config.url.length > 5 && config.clientToken.length > 5;

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
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8">

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
                            className={`w-48 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isFormValid
                                ? 'bg-[#F97316] text-black hover:bg-[#F97316]/90 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                                : 'bg-[#1A1A1A] text-neutral-600 cursor-not-allowed'
                                }`}
                            disabled={!isFormValid}
                        >
                            Salvar configuração
                        </button>
                    </div>

                </div>
            </div>
        </UnitLayout>
    );
}
