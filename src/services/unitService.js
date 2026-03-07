import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const unitService = {
    // Master listing — fetch units directly, then aggregate client data
    async getAllUnits() {
        const { data: units, error } = await supabase
            .from('units')
            .select('*')
            .order('name');

        if (error) {
            console.error('ERRO getAllUnits (units):', error);
            return [];
        }
        return units;
    },

    // Get unit summaries with client aggregation (for master dashboard)
    async getUnitSummaries() {
        // First try the view
        const { data, error } = await supabase
            .from('unit_summary')
            .select('*')
            .order('name');

        if (!error && data) return data;

        console.error('ERRO unit_summary view:', error);

        // Fallback: fetch units + clients separately
        const { data: units, error: uErr } = await supabase.from('units').select('*').order('name');
        if (uErr) { console.error('ERRO fallback units:', uErr); return []; }

        const { data: clients, error: cErr } = await supabase.from('clients').select('id, unit_id, total_value, paid_value, status');
        if (cErr) console.error('ERRO fallback clients:', cErr);

        return units.map(u => {
            const uc = (clients || []).filter(c => c.unit_id === u.id);
            return {
                ...u,
                total_clients: uc.length,
                total_revenue: uc.reduce((s, c) => s + Number(c.total_value || 0), 0),
                total_paid: uc.reduce((s, c) => s + Number(c.paid_value || 0), 0),
                status_new: uc.filter(c => c.status === 'Novo').length,
                status_production: uc.filter(c => c.status === 'Em Produção').length,
                status_ready: uc.filter(c => c.status === 'Pronto').length,
                status_delivered: uc.filter(c => c.status === 'Entregue').length,
                status_cancelled: uc.filter(c => c.status === 'Cancelado').length,
            };
        });
    },

    // Unit lookup for login routing
    async getUnitBySlug(slug) {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('ERRO getUnitBySlug:', error);
            return null;
        }
        return data;
    },

    // Create new unit — full flow: unit row + auth user + profile
    // Rolls back any created resources if a step fails.
    async createUnit({ name, slug, email, password, city, state, active, onStep }) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

        // Create a service-role client for admin operations
        // The regular anon/authenticated client doesn't have enough permissions
        const adminSupabase = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        let createdUnitId = null;
        let createdAuthUid = null;

        // ── Step 1: Insert unit row ───────────────────────────────────────────
        if (onStep) onStep('Criando unidade...');
        const { data: unitData, error: unitError } = await adminSupabase
            .from('units')
            .insert([{ name, slug, email, city, state, active }])
            .select()
            .single();

        if (unitError) {
            console.error('ERRO createUnit (units):', unitError);
            return { success: false, error: unitError.message };
        }
        createdUnitId = unitData.id;

        // ── Step 2: Create auth user via Admin API (requires service_role key) ─
        if (onStep) onStep('Criando usuário de acesso...');
        const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ email, password, email_confirm: true }),
        });

        if (!authRes.ok) {
            const errBody = await authRes.text();
            console.error('ERRO createUnit (admin/users):', errBody);

            // Rollback: delete unit
            await adminSupabase.from('units').delete().eq('id', createdUnitId);
            return { success: false, error: `Falha ao criar usuário de acesso: ${errBody}` };
        }

        const authData = await authRes.json();
        createdAuthUid = authData?.id;

        if (!createdAuthUid) {
            // Unexpected: no user id returned
            await adminSupabase.from('units').delete().eq('id', createdUnitId);
            return { success: false, error: 'Usuário criado mas sem ID retornado pela API.' };
        }

        // ── Step 3: Insert profile linking user → unit ────────────────────────
        if (onStep) onStep('Vinculando perfil...');
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .update({ role: 'unit', unit_id: createdUnitId })
            .eq('id', createdAuthUid);

        if (profileError) {
            console.error('ERRO createUnit (profiles):', profileError);

            // Rollback: delete auth user then unit
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${createdAuthUid}`, {
                method: 'DELETE',
                headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                },
            });
            await adminSupabase.from('units').delete().eq('id', createdUnitId);
            return { success: false, error: `Unidade e usuário criados, mas falha ao vincular perfil: ${profileError.message}` };
        }

        if (onStep) onStep('Criando tabelas do n8n...');
        const { error: rpcError } = await adminSupabase.rpc('create_unit_n8n_tables', {
            p_slug: slug.replace(/-/g, '_')
        });

        if (rpcError) {
            console.error('ERRO createUnit (rpc n8n tables):', rpcError);
            // Non-fatal error for the unit creation itself, but log it
        }

        if (onStep) onStep('Concluído!');
        return { success: true, data: unitData };
    },


    // Edit Unit Password (Master only)
    async updateUnitPassword(unitId, newPassword) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

        // 1. Find the Auth User ID associated with this unit
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('unit_id', unitId)
            .single();

        if (error || !profile?.id) {
            console.error('ERRO updateUnitPassword (profile not found):', error);
            return { success: false, error: 'Perfil de acesso desta unidade não localizado.' };
        }

        const authUid = profile.id;

        // 2. Use Admin API to update the password
        const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ password: newPassword }),
        });

        if (!authRes.ok) {
            const errBody = await authRes.text();
            console.error('ERRO updateUnitPassword (admin/users):', errBody);
            return { success: false, error: 'Falha ao redefinir a senha via API.' };
        }

        return { success: true };
    },

    // Toggle active/inactive
    async toggleUnitActive(id, currentActive) {
        const { error } = await supabase
            .from('units')
            .update({ active: !currentActive })
            .eq('id', id);

        if (error) {
            console.error('ERRO toggleUnitActive:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    // Update unit fields
    async updateUnit(id, fields) {
        const { data, error } = await supabase
            .from('units')
            .update(fields)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('ERRO updateUnit:', error);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    },

    // Delete unit (cascades to profiles, clients, etc via FK)
    async deleteUnit(id) {
        const { error } = await supabase
            .from('units')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('ERRO deleteUnit:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },


    // ---- NOTIFICATIONS ----
    async getNotifications(unitId) {
        const query = supabase.from('notifications').select('*');
        if (unitId) query.or(`unit_id.eq.${unitId},unit_id.is.null`);
        query.order('created_at', { ascending: false }).limit(20);

        const { data, error } = await query;
        if (error) {
            console.error('ERRO getNotifications:', error);
            return [];
        }
        return data;
    },

    async createNotification({ unitId, title, message, type = 'info' }) {
        const { error } = await supabase
            .from('notifications')
            .insert([{ unit_id: unitId === 'all' ? null : unitId, title, message, type }]);

        if (error) {
            console.error('ERRO createNotification:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    async markNotificationRead(id) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('ERRO markNotificationRead:', error);
            return { success: false };
        }
        return { success: true };
    }
};
