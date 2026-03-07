import { supabase } from '../lib/supabase';

// Exact list of valid columns in the 'clients' table
const VALID_COLUMNS = [
    'name', 'client_name', 'cpf', 'rg', 'birth_date', 'gender',
    'phone', 'email', 'address', 'city', 'zip_code',
    'od_esf', 'od_cil', 'od_eixo', 'od_dnp', 'od_add',
    'oe_esf', 'oe_cil', 'oe_eixo', 'oe_dnp', 'oe_add',
    'doctor_name', 'exam_date',
    'frame_brand', 'frame_model', 'frame_color',
    'lens_type', 'lens_material',
    'total_value', 'paid_value', 'payment_method', 'installments',
    'notes', 'unit_id', 'status',

    // AI / Follow-up
    'status_ia', 'etapa_fluxo', 'status_followup', 'encerrado_followup', 'telefone_cliente', 'ultima_interacao', 'ultima_mensagem',

    // CRM Phase 3: Identificação & Receita Additions
    'tso', 'hp', 'laboratorio', 'medico',
    'prescricao_od', 'prescricao_oe', 'adicao', 'tipo_lente', 'material_lente', 'tom_lente', 'info_armacao',

    // CRM Phase 3: Pagamento & Cadastro
    'boleto_vencimento', 'data_pagamento', 'data_expedicao'
];

function formatDatePG(val) {
    if (!val || typeof val !== 'string') return val || null;
    let s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s; // already YYYY-MM-DD or ISO
    if (s.includes('T') && s.includes('Z')) return s; // already ISO string

    // Check Brazilian format DD/MM/YY or DD/MM/YYYY
    const parts = s.split('/');
    if (parts.length === 3) {
        let d = parts[0].padStart(2, '0');
        let m = parts[1].padStart(2, '0');
        let y = parts[2].split(' ')[0]; // safely ignore time if "DD/MM/YYYY HH:mm"

        if (y.length === 2) {
            const yNum = parseInt(y, 10);
            y = (yNum > 50 ? '19' : '20') + y;
        }
        return `${y}-${m}-${d}`;
    }
    return s;
}

function buildPayload(formData, unitId) {
    const num = v => (v === '' || v === undefined || v === null) ? null : Number(v);

    const raw = {
        unit_id: unitId,
        name: formData.name || formData.client_name || '',
        cpf: formData.cpf || null, rg: formData.rg || null,
        birth_date: formatDatePG(formData.birth_date), gender: formData.gender || null,
        od_esf: num(formData.od_esf), od_cil: num(formData.od_cil), od_eixo: num(formData.od_eixo),
        od_dnp: num(formData.od_dnp), od_add: num(formData.od_add),
        oe_esf: num(formData.oe_esf), oe_cil: num(formData.oe_cil), oe_eixo: num(formData.oe_eixo),
        oe_dnp: num(formData.oe_dnp), oe_add: num(formData.oe_add),
        doctor_name: formData.doctor_name || null, exam_date: formatDatePG(formData.exam_date),
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

        // Phase 3 CRM Mappings
        tso: formData.tso || null,
        hp: formData.hp || null,
        laboratorio: formData.laboratorio || null,
        medico: formData.medico || null,
        prescricao_od: JSON.stringify({
            bib_esf: formData.bib_od_esf || '',
            bib_cil: formData.bib_od_cil || '',
            bib_eixo: formData.bib_od_eixo || ''
        }),
        prescricao_oe: JSON.stringify({
            bib_esf: formData.bib_oe_esf || '',
            bib_cil: formData.bib_oe_cil || '',
            bib_eixo: formData.bib_oe_eixo || ''
        }),
        adicao: formData.adicao || null,
        tipo_lente: formData.tipo_lente || null,
        material_lente: formData.material_lente || null,
        tom_lente: formData.tom_lente || null,
        info_armacao: formData.info_armacao || null,

        boleto_vencimento: formatDatePG(formData.boleto_vencimento),
        data_pagamento: formatDatePG(formData.data_pagamento),
        data_expedicao: formatDatePG(formData.data_expedicao)
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

    async bulkImportClients(unitId, parsedDataArray) {
        // Parse CSV objects to our Schema format
        const validStatuses = ['Novo', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];

        const toInsert = parsedDataArray.map(row => {
            const rawStatus = row.status || row.Status || row.STATUS || '';
            const status = validStatuses.includes(rawStatus) ? rawStatus : 'Novo';

            return {
                unit_id: unitId,
                status: status,
                tso: row.tso || null,
                name: row.nome_completo || row.name || row.nome || '',
                phone: row.telefone || row.phone || null,
                cpf: row.cpf || null,
                email: row.email || null,
                laboratorio: row.laboratorio || null,
                medico: row.medico || null,
                hp: row.hp || null,

                od_esf: row.od_esf ? Number(row.od_esf.replace(',', '.')) : null,
                od_cil: row.od_cil ? Number(row.od_cil.replace(',', '.')) : null,
                od_eixo: row.od_eixo ? Number(row.od_eixo) : null,
                oe_esf: row.oe_esf ? Number(row.oe_esf.replace(',', '.')) : null,
                oe_cil: row.oe_cil ? Number(row.oe_cil.replace(',', '.')) : null,
                oe_eixo: row.oe_eixo ? Number(row.oe_eixo) : null,

                prescricao_od: JSON.stringify({
                    bib_esf: row.od_esf_2 || '',
                    bib_cil: row.od_cil_2 || '',
                    bib_eixo: row.od_eixo_2 || ''
                }),
                prescricao_oe: JSON.stringify({
                    bib_esf: row.oe_esf_2 || '',
                    bib_cil: row.oe_cil_2 || '',
                    bib_eixo: row.oe_eixo_2 || ''
                }),

                adicao: row.adicao || null,
                tipo_lente: row.tipo_lente || row.lens_type || null,
                material_lente: row.material_lente || row.lens_material || null,
                tom_lente: row.tom_lente || null,
                info_armacao: row.informacoes_armacao || row.info_armacao || null,
                notes: row.observacoes || row.notes || null,

                birth_date: formatDatePG(row.data_nascimento),
                city: row.cidade || null,
                address: row.endereco || null,
                payment_method: row.condicoes_pagamento || null,
                total_value: row.valor_total ? Number(String(row.valor_total).replace(',', '.')) : null,
                boleto_vencimento: formatDatePG(row.boleto || row.boleto_vencimento),
                data_expedicao: formatDatePG(row.data_expedicao),

                // Dates from CSV (if any)
                created_at: row.created_at ? (formatDatePG(row.created_at).includes('T') ? row.created_at : `${formatDatePG(row.created_at)}T12:00:00Z`) : new Date().toISOString()
            };
        }).filter(c => c.name.trim() !== ''); // Skip empty rows

        if (toInsert.length === 0) return { success: false, error: 'Nenhum dado válido encontrado' };

        // Supabase has a limit per insert, so we chunk it just in case if there's thousands
        const chunkSize = 1000;
        let totalInserted = 0;

        try {
            for (let i = 0; i < toInsert.length; i += chunkSize) {
                const chunk = toInsert.slice(i, i + chunkSize);
                const { error } = await supabase.from('clients').insert(chunk);
                if (error) throw error;
                totalInserted += chunk.length;
            }
            return { success: true, count: totalInserted };
        } catch (error) {
            console.error('bulkImportClients:', error);
            return { success: false, error: error.message };
        }
    }
};
