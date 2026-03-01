import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.oilaemnobsdtaapbfess',
    password: '21*23+24B@n',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

const sql = `
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert on public.status_history to authenticated;
grant select, insert, update on public.notifications to authenticated;
grant select, insert, update, delete on public.automations to authenticated;
grant select, insert on public.automation_logs to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, insert, update, delete on public.unit_goals to authenticated;
grant select, insert, update, delete on public.unit_settings to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage on schema public to anon;
grant select on public.clients to anon;
grant select on public.units to anon;
grant select on public.unit_settings to anon;
`;

async function run() {
    try {
        await client.connect();
        console.log('Connected!');

        // Create unit_summary view if missing
        try {
            await client.query('select 1 from public.unit_summary limit 0');
            console.log('✓ unit_summary exists');
        } catch (e) {
            console.log('Creating unit_summary...');
            await client.query(`
        create or replace view public.unit_summary as
        select
          u.*,
          coalesce(count(c.id), 0)::int as total_clients,
          coalesce(sum(c.total_value), 0)::numeric as total_revenue,
          coalesce(sum(c.paid_value), 0)::numeric as total_paid,
          coalesce(sum(case when c.status='Novo' then 1 else 0 end), 0)::int as status_new,
          coalesce(sum(case when c.status='Em Produção' then 1 else 0 end), 0)::int as status_production,
          coalesce(sum(case when c.status='Pronto' then 1 else 0 end), 0)::int as status_ready,
          coalesce(sum(case when c.status='Entregue' then 1 else 0 end), 0)::int as status_delivered,
          coalesce(sum(case when c.status='Cancelado' then 1 else 0 end), 0)::int as status_cancelled
        from public.units u
        left join public.clients c on c.unit_id = u.id
        group by u.id
      `);
            console.log('✓ unit_summary created');
        }

        // Grant on view
        try {
            await client.query('grant select on public.unit_summary to authenticated');
            console.log('✓ unit_summary grant');
        } catch (e) { console.log('⚠ unit_summary grant:', e.message); }

        // Run all grants
        const statements = sql.trim().split('\n').filter(s => s.trim());
        for (const stmt of statements) {
            try {
                await client.query(stmt);
                console.log('✓', stmt.slice(0, 60));
            } catch (e) {
                console.log('⚠', stmt.slice(0, 40), '-', e.message);
            }
        }

        console.log('\\n✅ Done!');
    } catch (err) {
        console.error('Connection error:', err.message);
    } finally {
        await client.end();
    }
}

run();
