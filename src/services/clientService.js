import { supabase } from '../lib/supabase';

// Exact list of valid columns in the 'clients' table
const VALID_COLUMNS = [
    'name', 'cpf', 'rg', 'birth_date', 'gender',
    'phone', 'email', 'address', 'city', 'zip_code',
    'od_esf', 'od_cil', 'od_eixo', 'od_dnp', 'od_add',
    'oe_esf', 'oe_cil', 'oe_eixo', 'oe_dnp', 'oe_add',
    'doctor_name', 'exam_date',
    'frame_brand', 'frame_model', 'frame_color',
    'lens_type', 'lens_material',
    'total_value', 'paid_value', 'payment_method', 'installments',
    'notes', 'unit_id', 'status',
    'status_ia', 'etapa_fluxo', 'ultima_interacao', 'ultima_mensagem',
];

function buildPayload(formData, unitId) {
    const num = v => (v === '' || v === undefined || v === null) ? null : Number(v);

    const raw = {
        unit_id: unitId,
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
        frame_color: formData.frame_color || null,
        lens_type: formData.lens_type || null, lens_material: formData.lens_material || null,
        status: formData.status || 'Novo', notes: formData.notes || null,
    };

    // Strip any key NOT in the valid columns list
    const payload = {};
    for (const key of VALID_COLUMNS) {
        if (key in raw) payload[key] = raw[key];
    }

    console.log('[clientService] payload →', JSON.stringify(payload, null, 2));
    return payload;
}

export const clientService = {
    async getClients(unitId, filters = {}) {
        let query = supabase.from('clients').select('*').eq('unit_id', unitId);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.name) query = query.or(`name.ilike.%${filters.name}%,phone.ilike.%${filters.name}%`);
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) { console.error('getClients:', error); return []; }
        return data || [];
    },

    async getClientById(id) {
        const { data, error } = await supabase
            .from('clients').select('*, status_history(*)').eq('id', id).single();
        if (error) { console.error('getClientById:', error); return null; }
        if (data?.status_history) {
            data.status_history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return data;
    },

    async createClient(unitId, formData) {
        const payload = buildPayload(formData, unitId);

        const { data, error } = await supabase.from('clients').insert([payload]).select().single();
        if (error) { console.error('createClient:', error); return { success: false, error: error.message }; }

        await supabase.from('status_history').insert([{
            client_id: data.id, unit_id: unitId,
            new_status: payload.status, note: 'Cadastro inicial',
        }]);
        return { success: true, data };
    },

    async updateClient(id, formData) {
        // For updates we don't need unit_id in the payload
        const payload = buildPayload(formData, formData.unit_id);
        delete payload.unit_id; // don't overwrite FK

        const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
        if (error) { console.error('updateClient:', error); return { success: false, error: error.message }; }
        return { success: true, data };
    },

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

    async deleteClient(id) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) { console.error('deleteClient:', error); return { success: false, error: error.message }; }
        return { success: true };
    },

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
