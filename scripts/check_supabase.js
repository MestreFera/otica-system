import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking Supabase schema...');

    // 1. Check clients table schema (by selecting 1 row with all columns we expect)
    const columns = [
        'id', 'status_ia', 'etapa_fluxo', 'status_followup', 'encerrado_followup', 'telefone_cliente', 'ultima_interacao', 'ultima_mensagem',
        'tso', 'hp', 'laboratorio', 'medico', 'prescricao_od', 'prescricao_oe', 'adicao', 'tipo_lente', 'material_lente', 'tom_lente', 'info_armacao',
        'boleto_vencimento', 'data_pagamento', 'data_expedicao'
    ];

    const { data, error } = await supabase
        .from('clients')
        .select(columns.join(','))
        .limit(1);

    if (error) {
        console.error('Error fetching clients table with new columns:', error.message);
        if (error.code === 'PGRST204') {
            console.error('Some columns are missing from the clients table.');
        }
    } else {
        console.log('✓ Clients table has all expected new columns.');
    }

    // 2. Check automations table
    const { error: autoError } = await supabase.from('automations').select('id').limit(1);
    if (autoError) {
        console.error('Error fetching automations table:', autoError.message);
    } else {
        console.log('✓ Automations table exists.');
    }

    // 3. Check expected RPCs if any
    // ...

    // 4. Check client_automations or workflow connections?
    // Let's check status_history
    const { error: shError } = await supabase.from('status_history').select('id').limit(1);
    if (shError) {
        console.error('Error fetching status_history table:', shError.message);
    } else {
        console.log('✓ status_history table exists.');
    }

}

checkSchema();
