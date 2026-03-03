import { supabase } from '../lib/supabase';

// Helper to convert URL slug to table name convention
export const tableSlug = (slug) => {
    if (!slug) return '';
    return slug.replace(/-/g, '_');
};

export const unitTablesService = {
    // ------------------------------------------------------------------------
    // FOLLOW UP (Conversas & Follow-ups)
    // ------------------------------------------------------------------------

    async getConversas(slug, filters = {}) {
        const tableName = `followup_${tableSlug(slug)}`;
        try {
            let query = supabase.from(tableName).select('*').order('ultima_interacao', { ascending: false });

            if (filters.status_ia && filters.status_ia !== 'Todos') {
                query = query.eq('status_ia', filters.status_ia);
            }

            const { data, error } = await query;
            if (error) {
                // Table might not exist yet, return empty gracefully
                if (error.code === '42P01') return [];
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar conversas na tabela ${tableName}:`, error);
            throw new Error(`Falha ao buscar conversas: ${error.message}`);
        }
    },

    async getFollowUps(slug) {
        const tableName = `followup_${tableSlug(slug)}`;
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('etapa_fluxo', 'followup_enviado')
                .order('ultima_interacao', { ascending: true }); // Oldest first

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar follow-ups na tabela ${tableName}:`, error);
            throw new Error(`Falha ao buscar follow-ups: ${error.message}`);
        }
    },

    async updateStatusIA(slug, telefone, status_ia, etapa_fluxo) {
        const tableName = `followup_${tableSlug(slug)}`;
        try {
            const updateProps = { status_ia };
            if (etapa_fluxo) updateProps.etapa_fluxo = etapa_fluxo;

            const { error } = await supabase
                .from(tableName)
                .update(updateProps)
                .eq('telefone_cliente', telefone);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao atualizar IA na tabela ${tableName}:`, error);
            throw error;
        }
    },

    async reativarLead(slug, telefone) {
        const tableName = `followup_${tableSlug(slug)}`;
        try {
            const { error } = await supabase
                .from(tableName)
                .update({
                    status_ia: 'Ativo',
                    etapa_fluxo: 'inicio',
                    ultima_interacao: new Date().toISOString()
                })
                .eq('telefone_cliente', telefone);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao reativar lead na tabela ${tableName}:`, error);
            throw error;
        }
    },

    async assumirAtendimento(slug, lead) {
        const tSlug = tableSlug(slug);
        const followupTable = `followup_${tSlug}`;
        const atendimentoTable = `atendimento_humano_${tSlug}`;

        try {
            // 1. Update status
            const { error: updateError } = await supabase
                .from(followupTable)
                .update({ status_ia: 'AtendimentoHumano', ultima_interacao: new Date().toISOString() })
                .eq('telefone_cliente', lead.telefone_cliente);

            if (updateError) throw updateError;

            // 2. Insert into atendimento_humano
            // retoma_em is 4h from now
            const retoma_em = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
            const { error: insertError } = await supabase
                .from(atendimentoTable)
                .upsert({
                    nome_cliente: lead.nome_cliente,
                    telefone_cliente: lead.telefone_cliente,
                    retoma_em: retoma_em,
                    pausado_em: new Date().toISOString()
                }, { onConflict: 'telefone_cliente' });

            if (insertError) throw insertError;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao assumir atendimento:`, error);
            throw error;
        }
    },

    // ------------------------------------------------------------------------
    // AGENDAMENTOS
    // ------------------------------------------------------------------------

    async getAgendamentos(slug, filterType = 'TODOS') {
        const tableName = `agendamento_${tableSlug(slug)}`;
        try {
            let query = supabase.from(tableName).select('*').order('data_agendamento', { ascending: true }).order('hora', { ascending: true });

            const today = new Date().toISOString().split('T')[0];

            // Get Dates for current week
            const curr = new Date(); // get current date
            const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
            const last = first + 6; // last day is the first day + 6
            const firstday = new Date(curr.setDate(first)).toISOString().split('T')[0];
            const lastday = new Date(curr.setDate(last)).toISOString().split('T')[0];

            if (filterType === 'HOJE') {
                query = query.eq('data_agendamento', today);
            } else if (filterType === 'ESTA SEMANA') {
                query = query.gte('data_agendamento', firstday).lte('data_agendamento', lastday);
            } else if (filterType === 'PRÓXIMOS') {
                query = query.gte('data_agendamento', today);
            }

            const { data, error } = await query;
            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar agendamentos na tabela ${tableName}:`, error);
            throw new Error(`Falha ao buscar agendamentos: ${error.message}`);
        }
    },

    async createAgendamento(slug, data) {
        const tableName = `agendamento_${tableSlug(slug)}`;
        try {
            const { error } = await supabase.from(tableName).insert([data]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao criar agendamento na tabela ${tableName}:`, error);
            throw error;
        }
    },

    async updateAgendamento(slug, id, status) {
        const tableName = `agendamento_${tableSlug(slug)}`;
        try {
            const { error } = await supabase.from(tableName).update({ status }).eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao atualizar agendamento na tabela ${tableName}:`, error);
            throw error;
        }
    },

    // ------------------------------------------------------------------------
    // SIDEBAR COUNTS
    // ------------------------------------------------------------------------

    async getSidebarCounts(slug) {
        const tSlug = tableSlug(slug);

        const counts = {
            atendimentoHumano: 0,
            followUpEnviado: 0,
            agendamentosHoje: 0
        };

        if (!slug) return counts;

        try {
            // Count conversas
            const { count: countConversas } = await supabase
                .from(`followup_${tSlug}`)
                .select('*', { count: 'exact', head: true })
                .eq('status_ia', 'AtendimentoHumano');
            if (countConversas) counts.atendimentoHumano = countConversas;

            // Count follow ups
            const { count: countFollows } = await supabase
                .from(`followup_${tSlug}`)
                .select('*', { count: 'exact', head: true })
                .eq('etapa_fluxo', 'followup_enviado');
            if (countFollows) counts.followUpEnviado = countFollows;

            // Count agendamentos hoje
            const today = new Date().toISOString().split('T')[0];
            const { count: countAgenda } = await supabase
                .from(`agendamento_${tSlug}`)
                .select('*', { count: 'exact', head: true })
                .eq('data_agendamento', today);
            if (countAgenda) counts.agendamentosHoje = countAgenda;

        } catch (error) {
            // Ignore errors for counts (missing table, etc)
            console.log("Could not load sidebar counts:", error.message);
        }

        return counts;
    }
};
