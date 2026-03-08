import { supabase } from '../lib/supabase';

// Helper to convert URL slug to table name convention
export const tableSlug = (slug) => {
    if (!slug) return '';
    return slug.replace(/-/g, '_');
};

export const unitTablesService = {
    async _getUnitId(slug) {
        if (!slug) return null;
        const { data } = await supabase.from('units').select('id').eq('slug', slug).single();
        return data?.id;
    },

    // ------------------------------------------------------------------------
    // FOLLOW UP (Conversas & Follow-ups)
    // ------------------------------------------------------------------------

    async getConversas(slug, filters = {}) {
        try {
            const unitId = await this._getUnitId(slug);
            if (!unitId) return [];

            let query = supabase.from('clients')
                .select('*')
                .eq('unit_id', unitId)
                .not('status_ia', 'is', null) // Only show AI leads in Conversas
                .order('ultima_interacao', { ascending: false });

            if (filters.status_ia && filters.status_ia !== 'Todos') {
                query = query.eq('status_ia', filters.status_ia);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar conversas:`, error);
            throw new Error(`Falha ao buscar conversas: ${error.message}`);
        }
    },

    async getFollowUps(slug) {
        try {
            const unitId = await this._getUnitId(slug);
            if (!unitId) return [];

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('unit_id', unitId)
                .eq('etapa_fluxo', 'followup_enviado')
                .order('ultima_interacao', { ascending: true }); // Oldest first

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar follow-ups:`, error);
            throw new Error(`Falha ao buscar follow-ups: ${error.message}`);
        }
    },

    async updateStatusIA(slug, telefone, status_ia, etapa_fluxo) {
        try {
            const unitId = await this._getUnitId(slug);
            if (!unitId) return { success: false };

            const updateProps = { status_ia };
            if (etapa_fluxo) updateProps.etapa_fluxo = etapa_fluxo;

            const { error } = await supabase
                .from('clients')
                .update(updateProps)
                .eq('unit_id', unitId)
                .eq('telefone_cliente', telefone);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao atualizar IA:`, error);
            throw error;
        }
    },

    async reativarLead(slug, telefone) {
        try {
            const unitId = await this._getUnitId(slug);
            if (!unitId) return { success: false };

            const { error } = await supabase
                .from('clients')
                .update({
                    status_ia: 'Ativo',
                    etapa_fluxo: 'inicio',
                    ultima_interacao: new Date().toISOString()
                })
                .eq('unit_id', unitId)
                .eq('telefone_cliente', telefone);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Erro ao reativar lead:`, error);
            throw error;
        }
    },

    async assumirAtendimento(slug, lead) {
        try {
            const unitId = await this._getUnitId(slug);
            if (!unitId) return { success: false };

            // 1. Update status in clients table
            const { error: updateError } = await supabase
                .from('clients')
                .update({ status_ia: 'AtendimentoHumano', ultima_interacao: new Date().toISOString() })
                .eq('unit_id', unitId)
                .eq('telefone_cliente', lead.telefone_cliente);

            if (updateError) throw updateError;

            // Note: Since we unified tables, the atendimento_humano logic could natively exist just by using status_ia = AtendimentoHumano.
            // But leaving the legacy insert in case there's another dashboard observing it.
            const tSlug = tableSlug(slug);
            const atendimentoTable = `atendimento_humano_${tSlug}`;

            const retoma_em = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
            await supabase
                .from(atendimentoTable)
                .upsert({
                    nome_cliente: lead.name || lead.nome_cliente,
                    telefone_cliente: lead.telefone_cliente,
                    retoma_em: retoma_em,
                    pausado_em: new Date().toISOString()
                }, { onConflict: 'telefone_cliente' });

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
        const counts = {
            atendimentoHumano: 0,
            followUpEnviado: 0,
            agendamentosHoje: 0
        };

        if (!slug) return counts;

        try {
            const unitId = await this._getUnitId(slug);
            if (!unitId) return counts;

            // Count conversas
            const { count: countConversas } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('unit_id', unitId)
                .eq('status_ia', 'AtendimentoHumano');
            if (countConversas) counts.atendimentoHumano = countConversas;

            // Count follow ups
            const { count: countFollows } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('unit_id', unitId)
                .eq('etapa_fluxo', 'followup_enviado');
            if (countFollows) counts.followUpEnviado = countFollows;

            // Count agendamentos hoje
            const tSlug = tableSlug(slug);
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
    },

    // ------------------------------------------------------------------------
    // MONITOR DASHBOARD (Public AI Monitor)
    // ------------------------------------------------------------------------

    async getMonitorFollowups(slug) {
        const tableName = `followup_${tableSlug(slug)}`;
        try {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) {
                if (error.code === '42P01') return []; // table doesn't exist
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar followups monitor (${tableName}):`, error);
            return [];
        }
    },

    async getMonitorAgendamentosHoje(slug) {
        const tableName = `agendamento_${tableSlug(slug)}`;
        const today = new Date().toISOString().split('T')[0];
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .gte('data_agendamento', today)
                .lte('data_agendamento', today + 'T23:59:59');
            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error(`Erro ao buscar agendamentos monitor (${tableName}):`, error);
            return [];
        }
    }
};
