-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÓticaSystem — Complete Supabase SQL Schema                               ║
-- ║  Run this ENTIRE script in the Supabase SQL Editor (Dashboard > SQL)       ║
-- ║  It is IDEMPOTENT: safe to run multiple times.                            ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- 1. UNITS — Each optical store / branch
-- ============================================================================
CREATE TABLE IF NOT EXISTS units (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    email       TEXT,
    city        TEXT,
    state       TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. PROFILES — Links Supabase Auth users to a role and optional unit
--    The `id` column MUST match auth.users.id (UUID from Supabase Auth).
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'unit' CHECK (role IN ('master', 'unit')),
    unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
    full_name   TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. CLIENTS — Individual customer/order records per unit
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

    -- Personal info
    name            TEXT NOT NULL DEFAULT '',
    client_name     TEXT,                       -- alias used in some views
    cpf             TEXT,
    rg              TEXT,
    birth_date      DATE,
    gender          TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    city            TEXT,
    zip_code        TEXT,

    -- Prescription — Right Eye (OD)
    od_esf          NUMERIC(6,2),
    od_cil          NUMERIC(6,2),
    od_eixo         NUMERIC(6,2),
    od_dnp          NUMERIC(6,2),
    od_add          NUMERIC(6,2),

    -- Prescription — Left Eye (OE)
    oe_esf          NUMERIC(6,2),
    oe_cil          NUMERIC(6,2),
    oe_eixo         NUMERIC(6,2),
    oe_dnp          NUMERIC(6,2),
    oe_add          NUMERIC(6,2),

    -- Doctor / Exam
    doctor_name     TEXT,
    exam_date       DATE,

    -- Frame
    frame_brand     TEXT,
    frame_model     TEXT,
    frame_color     TEXT,

    -- Lens
    lens_type       TEXT,
    lens_material   TEXT,

    -- Financial
    total_value     NUMERIC(12,2) DEFAULT 0,
    paid_value      NUMERIC(12,2) DEFAULT 0,
    payment_method  TEXT,
    installments    INT DEFAULT 1,

    -- Status
    status          TEXT NOT NULL DEFAULT 'Novo',
    notes           TEXT,

    -- AI / CRM pipeline columns
    status_ia         TEXT,
    etapa_fluxo       TEXT,
    ultima_interacao  TIMESTAMPTZ,
    ultima_mensagem   TEXT,

    -- Public tracking
    public_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Safely add columns if the table ALREADY existed before today
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status_ia TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS etapa_fluxo TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ultima_interacao TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ultima_mensagem TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_unit_id ON clients(unit_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_public_token ON clients(public_token);

-- ============================================================================
-- 4. STATUS_HISTORY — Audit trail for client status changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS status_history (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
    old_status  TEXT,
    new_status  TEXT NOT NULL,
    note        TEXT,
    changed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_client ON status_history(client_id);

-- ============================================================================
-- 5. AUTOMATIONS — Webhook / notification rules per unit
-- ============================================================================
CREATE TABLE IF NOT EXISTS automations (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id           UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT,
    trigger_event     TEXT NOT NULL,
    trigger_value     TEXT,
    action_type       TEXT NOT NULL DEFAULT 'webhook',
    webhook_url       TEXT,
    webhook_method    TEXT DEFAULT 'POST',
    webhook_headers   JSONB DEFAULT '{}',
    message_template  TEXT,
    active            BOOLEAN DEFAULT true,
    delay_minutes     INT DEFAULT 0,

    -- Execution counters
    runs_count        INT DEFAULT 0,
    success_count     INT DEFAULT 0,
    error_count       INT DEFAULT 0,
    last_run_at       TIMESTAMPTZ,

    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_unit ON automations(unit_id);

-- ============================================================================
-- 6. AUTOMATION_LOGS — Execution history for every automation run
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id   UUID REFERENCES automations(id) ON DELETE SET NULL,
    unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name     TEXT,
    trigger_event   TEXT,
    payload         JSONB,
    status          TEXT DEFAULT 'pending',
    response_status INT,
    response_body   TEXT,
    duration_ms     INT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_unit ON automation_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON automation_logs(created_at DESC);

-- ============================================================================
-- 7. NOTIFICATIONS — Internal system notifications per unit
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id     UUID REFERENCES units(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT,
    type        TEXT DEFAULT 'info',
    read        BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unit ON notifications(unit_id);

-- ============================================================================
-- 8. APPOINTMENTS — Scheduling per unit
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name     TEXT,
    phone           TEXT,
    date            DATE NOT NULL,
    time            TIME NOT NULL,
    type            TEXT DEFAULT 'Consulta',
    status          TEXT DEFAULT 'Agendado',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_unit_date ON appointments(unit_id, date);

-- ============================================================================
-- 9. UNIT_GOALS — Monthly revenue/client targets per unit
-- ============================================================================
CREATE TABLE IF NOT EXISTS unit_goals (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id       UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    month         DATE NOT NULL,                -- first day of the month
    revenue_goal  NUMERIC(14,2) DEFAULT 0,
    clients_goal  INT,
    created_at    TIMESTAMPTZ DEFAULT now(),

    UNIQUE(unit_id, month)
);

-- ============================================================================
-- 10. UNIT_SETTINGS — Optional branding / config per unit (public page)
-- ============================================================================
CREATE TABLE IF NOT EXISTS unit_settings (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id           UUID NOT NULL UNIQUE REFERENCES units(id) ON DELETE CASCADE,
    primary_color     TEXT DEFAULT '#00d4ff',
    whatsapp_number   TEXT,
    logo_url          TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 11. VIEW: unit_summary — Aggregated metrics for the Master Dashboard
-- ============================================================================
DROP VIEW IF EXISTS unit_summary;

CREATE OR REPLACE VIEW unit_summary AS
SELECT
    u.id,
    u.name,
    u.slug,
    u.email,
    u.city,
    u.state,
    u.active,
    u.created_at,
    COALESCE(c.total_clients, 0)        AS total_clients,
    COALESCE(c.total_revenue, 0)        AS total_revenue,
    COALESCE(c.total_paid, 0)           AS total_paid,
    COALESCE(c.status_new, 0)           AS status_new,
    COALESCE(c.status_production, 0)    AS status_production,
    COALESCE(c.status_ready, 0)         AS status_ready,
    COALESCE(c.status_delivered, 0)     AS status_delivered,
    COALESCE(c.status_cancelled, 0)     AS status_cancelled
FROM units u
LEFT JOIN LATERAL (
    SELECT
        COUNT(*)::INT                                                       AS total_clients,
        SUM(COALESCE(cl.total_value, 0))                                    AS total_revenue,
        SUM(COALESCE(cl.paid_value, 0))                                     AS total_paid,
        COUNT(*) FILTER (WHERE cl.status = 'Novo')::INT                     AS status_new,
        COUNT(*) FILTER (WHERE cl.status = 'Em Produção')::INT              AS status_production,
        COUNT(*) FILTER (WHERE cl.status = 'Pronto')::INT                   AS status_ready,
        COUNT(*) FILTER (WHERE cl.status = 'Entregue')::INT                 AS status_delivered,
        COUNT(*) FILTER (WHERE cl.status = 'Cancelado')::INT                AS status_cancelled
    FROM clients cl
    WHERE cl.unit_id = u.id
) c ON true;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ROW LEVEL SECURITY (RLS)                                                 ║
-- ║  These policies ensure data isolation between units.                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Enable RLS on all tables
ALTER TABLE units            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_settings    ENABLE ROW LEVEL SECURITY;

-- Helper function: get the role of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function: get the unit_id of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_my_unit_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT unit_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ── UNITS ──
DROP POLICY IF EXISTS "Masters see all units" ON units;
CREATE POLICY "Masters see all units" ON units FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Unit users see own unit" ON units;
CREATE POLICY "Unit users see own unit" ON units FOR ALL
    USING (id = public.get_my_unit_id());

DROP POLICY IF EXISTS "Public check unit existence" ON units;
CREATE POLICY "Public check unit existence" ON units FOR SELECT
    USING (true);

-- ── PROFILES ──
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
CREATE POLICY "Users see own profile" ON profiles FOR SELECT
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Masters see all profiles" ON profiles;
CREATE POLICY "Masters see all profiles" ON profiles FOR ALL
    USING (public.get_my_role() = 'master');

-- ── CLIENTS ──
DROP POLICY IF EXISTS "Masters manage all clients" ON clients;
CREATE POLICY "Masters manage all clients" ON clients FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units manage own clients" ON clients;
CREATE POLICY "Units manage own clients" ON clients FOR ALL
    USING (unit_id = public.get_my_unit_id());

-- Public token access (for the public status page — no auth required)
DROP POLICY IF EXISTS "Public read by token" ON clients;
CREATE POLICY "Public read by token" ON clients FOR SELECT
    USING (public_token IS NOT NULL);

-- ── STATUS_HISTORY ──
DROP POLICY IF EXISTS "Masters manage all history" ON status_history;
CREATE POLICY "Masters manage all history" ON status_history FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units manage own history" ON status_history;
CREATE POLICY "Units manage own history" ON status_history FOR ALL
    USING (unit_id = public.get_my_unit_id());

DROP POLICY IF EXISTS "Public read history by client token" ON status_history;
CREATE POLICY "Public read history by client token" ON status_history FOR SELECT
    USING (client_id IN (SELECT id FROM clients WHERE public_token IS NOT NULL));

-- ── AUTOMATIONS ──
DROP POLICY IF EXISTS "Masters manage all automations" ON automations;
CREATE POLICY "Masters manage all automations" ON automations FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units see own automations" ON automations;
CREATE POLICY "Units see own automations" ON automations FOR SELECT
    USING (unit_id = public.get_my_unit_id());

-- ── AUTOMATION_LOGS ──
DROP POLICY IF EXISTS "Masters see all logs" ON automation_logs;
CREATE POLICY "Masters see all logs" ON automation_logs FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units see own logs" ON automation_logs;
CREATE POLICY "Units see own logs" ON automation_logs FOR SELECT
    USING (unit_id = public.get_my_unit_id());

-- ── NOTIFICATIONS ──
DROP POLICY IF EXISTS "Masters manage all notifications" ON notifications;
CREATE POLICY "Masters manage all notifications" ON notifications FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units see own notifications" ON notifications;
CREATE POLICY "Units see own notifications" ON notifications FOR ALL
    USING (unit_id = public.get_my_unit_id() OR unit_id IS NULL);

-- ── APPOINTMENTS ──
DROP POLICY IF EXISTS "Masters manage all appointments" ON appointments;
CREATE POLICY "Masters manage all appointments" ON appointments FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units manage own appointments" ON appointments;
CREATE POLICY "Units manage own appointments" ON appointments FOR ALL
    USING (unit_id = public.get_my_unit_id());

-- ── UNIT_GOALS ──
DROP POLICY IF EXISTS "Masters manage all goals" ON unit_goals;
CREATE POLICY "Masters manage all goals" ON unit_goals FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units manage own goals" ON unit_goals;
CREATE POLICY "Units manage own goals" ON unit_goals FOR ALL
    USING (unit_id = public.get_my_unit_id());

-- ── UNIT_SETTINGS ──
DROP POLICY IF EXISTS "Masters manage all settings" ON unit_settings;
CREATE POLICY "Masters manage all settings" ON unit_settings FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units see own settings" ON unit_settings;
CREATE POLICY "Units see own settings" ON unit_settings FOR SELECT
    USING (unit_id = public.get_my_unit_id());

DROP POLICY IF EXISTS "Public read settings" ON unit_settings;
CREATE POLICY "Public read settings" ON unit_settings FOR SELECT
    USING (true);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  AUTO-CREATE PROFILE ON SIGNUP (trigger)                                   ║
-- ║  Ensures every new auth.users row gets a profiles row automatically.       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'unit')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  UPDATED_AT TRIGGER                                                       ║
-- ║  Automatically updates `updated_at` on row modification.                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_units ON units;
CREATE TRIGGER set_updated_at_units BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_clients ON clients;
CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_automations ON automations;
CREATE TRIGGER set_updated_at_automations BEFORE UPDATE ON automations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  SEED: Master Admin Profile                                               ║
-- ║  IMPORTANT: Replace 'YOUR_MASTER_USER_UUID' with the UUID from your       ║
-- ║  Supabase Auth user (the one you use to log in as Master).                ║
-- ║  You can find it in: Supabase Dashboard > Authentication > Users          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Example (uncomment and replace the UUID):
-- INSERT INTO profiles (id, role)
-- VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'master')
-- ON CONFLICT (id) DO UPDATE SET role = 'master';

-- ════════════════════════════════════════════════════════════════
-- ✅ DONE! Your database is ready.
-- Next steps:
--   1. Create a user in Supabase Auth (Authentication > Users)
--   2. Copy their UUID and run the INSERT above to make them Master
--   3. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
--   4. Set VITE_SUPABASE_SERVICE_KEY for the unit deployment feature
-- ════════════════════════════════════════════════════════════════
