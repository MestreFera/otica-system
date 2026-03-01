import { supabase } from '../lib/supabase';

export const clientService = {
    // Fetch clients for a unit (support name/phone search + status filter)
    async getClients(unitId, filters = {}) {
        let query = supabase.from('clients').select('*').eq('unit_id', unitId);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.name) query = query.or(`client_name.ilike.%${filters.name}%,phone.ilike.%${filters.name}%`);
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) { console.error('getClients:', error); return []; }
        return data || [];
    },

    // Get full client details with status history
    async getClientById(id) {
        const { data, error } = await supabase
            .from('clients')
            .select('*, status_history(*)')
            .eq('id', id)
            .single();
        if (error) { console.error('getClientById:', error); return null; }
        if (data?.status_history) {
            data.status_history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return data;
    },

    // Create new client — accepts flat object with unit_id already set
    async createClient(unitId, clientData) {
        // Sanitise numeric fields — empty string → null
        const num = v => v === '' || v === undefined || v === null ? null : Number(v);
        const payload = {
            ...clientData,
            unit_id: unitId,
            od_esf: num(clientData.od_esf), od_cil: num(clientData.od_cil), od_eixo: num(clientData.od_eixo),
            od_dnp: num(clientData.od_dnp), od_add: num(clientData.od_add),
            oe_esf: num(clientData.oe_esf), oe_cil: num(clientData.oe_cil), oe_eixo: num(clientData.oe_eixo),
            oe_dnp: num(clientData.oe_dnp), oe_add: num(clientData.oe_add),
            total_value: num(clientData.total_value),
            paid_value: num(clientData.paid_value),
            installments: num(clientData.installments) || 1,
            // Sync name → client_name
            name: clientData.client_name || clientData.name || '',
            client_name: clientData.client_name || clientData.name || '',
        };

        const { data, error } = await supabase
            .from('clients')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('createClient:', error);
            return { success: false, error: error.message };
        }

        // Insert initial status history
        await supabase.from('status_history').insert([{
            client_id: data.id,
            unit_id: unitId,
            new_status: payload.status || 'Novo',
            note: 'Cadastro inicial',
        }]);

        return { success: true, data };
    },

    // Update client fields
    async updateClient(id, updates) {
        const num = v => v === '' || v === undefined || v === null ? null : Number(v);
        const payload = {
            ...updates,
            od_esf: num(updates.od_esf), od_cil: num(updates.od_cil), od_eixo: num(updates.od_eixo),
            od_dnp: num(updates.od_dnp), od_add: num(updates.od_add),
            oe_esf: num(updates.oe_esf), oe_cil: num(updates.oe_cil), oe_eixo: num(updates.oe_eixo),
            oe_dnp: num(updates.oe_dnp), oe_add: num(updates.oe_add),
            total_value: num(updates.total_value),
            paid_value: num(updates.paid_value),
            installments: num(updates.installments) || 1,
            name: updates.client_name || updates.name || '',
            client_name: updates.client_name || updates.name || '',
        };
        const { data, error } = await supabase
            .from('clients').update(payload).eq('id', id).select().single();
        if (error) { console.error('updateClient:', error); return { success: false, error: error.message }; }
        return { success: true, data };
    },

    // Change status and log history
    async updateClientStatus(client, newStatus, note, userId) {
        const { data, error } = await supabase
            .from('clients').update({ status: newStatus }).eq('id', client.id).select().single();
        if (error) { console.error('updateClientStatus:', error); return { success: false, error: error.message }; }

        await supabase.from('status_history').insert([{
            client_id: client.id, unit_id: client.unit_id,
            old_status: client.status, new_status: newStatus,
            note, changed_by: userId,
        }]);
        return { success: true, data };
    },

    // Delete client
    async deleteClient(id) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) { console.error('deleteClient:', error); return { success: false, error: error.message }; }
        return { success: true };
    },

    // Unit metrics via view or fallback
    async getUnitMetrics(unitId) {
        try {
            const { data, error } = await supabase.from('unit_summary').select('*').eq('id', unitId).single();
            if (!error && data) return {
                total: Number(data.total_clients) || 0,
                revenue: Number(data.total_revenue) || 0,
                pending: Number(data.status_production) + Number(data.status_ready) + Number(data.status_new) || 0,
                delivered: Number(data.status_delivered) || 0,
            };
        } catch { /* fall through */ }

        // Fallback: manual aggregate
        const { data: clients } = await supabase.from('clients').select('status, total_value').eq('unit_id', unitId);
        if (!clients) return { total: 0, revenue: 0, pending: 0, delivered: 0 };
        return {
            total: clients.length,
            revenue: clients.reduce((s, c) => s + Number(c.total_value || 0), 0),
            pending: clients.filter(c => ['Novo', 'Em Produção', 'Pronto'].includes(c.status)).length,
            delivered: clients.filter(c => c.status === 'Entregue').length,
        };
    },
};
