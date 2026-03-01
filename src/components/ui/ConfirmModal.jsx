import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', danger = false }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative glass-card glow-border p-6 w-full max-w-sm animate-fadeIn text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={22} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${danger ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'btn-primary'}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
