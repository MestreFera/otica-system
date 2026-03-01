// Shared UI Components — Futuristic Dark Theme

// StatusBadge
export function StatusBadge({ status, size = 'sm' }) {
    const styles = {
        'Novo': 'badge-novo',
        'Em Produção': 'badge-producao',
        'Pronto': 'badge-pronto',
        'Entregue': 'badge-entregue',
        'Cancelado': 'badge-cancelado',
    };
    const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
    return (
        <span className={`inline-flex items-center rounded-full font-semibold tracking-wide ${sizeClass} ${styles[status] || 'bg-white/5 text-white/50 border border-white/10'}`}>
            {status}
        </span>
    );
}

// Card
export function Card({ children, className = '', onClick }) {
    return (
        <div
            onClick={onClick}
            className={`glass-card ${onClick ? 'cursor-pointer card-hover' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

// MetricCard
export function MetricCard({ icon, label, value, sub, color = 'cyan', onClick }) {
    const colors = {
        cyan: 'from-cyan-400 to-blue-500',
        purple: 'from-purple-500 to-indigo-600',
        green: 'from-emerald-400 to-green-600',
        red: 'from-red-400 to-rose-600',
        yellow: 'from-amber-400 to-orange-500',
        indigo: 'from-indigo-400 to-violet-600',
        blue: 'from-blue-400 to-cyan-500',
    };
    return (
        <div
            onClick={onClick}
            className={`metric-card flex items-center gap-4 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 text-white shadow-lg`}
                style={{ boxShadow: `0 4px 15px rgba(0,212,255,0.2)` }}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white leading-tight">{value}</p>
                {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// Input
export function Input({ label, error, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-sm font-medium text-cyan-300/70">{label}</label>}
            <input
                {...props}
                className={`input-futuristic ${error ? 'border-red-500/50 focus:border-red-400' : ''}`}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

// Select
export function Select({ label, error, className = '', children, ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-sm font-medium text-cyan-300/70">{label}</label>}
            <select
                {...props}
                className={`input-futuristic ${error ? 'border-red-500/50' : ''}`}
            >
                {children}
            </select>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

// Textarea
export function Textarea({ label, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-sm font-medium text-cyan-300/70">{label}</label>}
            <textarea
                {...props}
                className="input-futuristic resize-none"
            />
        </div>
    );
}

// Button
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-ghost',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-xl',
        ghost: 'btn-ghost',
        success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    return (
        <button
            {...props}
            className={`inline-flex items-center gap-2 font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
}

// Modal
export function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative glass-card glow-border w-full max-w-md animate-fadeIn shadow-2xl shadow-cyan-500/10">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-cyan-400 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">×</button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

// EmptyState
export function EmptyState({ icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 animate-float">{icon}</div>
            <h3 className="text-lg font-semibold text-white/80 mb-1">{title}</h3>
            <p className="text-sm text-white/30">{description}</p>
        </div>
    );
}

// LoadingSpinner
export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
        </div>
    );
}
