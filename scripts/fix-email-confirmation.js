/**
 * fix-email-confirmation.js
 *
 * Confirms all pending email verifications in Supabase Auth so that
 * manually-created users (via Admin API or the Supabase dashboard) can log in.
 *
 * Usage (run once, locally):
 *   node --env-file=.env scripts/fix-email-confirmation.js
 *
 * Or with dotenv-cli:
 *   npx dotenv -e .env -- node scripts/fix-email-confirmation.js
 */

import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌  DATABASE_URL not set. Add it to your .env file.');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

// ─── SQL ──────────────────────────────────────────────────────────────────────
// Confirms every unverified user.
// The WHERE clause can be tightened to specific emails if needed.
const fix = `
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;
`;

// ─── Report query ─────────────────────────────────────────────────────────────
const report = `
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 30;
`;

async function run() {
    try {
        await client.connect();
        console.log('✅  Connected to database.');

        const result = await client.query(fix);
        console.log(`✅  Fixed ${result.rowCount} user(s) with unconfirmed emails.`);

        const { rows } = await client.query(report);
        console.log('\n📋 Current users (most recent 30):');
        console.table(
            rows.map(r => ({
                email: r.email,
                confirmed: r.email_confirmed_at ? '✅' : '❌',
                created: new Date(r.created_at).toLocaleString('pt-BR'),
            }))
        );

        process.exit(0);
    } catch (err) {
        console.error('❌  Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
