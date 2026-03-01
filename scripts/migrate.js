import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.log("Skipping migration: DATABASE_URL not found.");
    process.exit(0);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const sql = `
create extension if not exists "uuid-ossp";

create table if not exists public.units (
  id uuid primary key default uuid_generate_v4(),
  name text not null, slug text not null unique, city text not null,
  state char(2) not null default 'SP', active boolean not null default true,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  role text not null check (role in ('master','unit')),
  name text, created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid not null references public.units(id) on delete cascade,
  name text not null, cpf text, birth_date date, gender text,
  phone text, email text, address text, city text, state char(2), zip_code text,
  od_esf numeric(5,2), od_cil numeric(5,2), od_eixo smallint, od_dnp numeric(4,2), od_add numeric(4,2),
  oe_esf numeric(5,2), oe_cil numeric(5,2), oe_eixo smallint, oe_dnp numeric(4,2), oe_add numeric(4,2),
  frame_brand text, frame_model text, frame_color text, lens_type text, lens_material text,
  total_value numeric(10,2) default 0, paid_value numeric(10,2) default 0,
  payment_method text, installments smallint default 1,
  status text not null default 'Novo' check (status in ('Novo','Em Produção','Pronto','Entregue','Cancelado')),
  notes text, doctor_name text, exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.status_history (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  old_status text, new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text, created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.units(id) on delete cascade,
  title text not null, message text not null,
  type text not null default 'info' check (type in ('info','warning','error','success')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_unit_id on public.clients(unit_id);
create index if not exists idx_clients_status on public.clients(status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_units_updated_at on public.units;
drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_units_updated_at before update on public.units for each row execute function public.set_updated_at();
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;

create or replace function public.my_unit_id() returns uuid language sql security definer stable as
$$ select unit_id from public.profiles where id = auth.uid(); $$;
create or replace function public.my_role() returns text language sql security definer stable as
$$ select role from public.profiles where id = auth.uid(); $$;

drop policy if exists "units_select" on public.units;
drop policy if exists "units_insert" on public.units;
drop policy if exists "units_update" on public.units;
drop policy if exists "units_delete" on public.units;
create policy "units_select" on public.units for select using (public.my_role()='master' or id=public.my_unit_id());
create policy "units_insert" on public.units for insert with check (public.my_role()='master');
create policy "units_update" on public.units for update using (public.my_role()='master');
create policy "units_delete" on public.units for delete using (public.my_role()='master');

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id=auth.uid() or public.my_role()='master');
create policy "profiles_insert_own" on public.profiles for insert with check (id=auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id=auth.uid());

drop policy if exists "clients_select" on public.clients;
drop policy if exists "clients_insert" on public.clients;
drop policy if exists "clients_update" on public.clients;
drop policy if exists "clients_delete" on public.clients;
create policy "clients_select" on public.clients for select using (public.my_role()='master' or unit_id=public.my_unit_id());
create policy "clients_insert" on public.clients for insert with check (unit_id=public.my_unit_id());
create policy "clients_update" on public.clients for update using (unit_id=public.my_unit_id());
create policy "clients_delete" on public.clients for delete using (unit_id=public.my_unit_id());

drop policy if exists "sh_select" on public.status_history;
drop policy if exists "sh_insert" on public.status_history;
create policy "sh_select" on public.status_history for select using (public.my_role()='master' or unit_id=public.my_unit_id());
create policy "sh_insert" on public.status_history for insert with check (unit_id=public.my_unit_id());

drop policy if exists "notif_select" on public.notifications;
drop policy if exists "notif_insert" on public.notifications;
drop policy if exists "notif_update" on public.notifications;
create policy "notif_select" on public.notifications for select using (public.my_role()='master' or unit_id=public.my_unit_id() or unit_id is null);
create policy "notif_insert" on public.notifications for insert with check (public.my_role()='master');
create policy "notif_update" on public.notifications for update using (public.my_role()='master' or unit_id=public.my_unit_id());

create or replace view public.unit_summary as
select u.id, u.name, u.slug, u.city, u.state, u.active,
  count(c.id) as total_clients,
  coalesce(sum(c.total_value),0) as total_revenue,
  coalesce(sum(c.paid_value),0) as total_paid,
  count(c.id) filter (where c.status='Novo') as status_new,
  count(c.id) filter (where c.status='Em Produção') as status_production,
  count(c.id) filter (where c.status='Pronto') as status_ready,
  count(c.id) filter (where c.status='Entregue') as status_delivered,
  count(c.id) filter (where c.status='Cancelado') as status_cancelled,
  max(c.created_at) as last_access
from public.units u left join public.clients c on c.unit_id = u.id
group by u.id, u.name, u.slug, u.city, u.state, u.active;

insert into public.units (id,name,slug,city,state,active,email) values
  ('11111111-0000-0000-0000-000000000001','Ótica Centro','centro','São Paulo','SP',true,'centro@otica.com'),
  ('11111111-0000-0000-0000-000000000002','Ótica Norte','norte','Campinas','SP',true,'norte@otica.com'),
  ('11111111-0000-0000-0000-000000000003','Ótica Sul','sul','Santos','SP',false,'sul@otica.com')
on conflict (slug) do nothing;

insert into public.clients (unit_id,name,phone,email,status,od_esf,od_cil,od_eixo,oe_esf,oe_cil,oe_eixo,lens_type,frame_brand,total_value,paid_value,payment_method,created_at) values
  ('11111111-0000-0000-0000-000000000001','Ana Paula Ferreira','(11) 98001-0001','ana@email.com','Entregue',-2.50,-0.75,180,-2.25,-0.50,175,'Anti-reflexo','Ray-Ban',850,850,'Cartão',now()-interval'60 days'),
  ('11111111-0000-0000-0000-000000000001','Carlos Eduardo Silva','(11) 98001-0002','carlos@email.com','Entregue',-1.00,0,0,-1.25,0,0,'Transitions','Oakley',1200,1200,'PIX',now()-interval'45 days'),
  ('11111111-0000-0000-0000-000000000001','Mariana Costa','(11) 98001-0003','mari@email.com','Pronto',-3.00,-1.00,90,-3.25,-0.75,85,'Azul','Vogue',650,650,'Dinheiro',now()-interval'20 days'),
  ('11111111-0000-0000-0000-000000000001','Roberto Alves','(11) 98001-0004','rob@email.com','Em Produção',-0.75,0,0,-1.00,0,0,'Anti-reflexo','Prada',1800,900,'Cartão',now()-interval'10 days'),
  ('11111111-0000-0000-0000-000000000001','Fernanda Lima','(11) 98001-0005','fer@email.com','Novo',0,0,0,0,0,0,'Transitions','Chilli Beans',420,0,'PIX',now()-interval'2 days'),
  ('11111111-0000-0000-0000-000000000001','Paulo Henrique','(11) 98001-0006','paulo@email.com','Entregue',-4.00,-1.25,170,-4.50,-1.00,165,'Anti-reflexo','Grazi',980,980,'Cartão',now()-interval'90 days'),
  ('11111111-0000-0000-0000-000000000001','Juliana Santos','(11) 98001-0007','ju@email.com','Entregue',-1.50,-0.50,110,-1.75,-0.25,100,'Azul','Ray-Ban',760,760,'PIX',now()-interval'75 days'),
  ('11111111-0000-0000-0000-000000000001','Thiago Rodrigues','(11) 98001-0008','thiago@email.com','Cancelado',-2.00,0,0,-2.00,0,0,'Anti-reflexo','Oakley',1100,550,'Cartão',now()-interval'30 days'),
  ('11111111-0000-0000-0000-000000000001','Larissa Mendes','(11) 98001-0009','lari@email.com','Em Produção',-0.50,-0.25,45,-0.75,-0.50,50,'Transitions','Vogue',540,270,'PIX',now()-interval'7 days'),
  ('11111111-0000-0000-0000-000000000001','Bruno Carvalho','(11) 98001-0010','bruno@email.com','Pronto',-3.50,-0.75,80,-3.75,-1.00,75,'Anti-reflexo','Prada',2200,2200,'Cartão',now()-interval'14 days'),
  ('11111111-0000-0000-0000-000000000001','Camila Souza','(11) 98001-0011','cami@email.com','Entregue',-1.25,0,0,-1.50,-0.25,15,'Azul','Chilli Beans',380,380,'Dinheiro',now()-interval'50 days'),
  ('11111111-0000-0000-0000-000000000001','Diego Nascimento','(11) 98001-0012','diego@email.com','Novo',-2.75,-0.50,160,-3.00,-0.75,155,'Transitions','Oakley',1350,675,'Cartão',now()-interval'1 day'),
  ('11111111-0000-0000-0000-000000000002','Renata Oliveira','(19) 98002-0001','renata@email.com','Entregue',-1.75,-0.50,130,-2.00,-0.75,125,'Anti-reflexo','Ray-Ban',720,720,'PIX',now()-interval'40 days'),
  ('11111111-0000-0000-0000-000000000002','Marcos Pereira','(19) 98002-0002','marcos@email.com','Em Produção',-3.25,-1.00,100,-3.50,-1.25,95,'Transitions','Oakley',1500,750,'Cartão',now()-interval'12 days'),
  ('11111111-0000-0000-0000-000000000002','Patricia Gomes','(19) 98002-0003','pati@email.com','Pronto',-0.75,0,0,-1.00,0,0,'Azul','Vogue',490,490,'Dinheiro',now()-interval'18 days'),
  ('11111111-0000-0000-0000-000000000002','Anderson Lima','(19) 98002-0004','anderson@email.com','Novo',-4.25,-1.50,170,-4.50,-1.75,160,'Anti-reflexo','Grazi',680,0,'PIX',now()-interval'3 days'),
  ('11111111-0000-0000-0000-000000000002','Vanessa Torres','(19) 98002-0005','vane@email.com','Entregue',-2.00,-0.25,55,-1.75,0,0,'Transitions','Chilli Beans',430,430,'Cartão',now()-interval'55 days')
on conflict do nothing;

insert into public.notifications (unit_id,title,message,type) values
  (null,'Sistema Atualizado','Nova versão do ÓticaSystem disponível com integração Supabase!','success'),
  ('11111111-0000-0000-0000-000000000001','Meta do Mês','Você está a 85% da meta de faturamento mensal. Ótimo trabalho!','info'),
  ('11111111-0000-0000-0000-000000000002','Pedido Pendente','Verifique os pedidos em produção com prazo vencendo amanhã.','warning')
on conflict do nothing;
`;

async function runMigration() {
    try {
        await client.connect();
        console.log("Connected to database. Running migration...");
        await client.query(sql);
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed!", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
