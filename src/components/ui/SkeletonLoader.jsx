export function Skeleton({ className = '', variant = 'rect' }) {
    const base = 'bg-white/[0.04] animate-pulse rounded-xl';
    if (variant === 'circle') return <div className={`${base} rounded-full ${className}`} />;
    if (variant === 'text') return <div className={`${base} h-4 ${className}`} />;
    return <div className={`${base} ${className}`} />;
}

export function SkeletonCard() {
    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton variant="circle" className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-2/3" />
                    <Skeleton variant="text" className="w-1/3 h-3" />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
        </div>
    );
}

export function SkeletonMetric() {
    return (
        <div className="metric-card flex items-center gap-4">
            <Skeleton variant="circle" className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-1/2 h-3" />
                <Skeleton variant="text" className="w-1/3 h-6" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-3 p-3">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} variant="text" className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
