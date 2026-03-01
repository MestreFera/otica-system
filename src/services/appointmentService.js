import { supabase } from '../lib/supabase';

export const appointmentService = {
    async getByUnit(unitId, filters = {}) {
        let q = supabase.from('appointments').select('*').eq('unit_id', unitId).order('date', { ascending: true }).order('time', { ascending: true });
        if (filters.date) q = q.eq('date', filters.date);
        if (filters.dateFrom && filters.dateTo) q = q.gte('date', filters.dateFrom).lte('date', filters.dateTo);
        if (filters.status) q = q.eq('status', filters.status);
        const { data } = await q;
        return data || [];
    },

    async getById(id) {
        const { data } = await supabase.from('appointments').select('*').eq('id', id).single();
        return data;
    },

    async create(appointment) {
        const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async update(id, updates) {
        const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async delete(id) {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        return { success: !error };
    },

    async getTodayCount(unitId) {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('appointments').select('id').eq('unit_id', unitId).eq('date', today).not('status', 'in', '("Cancelado","Faltou")');
        return data?.length || 0;
    },

    async checkConflict(unitId, date, time, excludeId = null) {
        let q = supabase.from('appointments').select('id, client_name, time').eq('unit_id', unitId).eq('date', date).eq('time', time).not('status', 'in', '("Cancelado","Faltou")');
        if (excludeId) q = q.neq('id', excludeId);
        const { data } = await q;
        return data?.length > 0 ? data[0] : null;
    },

    async searchClients(unitId, query) {
        const { data } = await supabase.from('clients').select('id, name, client_name, phone')
            .eq('unit_id', unitId)
            .or(`name.ilike.%${query}%,client_name.ilike.%${query}%,phone.ilike.%${query}%`)
            .limit(10);
        return data || [];
    },
};
