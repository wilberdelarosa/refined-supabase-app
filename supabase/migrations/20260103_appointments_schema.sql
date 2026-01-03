-- Appointments microservice schema
-- Run in Supabase to enable nutritionist bookings

-- Extensions (idempotent)
create extension if not exists "uuid-ossp";

-- TABLE: nutritionists
create table if not exists public.nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade,
  specialization text[] default '{}'::text[],
  bio text,
  certifications jsonb,
  availability jsonb,
  price_per_session numeric(10,2) not null default 0,
  consultation_duration int not null default 60,
  is_active boolean not null default true,
  rating numeric(3,2) not null default 0,
  total_consultations int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointment_slots
create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references public.nutritionists(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_slots_nutritionist_date on public.appointment_slots(nutritionist_id, date);

-- TABLE: quotes
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(user_id) on delete set null,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  services jsonb,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'draft',
  valid_until date,
  client_notes text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(user_id) on delete cascade,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  slot_id uuid references public.appointment_slots(id) on delete set null,
  status text not null default 'pending',
  consultation_type text,
  client_data jsonb,
  notes text,
  attachments text[],
  quote_id uuid references public.quotes(id) on delete set null,
  total_price numeric(10,2),
  paid boolean not null default false,
  payment_id uuid,
  reminder_sent boolean not null default false,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appointments_client on public.appointments(client_id);
create index if not exists idx_appointments_nutritionist on public.appointments(nutritionist_id);
create index if not exists idx_appointments_status on public.appointments(status);

-- TABLE: dynamic_forms
create table if not exists public.dynamic_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  fields jsonb not null,
  form_type text not null,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointment_notes
create table if not exists public.appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  author_id uuid references public.profiles(user_id) on delete set null,
  content text not null,
  recommendations jsonb,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointment_reviews
create table if not exists public.appointment_reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  client_id uuid references public.profiles(user_id) on delete cascade,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(appointment_id)
);

-- RLS
alter table public.nutritionists enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.quotes enable row level security;
alter table public.dynamic_forms enable row level security;
alter table public.appointment_notes enable row level security;
alter table public.appointment_reviews enable row level security;

-- POLICIES: nutritionists
create policy if not exists "Nutritionists are public" on public.nutritionists for select using (true);
create policy if not exists "Admins manage nutritionists" on public.nutritionists for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointment_slots
create policy if not exists "Slots are public" on public.appointment_slots for select using (true);
create policy if not exists "Admins manage slots" on public.appointment_slots for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointments
create policy if not exists "Users view own appointments" on public.appointments for select
  using (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));
create policy if not exists "Users create own appointments" on public.appointments for insert
  with check (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));
create policy if not exists "Users update own appointments" on public.appointments for update
  using (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: quotes
create policy if not exists "View related quotes" on public.quotes for select
  using (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));
create policy if not exists "Admins manage quotes" on public.quotes for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: dynamic_forms
create policy if not exists "Forms are public" on public.dynamic_forms for select using (is_active);
create policy if not exists "Admins manage forms" on public.dynamic_forms for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointment_notes
create policy if not exists "View related notes" on public.appointment_notes for select
  using (
    exists(select 1 from public.appointments a where a.id = appointment_id and (a.client_id = auth.uid() or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role)))
  );
create policy if not exists "Manage own notes" on public.appointment_notes for all
  using (auth.uid() = author_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (auth.uid() = author_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointment_reviews
create policy if not exists "View appointment reviews" on public.appointment_reviews for select using (true);
create policy if not exists "Clients add review" on public.appointment_reviews for insert
  with check (auth.uid() = client_id);

-- Triggers for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'update_nutritionists_updated_at') then
    create trigger update_nutritionists_updated_at before update on public.nutritionists
    for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_appointments_updated_at') then
    create trigger update_appointments_updated_at before update on public.appointments
    for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_quotes_updated_at') then
    create trigger update_quotes_updated_at before update on public.quotes
    for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_dynamic_forms_updated_at') then
    create trigger update_dynamic_forms_updated_at before update on public.dynamic_forms
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- Seed base data (safe, idempotent)
insert into public.dynamic_forms (id, name, description, fields, form_type, is_active)
values (
  '11111111-1111-1111-1111-111111111111',
  'Pre-consulta básica',
  'Formulario inicial para conocer al cliente',
  '[{"id":"age","type":"number","label":"Edad","required":true},{"id":"goal","type":"select","label":"Objetivo","required":true,"options":["Pérdida de peso","Ganancia muscular","Rendimiento deportivo"]},{"id":"allergies","type":"textarea","label":"Alergias/Intolerancias","required":false}]'::jsonb,
  'pre_consultation',
  true
) on conflict (id) do nothing;
