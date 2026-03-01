import { supabase } from '../lib/supabase';

export const clientService = {
    // Fetch clients for a unit
    async getClients(unitId, filters = {}) {
        let query = supabase.from('clients').select('*').eq('unit_id', unitId);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.name) query = query.or(`name.ilike.%${filters.name}%,phone.ilike.%${filters.name}%`);
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

    // Create new client — field names match the DB exactly
    async createClient(unitId, formData) {
        const num = v => (v === '' || v === undefined || v === null) ? null : Number(v);

        const payload = {
            unit_id: unitId,
            // Identification — DB field is "name", NOT "client_name"
            name: formData.name || formData.client_name || '',
            cpf: formData.cpf || null,
            rg: formData.rg || null,
            birth_date: formData.birth_date || null,
            gender: formData.gender || null,
            // Prescription OD
            od_esf: num(formData.od_esf),
            od_cil: num(formData.od_cil),
            od_eixo: num(formData.od_eixo),
            od_dnp: num(formData.od_dnp),
            od_add: num(formData.od_add),
            // Prescription OE
            oe_esf: num(formData.oe_esf),
            oe_cil: num(formData.oe_cil),
            oe_eixo: num(formData.oe_eixo),
            oe_dnp: num(formData.oe_dnp),
            oe_add: num(formData.oe_add),
            doctor_name: formData.doctor_name || null,
            exam_date: formData.exam_date || null,
            // Contact
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            city: formData.city || null,
            zip_code: formData.zip_code || null,
            // Payment
            total_value: num(formData.total_value),
            paid_value: num(formData.paid_value),
            payment_method: formData.payment_method || null,
            installments: num(formData.installments) || 1,
            // Product
            frame_brand: formData.frame_brand || null,
            frame_model: formData.frame_model || null,
            frame_color: formData.frame_color || null,
            lens_type: formData.lens_type || null,
            lens_material: formData.lens_material || null,
            lab: formData.lab || null,
            // Status + Notes
            status: formData.status || 'Novo',
            notes: formData.notes || null,
        };

        const { data, error } = await supabase.from('clients').insert([payload]).select().single();
        if (error) { console.error('createClient:', error); return { success: false, error: error.message }; }

        // Initial status history entry
        await supabase.from('status_history').insert([{
            client_id: data.id, unit_id: unitId,
            new_status: payload.status, note: 'Cadastro inicial',
        }]);

        return { success: true, data };
    },

    // Update client — same exact field names as DB
    async updateClient(id, formData) {
        const num = v => (v === '' || v === undefined || v === null) ? null : Number(v);

        const payload = {
            name: formData.name || formData.client_name || '',
            cpf: formData.cpf || null, rg: formData.rg || null,
            birth_date: formData.birth_date || null, gender: formData.gender || null,
            od_esf: num(formData.od_esf), od_cil: num(formData.od_cil), od_eixo: num(formData.od_eixo),
            od_dnp: num(formData.od_dnp), od_add: num(formData.od_add),
            oe_esf: num(formData.oe_esf), oe_cil: num(formData.oe_cil), oe_eixo: num(formData.oe_eixo),
            oe_dnp: num(formData.oe_dnp), oe_add: num(formData.oe_add),
            doctor_name: formData.doctor_name || null, exam_date: formData.exam_date || null,
            phone: formData.phone || null, email: formData.email || null,
            address: formData.address || null, city: formData.city || null,
            zip_code: formData.zip_code || null,
            total_value: num(formData.total_value), paid_value: num(formData.paid_value),
            payment_method: formData.payment_method || null,
            installments: num(formData.installments) || 1,
            frame_brand: formData.frame_brand || null, frame_model: formData.frame_model || null,
            frame_color: formData.frame_color || null, lens_type: formData.lens_type || null,
            lens_material: formData.lens_material || null, lab: formData.lab || null,
            status: formData.status || 'Novo', notes: formData.notes || null,
        };

        const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
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

    // Unit metrics — tries view first, falls back to raw aggregate
    async getUnitMetrics(unitId) {
        try {
            const { data, error } = await supabase.from('unit_summary').select('*').eq('id', unitId).single();
            if (!error && data) return {
                total: Number(data.total_clients) || 0,
                revenue: Number(data.total_revenue) || 0,
                pending: Number(data.status_production || 0) + Number(data.status_ready || 0) + Number(data.status_new || 0),
                delivered: Number(data.status_delivered) || 0,
            };
        } catch { /* fall through */ }
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
