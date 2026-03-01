import { supabase } from '../lib/supabase';

export const goalService = {
    async getGoal(unitId, month) {
        const { data } = await supabase.from('unit_goals').select('*')
            .eq('unit_id', unitId).eq('month', month).single();
        return data;
    },

    async getGoals(unitId, months = 6) {
        const dates = [];
        const now = new Date();
        for (let i = 0; i < months; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            dates.push(d.toISOString().split('T')[0]);
        }
        const { data } = await supabase.from('unit_goals').select('*')
            .eq('unit_id', unitId).in('month', dates).order('month', { ascending: true });
        return data || [];
    },

    async upsertGoal(unitId, month, revenueGoal, clientsGoal = null) {
        const { data, error } = await supabase.from('unit_goals').upsert([{
            unit_id: unitId, month, revenue_goal: revenueGoal, clients_goal: clientsGoal,
        }], { onConflict: 'unit_id,month' }).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async getAllGoals(month) {
        const { data } = await supabase.from('unit_goals').select('*, units(name, slug)')
            .eq('month', month).order('revenue_goal', { ascending: false });
        return data || [];
    },
};
