import { supabase } from '../lib/supabase';

export const whatsappConfigService = {
    async getConfig(unitId) {
        if (!unitId) return null;
        const { data, error } = await supabase
            .from('unit_integrations')
            .select('*')
            .eq('unit_id', unitId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('ERRO getConfig:', error);
            return null;
        }
        return data; // returns null if not found
    },

    async upsertConfig(unitId, payload) {
        if (!unitId) return { success: false, error: 'Unidade não informada.' };

        // Check if config exists
        const existing = await this.getConfig(unitId);

        if (existing) {
            // Update
            const { data, error } = await supabase
                .from('unit_integrations')
                .update(payload)
                .eq('unit_id', unitId)
                .select()
                .single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } else {
            // Insert
            const { data, error } = await supabase
                .from('unit_integrations')
                .insert([{ ...payload, unit_id: unitId }])
                .select()
                .single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        }
    }
};
