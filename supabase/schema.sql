-- ============================================================
-- Dog Health Tracker — Supabase Schema
-- Ejecutar completo en el SQL Editor de Supabase
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Se crea automáticamente para cada usuario via trigger
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'VIEWER' check (role in ('EDITOR', 'VIEWER')),
  created_at timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'VIEWER');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLA: dogs
-- ============================================================
create table public.dogs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  breed text not null,
  birth_date date not null,
  weight_kg numeric(5, 2) not null,
  sex text not null check (sex in ('macho', 'hembra')),
  color text not null,
  microchip_number text,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: vaccinations
-- ============================================================
create table public.vaccinations (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs on delete cascade not null,
  vaccine_name text not null,
  date_applied date not null,
  next_due_date date,
  veterinarian text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: medical_history
-- ============================================================
create table public.medical_history (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs on delete cascade not null,
  event_type text not null check (event_type in ('enfermedad', 'cirugía', 'consulta', 'otro')),
  title text not null,
  description text not null,
  date date not null,
  veterinarian text,
  clinic text,
  attachments_urls text[],
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: medications
-- ============================================================
create table public.medications (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs on delete cascade not null,
  name text not null,
  dose text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  is_active boolean default true not null,
  reason text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: appointments
-- ============================================================
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs on delete cascade not null,
  title text not null,
  date date not null,
  time time,
  veterinarian text,
  clinic text,
  address text,
  status text not null default 'pendiente' check (status in ('pendiente', 'completada', 'cancelada')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.vaccinations enable row level security;
alter table public.medical_history enable row level security;
alter table public.medications enable row level security;
alter table public.appointments enable row level security;

-- Función helper: verifica si el usuario actual es EDITOR
create or replace function public.is_editor()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'EDITOR'
  );
$$ language sql security definer stable;

-- --- Profiles ---
create policy "Usuarios ven su propio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuarios actualizan su propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- --- Dogs ---
create policy "Autenticados leen perros" on public.dogs
  for select using (auth.role() = 'authenticated');

create policy "Editores insertan perros" on public.dogs
  for insert with check (public.is_editor());

create policy "Editores actualizan perros" on public.dogs
  for update using (public.is_editor());

create policy "Editores eliminan perros" on public.dogs
  for delete using (public.is_editor());

-- --- Vaccinations ---
create policy "Autenticados leen vacunas" on public.vaccinations
  for select using (auth.role() = 'authenticated');

create policy "Editores insertan vacunas" on public.vaccinations
  for insert with check (public.is_editor());

create policy "Editores actualizan vacunas" on public.vaccinations
  for update using (public.is_editor());

create policy "Editores eliminan vacunas" on public.vaccinations
  for delete using (public.is_editor());

-- --- Medical history ---
create policy "Autenticados leen historial médico" on public.medical_history
  for select using (auth.role() = 'authenticated');

create policy "Editores insertan historial médico" on public.medical_history
  for insert with check (public.is_editor());

create policy "Editores actualizan historial médico" on public.medical_history
  for update using (public.is_editor());

create policy "Editores eliminan historial médico" on public.medical_history
  for delete using (public.is_editor());

-- --- Medications ---
create policy "Autenticados leen medicamentos" on public.medications
  for select using (auth.role() = 'authenticated');

create policy "Editores insertan medicamentos" on public.medications
  for insert with check (public.is_editor());

create policy "Editores actualizan medicamentos" on public.medications
  for update using (public.is_editor());

create policy "Editores eliminan medicamentos" on public.medications
  for delete using (public.is_editor());

-- --- Appointments ---
create policy "Autenticados leen citas" on public.appointments
  for select using (auth.role() = 'authenticated');

create policy "Editores insertan citas" on public.appointments
  for insert with check (public.is_editor());

create policy "Editores actualizan citas" on public.appointments
  for update using (public.is_editor());

create policy "Editores eliminan citas" on public.appointments
  for delete using (public.is_editor());

-- ============================================================
-- STORAGE: bucket para fotos de perros
-- ============================================================

-- Crear bucket público
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

-- Políticas de storage
create policy "Autenticados leen fotos" on storage.objects
  for select using (bucket_id = 'dog-photos' and auth.role() = 'authenticated');

create policy "Editores suben fotos" on storage.objects
  for insert with check (bucket_id = 'dog-photos' and public.is_editor());

create policy "Editores actualizan fotos" on storage.objects
  for update using (bucket_id = 'dog-photos' and public.is_editor());

create policy "Editores eliminan fotos" on storage.objects
  for delete using (bucket_id = 'dog-photos' and public.is_editor());

-- ============================================================
-- NOTA: Para hacer EDITOR a un usuario, ejecutar:
-- update public.profiles set role = 'EDITOR' where id = '<user-uuid>';
-- ============================================================
