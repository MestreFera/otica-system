// Shared UI Components

// StatusBadge
export function StatusBadge({ status, size = 'sm' }) {
    const styles = {
        'Pedir Lente': 'bg-red-100 text-red-700 border border-red-300',
        'Montagem': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
        'Laboratório': 'bg-blue-100 text-blue-700 border border-blue-300',
        'Pronto': 'bg-purple-100 text-purple-700 border border-purple-300',
        'Entregue': 'bg-green-100 text-green-700 border border-green-300',
    };
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
    return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${styles[status] || 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
            {status}
        </span>
    );
}

// Card
export function Card({ children, className = '', onClick }) {
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer card-hover' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

// MetricCard
export function MetricCard({ icon, label, value, sub, color = 'blue', onClick }) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        yellow: 'from-yellow-500 to-orange-500',
        indigo: 'from-indigo-500 to-indigo-600',
    };
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer card-hover' : ''}`}
        >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 text-white text-xl`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// Input
export function Input({ label, error, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <input
                {...props}
                className={`input-base border rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 ${error ? 'border-red-400' : 'border-gray-300'} focus:outline-none`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// Select
export function Select({ label, error, className = '', children, ...props }) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <select
                {...props}
                className={`input-base border rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white ${error ? 'border-red-400' : 'border-gray-300'} focus:outline-none`}
            >
                {children}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// Textarea
export function Textarea({ label, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <textarea
                {...props}
                className="input-base border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 resize-none focus:outline-none"
            />
        </div>
    );
}

// Button
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
    const variants = {
        primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg',
        secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        ghost: 'text-gray-600 hover:bg-gray-100',
        success: 'bg-green-500 text-white hover:bg-green-600 shadow-sm',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    return (
        <button
            {...props}
            className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
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
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    );
}

// LoadingSpinner
export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );
}
