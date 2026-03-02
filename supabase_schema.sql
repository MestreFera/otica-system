-- Supabase SQL Schema for ÓticaSystem SaaS

-- 1. UNITS (Multi-tenant Nodes)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email TEXT,
    whatsapp TEXT,
    city TEXT,
    active BOOLEAN DEFAULT true,
    total_clients INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    webhook_url TEXT, -- n8n or Make webhook for automation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. PROFILES (Users and Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('master', 'unit')),
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL, -- Null if Master
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CRM STAGES (Pipeline Configuration)
CREATE TABLE IF NOT EXISTS public.crm_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT false, -- If true, this stage is managed by AI agents
    order_index INTEGER DEFAULT 0
);

INSERT INTO public.crm_stages (id, name, is_ai, order_index) VALUES 
('novo', 'Inbox', false, 1),
('qualificacao', 'Qualificação (IA)', true, 2),
('agendado', 'Agendado', false, 3),
('atendimento', 'Atendimento Concluído', false, 4)
ON CONFLICT (id) DO NOTHING;

-- 4. LEADS / CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    stage_id TEXT REFERENCES public.crm_stages(id) DEFAULT 'novo',
    score INTEGER DEFAULT 0, -- AI Lead Score
    last_interaction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. CONVERSATIONS (AI & Human Chat Logs)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'bot', 'agent')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) - Basic Setup Example
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow Unit users to see only their unit's data. Allow Master to see all.
CREATE POLICY "Master sees all units" ON public.units FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
);
CREATE POLICY "Unit sees own data" ON public.units FOR SELECT USING (
    id = (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
);
