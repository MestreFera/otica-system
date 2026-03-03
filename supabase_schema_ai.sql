-- ============================================================================
-- N8N AI Simplified Integration Tables
-- ============================================================================

-- 1. n8n Langchain Memory Tables
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS n8n_chat_histories_gerente (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS n8n_chat_histories_agendamento (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  phone TEXT,
  nomewpp TEXT,
  bot_message TEXT,
  user_message TEXT,
  message_type TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- 2. Simplified Lead/Client table for N8N (dados_cliente)
-- Note: 'telefone' acts as the primary key identifying the customer within a unit.
CREATE TABLE IF NOT EXISTS dados_cliente (
  id BIGSERIAL PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  nomewpp TEXT,
  atendimento_ia TEXT DEFAULT 'ativo',
  setor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit_id, telefone)
);

ALTER TABLE dados_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters manage all dados_cliente" ON dados_cliente;
CREATE POLICY "Masters manage all dados_cliente" ON dados_cliente FOR ALL
    USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "Units manage own dados_cliente" ON dados_cliente;
CREATE POLICY "Units manage own dados_cliente" ON dados_cliente FOR ALL
    USING (unit_id = public.get_my_unit_id());


-- 3. Trigger Function to Sync dados_cliente to clients table
CREATE OR REPLACE FUNCTION public.sync_dados_cliente_to_clients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If the n8n bot inserts or updates dados_cliente, we upsert the main clients table.
    -- We assume 'telefone' maps to 'telefone_cliente' in the new schema (or phone).
    -- Using 'telefone_cliente' as per the Phase 3 specs for bot integration.

    IF TG_OP = 'INSERT' THEN
        IF NOT EXISTS (SELECT 1 FROM public.clients WHERE unit_id = NEW.unit_id AND telefone_cliente = NEW.telefone) THEN
             INSERT INTO public.clients (
                unit_id, name, telefone_cliente, status_ia, etapa_fluxo, status, created_at, updated_at
            ) VALUES (
                NEW.unit_id, 
                COALESCE(NEW.nomewpp, 'Sem Nome'), 
                NEW.telefone, 
                NEW.atendimento_ia, 
                NEW.setor, 
                'Novo',
                now(),
                now()
            );
        ELSE
             UPDATE public.clients
             SET name = COALESCE(NEW.nomewpp, name),
                 status_ia = NEW.atendimento_ia,
                 etapa_fluxo = NEW.setor,
                 updated_at = now()
             WHERE unit_id = NEW.unit_id AND telefone_cliente = NEW.telefone;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.clients
        SET name = COALESCE(NEW.nomewpp, name),
            status_ia = NEW.atendimento_ia,
            etapa_fluxo = NEW.setor,
            updated_at = now()
        WHERE unit_id = NEW.unit_id AND telefone_cliente = NEW.telefone;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_dados_cliente_trigger ON dados_cliente;
CREATE TRIGGER sync_dados_cliente_trigger
    AFTER INSERT OR UPDATE ON dados_cliente
    FOR EACH ROW EXECUTE FUNCTION public.sync_dados_cliente_to_clients();

-- Also ensure 'updated_at' behaves correctly
DROP TRIGGER IF EXISTS set_updated_at_dados_cliente ON dados_cliente;
CREATE TRIGGER set_updated_at_dados_cliente BEFORE UPDATE ON dados_cliente
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

