import { supabase } from '../lib/supabase';

export const aiAgentService = {
    async getSettings(unitId) {
        if (!unitId) return null;
        const { data, error } = await supabase
            .from('unit_ai_settings')
            .select('*')
            .eq('unit_id', unitId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('ERRO getSettings:', error);
            return null;
        }
        return data;
    },

    async upsertSettings(unitId, payload) {
        if (!unitId) return { success: false, error: 'Unidade não informada.' };

        const existing = await this.getSettings(unitId);

        if (existing) {
            const { data, error } = await supabase
                .from('unit_ai_settings')
                .update(payload)
                .eq('unit_id', unitId)
                .select()
                .single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } else {
            const { data, error } = await supabase
                .from('unit_ai_settings')
                .insert([{ ...payload, unit_id: unitId }])
                .select()
                .single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        }
    }
};
