import { supabase } from '../lib/supabase';

export const clientService = {
    // Fetch clients for a unit
    async getClients(unitId, filters = {}) {
        let query = supabase.from('clients').select('*').eq('unit_id', unitId);

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.name) query = query.ilike('name', `%${filters.name}%`);

        // Sort by created_at DESC
        query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching clients:', error);
            return [];
        }
        return data;
    },

    // Get full client details with status history
    async getClientById(id) {
        const { data, error } = await supabase
            .from('clients')
            .select('*, status_history(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching client details:', error);
            return null;
        }

        // Sort history oldest to newest usually for timeline display
        if (data.status_history) {
            data.status_history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return data;
    },

    // Create new client
    async createClient(unitId, clientData) {
        const { data, error } = await supabase
            .from('clients')
            .insert([{ ...clientData, unit_id: unitId }])
            .select()
            .single();

        if (error) {
            console.error('Error creating client:', error);
            return { success: false, error: error.message };
        }

        // Insert first history record
        await supabase.from('status_history').insert([{
            client_id: data.id,
            unit_id: unitId,
            new_status: clientData.status || 'Novo',
            note: 'Cadastro inicial'
        }]);

        return { success: true, data };
    },

    // Update simple fields
    async updateClient(id, updates) {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating client:', error);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    },

    // Change status and register history
    async updateClientStatus(client, newStatus, note, userId) {
        // 1. Update status on client
        const { data, error } = await supabase
            .from('clients')
            .update({ status: newStatus })
            .eq('id', client.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating client status:', error);
            return { success: false, error: error.message };
        }

        // 2. Add to history
        await supabase.from('status_history').insert([{
            client_id: client.id,
            unit_id: client.unit_id,
            old_status: client.status,
            new_status: newStatus,
            note,
            changed_by: userId
        }]);

        return { success: true, data };
    },

    // Delete client
    async deleteClient(id) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
            console.error('Error deleting client:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    // Get aggregated metrics directly from DB
    async getUnitMetrics(unitId) {
        const { data, error } = await supabase
            .from('unit_summary')
            .select('*')
            .eq('id', unitId)
            .single();

        if (error) {
            console.error('Error fetching unit metrics:', error);
            return null;
        }
        return data;
    }
};
