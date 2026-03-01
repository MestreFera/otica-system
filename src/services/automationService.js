import { supabase } from '../lib/supabase';

export const automationService = {
    async getAll(unitId = null) {
        let q = supabase.from('automations').select('*, units(name, slug)').order('created_at', { ascending: false });
        if (unitId) q = q.eq('unit_id', unitId);
        const { data, error } = await q;
        if (error) console.error('ERRO automations.getAll:', error);
        return data || [];
    },

    async getById(id) {
        const { data, error } = await supabase.from('automations').select('*').eq('id', id).single();
        if (error) console.error('ERRO automations.getById:', error);
        return data;
    },

    async create(automation) {
        const { data, error } = await supabase.from('automations').insert([automation]).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async update(id, updates) {
        const { data, error } = await supabase.from('automations').update(updates).eq('id', id).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    async toggle(id, currentActive) {
        return this.update(id, { active: !currentActive });
    },

    async delete(id) {
        const { error } = await supabase.from('automations').delete().eq('id', id);
        return { success: !error, error: error?.message };
    },

    // Logs
    async getLogs(filters = {}, page = 0, perPage = 20) {
        let q = supabase.from('automation_logs').select('*, automations(name, units(name))', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * perPage, (page + 1) * perPage - 1);
        if (filters.unitId) q = q.eq('unit_id', filters.unitId);
        if (filters.automationId) q = q.eq('automation_id', filters.automationId);
        if (filters.status) q = q.eq('status', filters.status);
        const { data, count, error } = await q;
        if (error) console.error('ERRO automation_logs.getLogs:', error);
        return { data: data || [], total: count || 0 };
    },

    async getRecentLogs(limit = 10) {
        const { data, error } = await supabase.from('automation_logs')
            .select('*, automations(name, units(name))')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) console.error('ERRO automation_logs.getRecentLogs:', error);
        return data || [];
    },

    // Execute automation (webhook or internal)
    async execute(automation, clientData = {}) {
        const startTime = Date.now();
        const payload = this.buildPayload(automation.message_template, clientData);

        const logEntry = {
            automation_id: automation.id,
            unit_id: automation.unit_id,
            client_id: clientData.id || null,
            client_name: clientData.client_name || clientData.name || '',
            trigger_event: automation.trigger_event,
            payload,
            status: 'pending',
        };

        if (automation.action_type === 'webhook' && automation.webhook_url) {
            try {
                const headers = { 'Content-Type': 'application/json', ...(automation.webhook_headers || {}) };
                const res = await fetch(automation.webhook_url, {
                    method: automation.webhook_method || 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000),
                });
                logEntry.response_status = res.status;
                logEntry.response_body = (await res.text()).slice(0, 2000);
                logEntry.status = res.ok ? 'success' : 'error';
            } catch (err) {
                logEntry.status = 'error';
                logEntry.response_body = err.message;
            }
        } else {
            // Internal notification
            await supabase.from('notifications').insert([{
                unit_id: automation.unit_id,
                title: automation.name,
                message: typeof payload === 'object' ? JSON.stringify(payload) : String(payload),
                type: 'info',
            }]);
            logEntry.status = 'success';
        }

        logEntry.duration_ms = Date.now() - startTime;
        await supabase.from('automation_logs').insert([logEntry]);

        // Update counters
        const updates = {
            runs_count: (automation.runs_count || 0) + 1,
            last_run_at: new Date().toISOString(),
        };
        if (logEntry.status === 'success') updates.success_count = (automation.success_count || 0) + 1;
        else updates.error_count = (automation.error_count || 0) + 1;
        await supabase.from('automations').update(updates).eq('id', automation.id);

        return logEntry;
    },

    buildPayload(template, data) {
        if (!template) return data;
        try {
            let str = template;
            const vars = {
                '{{cliente_nome}}': data.client_name || data.name || '',
                '{{cliente_telefone}}': data.phone || '',
                '{{cliente_email}}': data.email || '',
                '{{status}}': data.status || '',
                '{{unidade}}': data.unit_name || '',
                '{{valor_total}}': data.total_value || '0',
                '{{valor_pendente}}': String(Number(data.total_value || 0) - Number(data.paid_value || 0)),
                '{{data}}': new Date().toLocaleDateString('pt-BR'),
            };
            Object.entries(vars).forEach(([k, v]) => { str = str.replaceAll(k, v); });
            try { return JSON.parse(str); } catch { return str; }
        } catch { return data; }
    },

    TEMPLATES: {
        pedido_pronto: { name: 'Aviso de Pedido Pronto', trigger_event: 'status_pronto', message_template: '{"message":"Olá {{cliente_nome}}, seu pedido na {{unidade}} está pronto para retirada!","phone":"{{cliente_telefone}}"}' },
        entrega: { name: 'Confirmação de Entrega', trigger_event: 'status_entregue', message_template: '{"message":"{{cliente_nome}}, obrigado por retirar seu pedido na {{unidade}}! Esperamos que goste.","phone":"{{cliente_telefone}}"}' },
        lembrete_pagamento: { name: 'Lembrete de Pagamento', trigger_event: 'payment_overdue', message_template: '{"message":"Olá {{cliente_nome}}, você tem um saldo pendente de R${{valor_pendente}} na {{unidade}}.","phone":"{{cliente_telefone}}"}' },
        boas_vindas: { name: 'Boas-vindas Novo Cliente', trigger_event: 'client_created', message_template: '{"message":"Bem-vindo(a) à {{unidade}}, {{cliente_nome}}! Seu pedido foi registrado com sucesso.","phone":"{{cliente_telefone}}"}' },
        followup: { name: 'Follow-up Pós-Entrega', trigger_event: 'status_entregue', message_template: '{"message":"Olá {{cliente_nome}}, tudo bem com seus óculos novos? A {{unidade}} está à disposição!","phone":"{{cliente_telefone}}","delay":"7d"}' },
        atraso: { name: 'Alerta de Atraso na Produção', trigger_event: 'days_in_production', message_template: '{"message":"Atenção: pedido de {{cliente_nome}} está há {{trigger_value}} dias em produção.","alert":true}' },
    },
};
