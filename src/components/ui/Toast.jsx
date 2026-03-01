import { create } from 'zustand';

export const useToastStore = create((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Date.now() + Math.random();
        const newToast = { id, duration: 4000, ...toast };
        set((s) => ({ toasts: [...s.toasts, newToast] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
        }, newToast.duration);
        return id;
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    undoToast: (id, callback) => {
        set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
        if (callback) callback();
    },
}));

// Toast container component
export function ToastContainer() {
    const { toasts, removeToast, undoToast } = useToastStore();

    const icons = {
        success: '✓', error: '✕', info: 'ℹ', warning: '⚠',
    };
    const colors = {
        success: 'border-emerald-500/30 bg-emerald-500/10',
        error: 'border-red-500/30 bg-red-500/10',
        info: 'border-cyan-500/30 bg-cyan-500/10',
        warning: 'border-amber-500/30 bg-amber-500/10',
    };
    const iconColors = {
        success: 'text-emerald-400', error: 'text-red-400', info: 'text-cyan-400', warning: 'text-amber-400',
    };

    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-2xl animate-slideIn ${colors[t.type] || colors.info}`}>
                    <span className={`text-lg ${iconColors[t.type] || iconColors.info}`}>{icons[t.type] || icons.info}</span>
                    <div className="flex-1 min-w-0">
                        {t.title && <p className="text-sm font-semibold text-white">{t.title}</p>}
                        <p className="text-xs text-white/60">{t.message}</p>
                    </div>
                    {t.undoCallback && (
                        <button onClick={() => undoToast(t.id, t.undoCallback)} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                            Desfazer
                        </button>
                    )}
                    <button onClick={() => removeToast(t.id)} className="text-white/20 hover:text-white/60 text-sm transition-colors">✕</button>
                </div>
            ))}
        </div>
    );
}
