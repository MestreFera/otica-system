// Fix Supabase permissions using the REST API (service_role key)
const SUPABASE_URL = 'https://oilaemnobsdtaapbfess.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbGFlbW5vYnNkdGFhcGJmZXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxOTkwNCwiZXhwIjoyMDg3ODk1OTA0fQ.FO1kVQTEUB6WV1FAtyKlbNjTikJMGb3yVouiu0ywy_s';

async function runSQL(sql) {
    // Use the pg_query RPC endpoint (available with service_role key in some setups)
    // Actually, let's just test the basic functionality first
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({})
    });
    return res;
}

async function testInsert() {
    console.log("=== Test 1: Try to read from units table ===");

    const readRes = await fetch(`${SUPABASE_URL}/rest/v1/units?select=id,name,slug&limit=5`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        }
    });

    console.log("Read status:", readRes.status);
    const readData = await readRes.json();
    console.log("Read data:", JSON.stringify(readData, null, 2));

    console.log("\n=== Test 2: Try to insert a test unit with service key ===");

    const testSlug = 'test_permission_check_' + Date.now();
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/units`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            name: 'Test Permission',
            slug: testSlug,
            email: 'test@test.com',
            city: 'Test',
            state: 'SP',
            active: true
        })
    });

    console.log("Insert status:", insertRes.status);
    const insertText = await insertRes.text();
    console.log("Insert response:", insertText);

    // If insert succeeded, clean up
    if (insertRes.ok) {
        console.log("\n=== Cleaning up test unit ===");
        const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/units?slug=eq.${testSlug}`, {
            method: 'DELETE',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
            }
        });
        console.log("Delete status:", deleteRes.status);
    }
}

async function checkColumns() {
    console.log("\n=== Test 3: Check units table columns ===");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/units?select=*&limit=1`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No data or error:", JSON.stringify(data));
    }
}

testInsert().then(() => checkColumns());
