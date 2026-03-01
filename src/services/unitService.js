import { supabase } from '../lib/supabase';

export const unitService = {
    // Master listing — fetch units directly, then aggregate client data
    async getAllUnits() {
        const { data: units, error } = await supabase
            .from('units')
            .select('*')
            .order('name');

        if (error) {
            console.error('ERRO getAllUnits (units):', error);
            return [];
        }
        return units;
    },

    // Get unit summaries with client aggregation (for master dashboard)
    async getUnitSummaries() {
        // First try the view
        const { data, error } = await supabase
            .from('unit_summary')
            .select('*')
            .order('name');

        if (!error && data) return data;

        console.error('ERRO unit_summary view:', error);

        // Fallback: fetch units + clients separately
        const { data: units, error: uErr } = await supabase.from('units').select('*').order('name');
        if (uErr) { console.error('ERRO fallback units:', uErr); return []; }

        const { data: clients, error: cErr } = await supabase.from('clients').select('id, unit_id, total_value, paid_value, status');
        if (cErr) console.error('ERRO fallback clients:', cErr);

        return units.map(u => {
            const uc = (clients || []).filter(c => c.unit_id === u.id);
            return {
                ...u,
                total_clients: uc.length,
                total_revenue: uc.reduce((s, c) => s + Number(c.total_value || 0), 0),
                total_paid: uc.reduce((s, c) => s + Number(c.paid_value || 0), 0),
                status_new: uc.filter(c => c.status === 'Novo').length,
                status_production: uc.filter(c => c.status === 'Em Produção').length,
                status_ready: uc.filter(c => c.status === 'Pronto').length,
                status_delivered: uc.filter(c => c.status === 'Entregue').length,
                status_cancelled: uc.filter(c => c.status === 'Cancelado').length,
            };
        });
    },

    // Unit lookup for login routing
    async getUnitBySlug(slug) {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('ERRO getUnitBySlug:', error);
            return null;
        }
        return data;
    },

    // Create new unit
    async createUnit(unitData) {
        const { data, error } = await supabase
            .from('units')
            .insert([unitData])
            .select()
            .single();

        if (error) {
            console.error('ERRO createUnit:', error);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    },

    // Toggle active/inactive
    async toggleUnitActive(id, currentActive) {
        const { error } = await supabase
            .from('units')
            .update({ active: !currentActive })
            .eq('id', id);

        if (error) {
            console.error('ERRO toggleUnitActive:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    // ---- NOTIFICATIONS ----
    async getNotifications(unitId) {
        const query = supabase.from('notifications').select('*');
        if (unitId) query.or(`unit_id.eq.${unitId},unit_id.is.null`);
        query.order('created_at', { ascending: false }).limit(20);

        const { data, error } = await query;
        if (error) {
            console.error('ERRO getNotifications:', error);
            return [];
        }
        return data;
    },

    async createNotification({ unitId, title, message, type = 'info' }) {
        const { error } = await supabase
            .from('notifications')
            .insert([{ unit_id: unitId === 'all' ? null : unitId, title, message, type }]);

        if (error) {
            console.error('ERRO createNotification:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    async markNotificationRead(id) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('ERRO markNotificationRead:', error);
            return { success: false };
        }
        return { success: true };
    }
};
