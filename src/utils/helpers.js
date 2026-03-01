// Utility functions for the optical store system

// Status configuration
export const STATUS_CONFIG = {
    'Pedir Lente': {
        color: '#dc2626',
        bg: '#fee2e2',
        border: '#fca5a5',
        badge: 'badge-pedir-lente',
        label: 'Pedir Lente',
    },
    'Montagem': {
        color: '#ca8a04',
        bg: '#fef9c3',
        border: '#fde047',
        badge: 'badge-montagem',
        label: 'Montagem',
    },
    'Laboratório': {
        color: '#2563eb',
        bg: '#dbeafe',
        border: '#93c5fd',
        badge: 'badge-laboratorio',
        label: 'Laboratório',
    },
    'Pronto': {
        color: '#9333ea',
        bg: '#f3e8ff',
        border: '#d8b4fe',
        badge: 'badge-pronto',
        label: 'Pronto',
    },
    'Entregue': {
        color: '#16a34a',
        bg: '#dcfce7',
        border: '#86efac',
        badge: 'badge-entregue',
        label: 'Entregue',
    },
};

export const STATUS_ORDER = ['Pedir Lente', 'Montagem', 'Laboratório', 'Pronto', 'Entregue'];

export const TIPO_LENTE_OPTIONS = [
    'Monofocal',
    'Monofocal Anti-Reflexo',
    'Monofocal Alta Definição',
    'Progressiva',
    'Progressiva Premium',
    'Bifocal',
    'Ocupacional',
    'Lente de Contato',
];

export const CONDICAO_PAGAMENTO_OPTIONS = [
    'Dinheiro',
    'PIX',
    'Cartão Débito',
    'Cartão Crédito 1x',
    'Cartão Crédito 2x',
    'Cartão Crédito 3x',
    'Cartão Crédito 4x',
    'Cartão Crédito 6x',
    'Cartão Crédito 10x',
    'Cartão Crédito 12x',
    'Boleto',
    'Convênio',
];

// Format currency
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
}

// Format date
export function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
        return dateStr;
    }
}

// Format relative time
export function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Nunca';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 30) return `${days}d atrás`;
    return formatDate(dateStr);
}

// Get status badge style
export function getStatusStyle(status) {
    return STATUS_CONFIG[status] || { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', label: status };
}

// Calculate metrics from clients
export function calcMetrics(clients) {
    const total = clients.length;
    const faturamento = clients.reduce((sum, c) => sum + (parseFloat(c.valorTotal) || 0), 0);
    const entregues = clients.filter(c => c.status === 'Entregue').length;
    const pendentes = clients.filter(c => c.status !== 'Entregue').length;
    const ticketMedio = total > 0 ? faturamento / total : 0;

    const byStatus = {};
    STATUS_ORDER.forEach(s => {
        byStatus[s] = clients.filter(c => c.status === s).length;
    });

    return { total, faturamento, entregues, pendentes, ticketMedio, byStatus };
}

// Filter clients by date range
export function filterByPeriod(clients, period) {
    if (period === 'all') return clients;
    const now = new Date();
    const days = { '30d': 30, '3m': 90, '6m': 180, '1y': 365 }[period] || 30;
    const cutoff = new Date(now - days * 86400000);
    return clients.filter(c => new Date(c.createdAt) >= cutoff);
}

// Group clients by month for charts
export function groupByMonth(clients) {
    const months = {};
    clients.forEach(c => {
        const d = new Date(c.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        if (!months[key]) months[key] = { key, label, atendimentos: 0, faturamento: 0 };
        months[key].atendimentos += 1;
        months[key].faturamento += parseFloat(c.valorTotal) || 0;
    });
    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
}

// Count lens types
export function countLensTypes(clients) {
    const counts = {};
    clients.forEach(c => {
        const tipo = c.tipoLente || 'Não informado';
        counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}
