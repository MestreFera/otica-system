import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.log("Skipping migration: DATABASE_URL not found.");
  process.exit(0);
}

// Ensure the password part is url encoded
let urlObj;
try {
  urlObj = new URL(rawConnectionString);
  if (urlObj.password) {
    urlObj.password = encodeURIComponent(decodeURIComponent(urlObj.password));
  }
} catch (e) {
  console.log("Could not parse DB url.", e);
  process.exit(1);
}

const connectionString = urlObj.toString();

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- 1. Create or replace the table creation function
create or replace function public.create_unit_n8n_tables(p_slug text)
returns void language plpgsql as $$
declare
  v_slug text := replace(p_slug, '-', '_');
begin
  execute format('create table if not exists public.%I (
    id               uuid primary key default uuid_generate_v4(),
    nome_cliente     text,
    telefone_cliente text unique,
    email_cliente    text,
    status_ia        text default ''Ativo'',
    etapa_fluxo      text default ''inicio'',
    ultima_interacao timestamptz default now(),
    ultima_mensagem  timestamptz default now(),
    created_at       timestamptz default now(),
    updated_at       timestamptz default now()
  )', 'followup_' || v_slug);

  execute format('create table if not exists public.%I (
    id               uuid primary key default uuid_generate_v4(),
    nome_cliente     text,
    telefone_cliente text,
    data_agendamento date not null,
    hora             text not null,
    tipo             text default ''Consulta'',
    status           text default ''Agendado'',
    observacoes      text,
    created_at       timestamptz default now(),
    updated_at       timestamptz default now()
  )', 'agendamento_' || v_slug);

  execute format('create table if not exists public.%I (
    id               uuid primary key default uuid_generate_v4(),
    nome_cliente     text,
    telefone_cliente text unique,
    pausado_em       timestamptz default now(),
    retoma_em        timestamptz default now() + interval ''4 hours''
  )', 'atendimento_humano_' || v_slug);

  execute format('create table if not exists public.%I (
    id               uuid primary key default uuid_generate_v4(),
    nome_cliente     text,
    telefone_cliente text unique,
    data_lembrete    timestamptz,
    mensagem         text,
    status_lembrete  text default ''pendente'',
    enviado          boolean default false,
    created_at       timestamptz default now()
  )', 'lembrete_' || v_slug);

  execute format('grant all on public.%I to service_role, authenticated', 'followup_' || v_slug);
  execute format('grant all on public.%I to service_role, authenticated', 'agendamento_' || v_slug);
  execute format('grant all on public.%I to service_role, authenticated', 'atendimento_humano_' || v_slug);
  execute format('grant all on public.%I to service_role, authenticated', 'lembrete_' || v_slug);
end;
$$;

-- 2. Create trigger to auto-create unit tables on insertion
create or replace function public.on_unit_created()
returns trigger language plpgsql as $$
begin
  perform public.create_unit_n8n_tables(replace(NEW.slug, '-', '_'));
  return NEW;
end;
$$;

drop trigger if exists trg_on_unit_created on public.units;
create trigger trg_on_unit_created
  after insert on public.units
  for each row execute function public.on_unit_created();

-- 4. View and triggers for N8N / Webhook integration
-- First, ensure the view exists (recreated here as a simplified mock if missing from original schema 
-- or assuming it exists, but we should create it to be safe).
create or replace view public.clientes_strongsales_ia as
  select name as nome_cliente, phone as telefone_cliente, email as email_cliente,
         status_ia, etapa_fluxo, ultima_interacao, ultima_mensagem,
         unit_id, status as status_pedido
  from public.clients;

-- Trigger de INSERT
create or replace function public.fn_insert_clientes_strongsales_ia()
returns trigger language plpgsql as $$
begin
  insert into public.clients (
    name, phone, email, status_ia, etapa_fluxo,
    ultima_interacao, ultima_mensagem, unit_id, status
  ) values (
    NEW.nome_cliente, NEW.telefone_cliente, NEW.email_cliente,
    coalesce(NEW.status_ia, 'Ativo'),
    coalesce(NEW.etapa_fluxo, 'inicio'),
    now(), now(),
    NEW.unit_id,
    coalesce(NEW.status_pedido, 'Novo')
  );
  return NEW;
end;
$$;

drop trigger if exists trg_insert_clientes_strongsales_ia on public.clientes_strongsales_ia;
create trigger trg_insert_clientes_strongsales_ia
  instead of insert on public.clientes_strongsales_ia
  for each row execute function public.fn_insert_clientes_strongsales_ia();

-- Trigger de UPDATE
create or replace function public.fn_update_clientes_strongsales_ia()
returns trigger language plpgsql as $$
begin
  update public.clients set
    status_ia        = NEW.status_ia,
    etapa_fluxo      = NEW.etapa_fluxo,
    ultima_interacao = coalesce(NEW.ultima_interacao, now()),
    ultima_mensagem  = coalesce(NEW.ultima_mensagem, now())
  where phone = OLD.telefone_cliente;
  return NEW;
end;
$$;

drop trigger if exists trg_update_clientes_strongsales_ia on public.clientes_strongsales_ia;
create trigger trg_update_clientes_strongsales_ia
  instead of update on public.clientes_strongsales_ia
  for each row execute function public.fn_update_clientes_strongsales_ia();

-- 5. Add columns to clients
alter table public.clients add column if not exists status_ia text default 'Ativo';
alter table public.clients add column if not exists etapa_fluxo text default 'inicio';
alter table public.clients add column if not exists ultima_interacao timestamptz default now();
alter table public.clients add column if not exists ultima_mensagem timestamptz default now();
alter table public.clients add column if not exists public_token uuid default uuid_generate_v4();
alter table public.clients add column if not exists lab text;
alter table public.clients add column if not exists delay_minutes integer default 0;

-- 6. Add columns to automations
alter table public.automations add column if not exists delay_minutes integer default 0;
`;

async function runAudit() {
  try {
    await client.connect();
    console.log("Connected to database. Running audit script...");

    // 1-2, 4-6
    await client.query(sql);

    // 3. Create tables for existing units
    console.log("Creating isolated n8n tables for existing units...");
    await client.query("select public.create_unit_n8n_tables(replace(slug, '-', '_')) from public.units;");

    console.log("Supabase Audit completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Audit failed!", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAudit();
