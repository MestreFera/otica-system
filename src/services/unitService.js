import { supabase } from '../lib/supabase';

export const unitService = {
    // Master listing units via summary view
    async getAllUnits() {
        const { data, error } = await supabase
            .from('unit_summary')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching units:', error);
            return [];
        }
        return data;
    },

    // Unit lookup for login routing
    async getUnitBySlug(slug) {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            // Not necessarily an error if not found, it just returns null
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
            console.error('Error creating unit:', error);
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
            console.error('Error toggling unit status:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    // ---- NOTIFICATIONS ----

    // Fetch notifications that belong to this unit OR are global (null unit_id)
    async getNotifications(unitId) {
        const query = supabase.from('notifications').select('*');

        if (unitId) {
            query.or(`unit_id.eq.${unitId},unit_id.is.null`);
        }

        query.order('created_at', { ascending: false }).limit(20);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data;
    },

    // Create a new notification (master panel mostly)
    async createNotification({ unitId, title, message, type = 'info' }) {
        const { error } = await supabase
            .from('notifications')
            .insert([{ unit_id: unitId === 'all' ? null : unitId, title, message, type }]);

        if (error) {
            console.error('Error sending notification:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    // Mark notification read
    async markNotificationRead(id) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification read:', error);
            return { success: false };
        }
        return { success: true };
    }
};
