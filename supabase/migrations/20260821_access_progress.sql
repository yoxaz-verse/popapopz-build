create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_user_role') then
    create type public.app_user_role as enum ('admin', 'engineer');
  end if;

  if not exists (select 1 from pg_type where typname = 'dashboard_section_id') then
    create type public.dashboard_section_id as enum (
      'overview',
      'machine',
      'architecture',
      'modules',
      'phases',
      'requirements',
      'decisions',
      'bom',
      'prototype',
      'manufacturing'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'section_progress_status') then
    create type public.section_progress_status as enum ('Not Started', 'In Progress', 'Review', 'Complete', 'Blocked');
  end if;

  if not exists (select 1 from pg_type where typname = 'assignment_entity_type') then
    create type public.assignment_entity_type as enum (
      'component_build_plan',
      'machine_module',
      'engineering_phase',
      'requirement',
      'engineering_decision',
      'bom_item',
      'prototype_stage'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'work_assignment_status') then
    create type public.work_assignment_status as enum ('Assigned', 'In Progress', 'Review', 'Done', 'Blocked');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.app_user_role not null,
  display_name text,
  active boolean not null default true,
  deactivated_at timestamptz,
  deactivated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists active boolean not null default true;
alter table public.profiles add column if not exists deactivated_at timestamptz;
alter table public.profiles add column if not exists deactivated_by uuid references public.profiles(id) on delete set null;

create table if not exists public.engineer_section_permissions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  section_id public.dashboard_section_id not null,
  can_view boolean not null default false,
  can_edit_progress boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, section_id)
);

create table if not exists public.section_progress (
  section_id public.dashboard_section_id primary key,
  percent integer not null check (percent between 0 and 100),
  status public.section_progress_status not null,
  note text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.engineer_work_assignments (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.profiles(id) on delete cascade,
  entity_type public.assignment_entity_type not null,
  entity_id text not null,
  title text not null,
  section_id public.dashboard_section_id not null,
  status public.work_assignment_status not null default 'Assigned',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  note text not null default '',
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint engineer_work_assignments_single_owner unique (entity_type, entity_id)
);

create table if not exists public.engineer_work_staffing (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.profiles(id) on delete cascade,
  entity_type public.assignment_entity_type not null,
  entity_id text not null,
  title text not null,
  section_id public.dashboard_section_id not null,
  role_name text not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_by_email text,
  created_at timestamptz not null default now(),
  constraint engineer_work_staffing_unique_engineer_role unique (engineer_id, entity_type, entity_id, role_name)
);

create or replace function public.profile_role_for_email(email_value text)
returns public.app_user_role
language sql
immutable
as $$
  select case
    when lower(email_value) = 'popapopzfoods@gmail.com' then 'admin'::public.app_user_role
    when lower(email_value) = 'taracv1411@gmail.com' then 'engineer'::public.app_user_role
    else 'engineer'::public.app_user_role
  end
$$;

create or replace function public.profile_name_for_email(email_value text)
returns text
language sql
immutable
as $$
  select case
    when lower(email_value) = 'popapopzfoods@gmail.com' then 'Admin'
    when lower(email_value) = 'taracv1411@gmail.com' then 'Engineer'
    else split_part(email_value, '@', 1)
  end
$$;

create or replace function public.current_user_role()
returns public.app_user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_role() = 'admin'::public.app_user_role
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_progress_metadata()
returns trigger
language plpgsql
as $$
begin
  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_assignment_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
begin
  select email into current_email
  from public.profiles
  where id = auth.uid();

  if tg_op = 'INSERT' then
    new.assigned_by = auth.uid();
    new.assigned_by_email = current_email;
  elsif public.is_admin() and new.engineer_id is distinct from old.engineer_id then
    new.assigned_by = auth.uid();
    new.assigned_by_email = current_email;
  end if;

  if not public.is_admin() then
    new.engineer_id = old.engineer_id;
    new.entity_type = old.entity_type;
    new.entity_id = old.entity_id;
    new.title = old.title;
    new.section_id = old.section_id;
    new.assigned_by = old.assigned_by;
    new.assigned_by_email = old.assigned_by_email;
    new.created_at = old.created_at;
  end if;

  new.progress_percent = greatest(0, least(100, new.progress_percent));
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_staffing_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
begin
  select email into current_email
  from public.profiles
  where id = auth.uid();

  new.assigned_by = auth.uid();
  new.assigned_by_email = current_email;
  return new;
end;
$$;

create or replace function public.ensure_default_engineer_permissions(target_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.engineer_section_permissions (user_id, section_id, can_view, can_edit_progress)
  values
    (target_user_id, 'overview', true, true),
    (target_user_id, 'machine', true, true),
    (target_user_id, 'architecture', false, false),
    (target_user_id, 'modules', true, true),
    (target_user_id, 'phases', true, true),
    (target_user_id, 'requirements', true, true),
    (target_user_id, 'decisions', false, false),
    (target_user_id, 'bom', false, false),
    (target_user_id, 'prototype', false, false),
    (target_user_id, 'manufacturing', false, false)
  on conflict (user_id, section_id) do nothing;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.app_user_role;
begin
  next_role := public.profile_role_for_email(new.email);

  insert into public.profiles (id, email, role, display_name, active)
  values (new.id, lower(new.email), next_role, public.profile_name_for_email(new.email), true)
  on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      display_name = excluded.display_name,
      updated_at = now();

  if next_role = 'engineer'::public.app_user_role then
    perform public.ensure_default_engineer_permissions(new.id);
  else
    delete from public.engineer_section_permissions where user_id = new.id;
  end if;

  return new;
end;
$$;

create or replace function public.ensure_permissions_when_profile_becomes_engineer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'engineer'::public.app_user_role then
    perform public.ensure_default_engineer_permissions(new.id);
  else
    delete from public.engineer_section_permissions where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_popapopz_profile on auth.users;
create trigger on_auth_user_created_popapopz_profile
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists ensure_profile_engineer_permissions on public.profiles;
create trigger ensure_profile_engineer_permissions
after insert or update of role on public.profiles
for each row execute function public.ensure_permissions_when_profile_becomes_engineer();

drop trigger if exists touch_permissions_updated_at on public.engineer_section_permissions;
create trigger touch_permissions_updated_at
before update on public.engineer_section_permissions
for each row execute function public.touch_updated_at();

drop trigger if exists set_section_progress_metadata on public.section_progress;
create trigger set_section_progress_metadata
before insert or update on public.section_progress
for each row execute function public.set_progress_metadata();

drop trigger if exists set_engineer_work_assignment_metadata on public.engineer_work_assignments;
create trigger set_engineer_work_assignment_metadata
before insert or update on public.engineer_work_assignments
for each row execute function public.set_assignment_metadata();

drop trigger if exists set_engineer_work_staffing_metadata on public.engineer_work_staffing;
create trigger set_engineer_work_staffing_metadata
before insert on public.engineer_work_staffing
for each row execute function public.set_staffing_metadata();

insert into public.profiles (id, email, role, display_name, active)
select id, lower(email), public.profile_role_for_email(email), public.profile_name_for_email(email), true
from auth.users
where lower(email) in ('popapopzfoods@gmail.com', 'taracv1411@gmail.com')
on conflict (id) do update
set email = excluded.email,
    role = excluded.role,
    display_name = excluded.display_name,
    active = true,
    deactivated_at = null,
    deactivated_by = null,
    updated_at = now();

select public.ensure_default_engineer_permissions(id)
from public.profiles
where role = 'engineer'::public.app_user_role;

insert into public.section_progress (section_id, percent, status, note)
values
  ('overview', 36, 'In Progress', 'Seeded from current engineering phase average.'),
  ('machine', 45, 'In Progress', 'Machine viewport and module packaging skeleton are active.'),
  ('architecture', 52, 'Review', 'Subsystem paths are available for review.'),
  ('modules', 48, 'In Progress', 'Module detail workspace is connected to selection state.'),
  ('phases', 36, 'In Progress', 'Seeded from existing phase tracker data.'),
  ('requirements', 58, 'Review', 'Requirements table is ready for structured updates.'),
  ('decisions', 32, 'In Progress', 'Open decisions need validation and approval flow.'),
  ('bom', 25, 'Not Started', 'BOM hooks are present; cost/source validation remains.'),
  ('prototype', 30, 'In Progress', 'Prototype stages are defined for P0 planning.'),
  ('manufacturing', 12, 'Not Started', 'Manufacturing layer is a planning placeholder.')
on conflict (section_id) do nothing;

alter table public.profiles enable row level security;
alter table public.engineer_section_permissions enable row level security;
alter table public.section_progress enable row level security;
alter table public.engineer_work_assignments enable row level security;
alter table public.engineer_work_staffing enable row level security;

drop policy if exists "Users can view own profile and admins can view all" on public.profiles;
create policy "Users can view own profile and admins can view all"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view all permissions, engineers can view visible own permissions" on public.engineer_section_permissions;
create policy "Admins can view all permissions, engineers can view visible own permissions"
on public.engineer_section_permissions
for select
to authenticated
using (public.is_admin() or (user_id = auth.uid() and can_view));

drop policy if exists "Admins can manage permissions" on public.engineer_section_permissions;
create policy "Admins can manage permissions"
on public.engineer_section_permissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view permitted progress" on public.section_progress;
create policy "Users can view permitted progress"
on public.section_progress
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.engineer_section_permissions permission
    where permission.user_id = auth.uid()
      and permission.section_id = section_progress.section_id
      and permission.can_view = true
  )
);

drop policy if exists "Users can update permitted progress" on public.section_progress;
create policy "Users can update permitted progress"
on public.section_progress
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.engineer_section_permissions permission
    where permission.user_id = auth.uid()
      and permission.section_id = section_progress.section_id
      and permission.can_edit_progress = true
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.engineer_section_permissions permission
    where permission.user_id = auth.uid()
      and permission.section_id = section_progress.section_id
      and permission.can_edit_progress = true
  )
);

drop policy if exists "Admins can insert progress" on public.section_progress;
create policy "Admins can insert progress"
on public.section_progress
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can view all assignments and engineers can view own assignments" on public.engineer_work_assignments;
create policy "Admins can view all assignments and engineers can view own assignments"
on public.engineer_work_assignments
for select
to authenticated
using (public.is_admin() or engineer_id = auth.uid());

drop policy if exists "Admins can manage all assignments" on public.engineer_work_assignments;
create policy "Admins can manage all assignments"
on public.engineer_work_assignments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Engineers can update own assignment progress" on public.engineer_work_assignments;
create policy "Engineers can update own assignment progress"
on public.engineer_work_assignments
for update
to authenticated
using (engineer_id = auth.uid())
with check (engineer_id = auth.uid());

drop policy if exists "Admins can view all staffing and engineers can view own staffing" on public.engineer_work_staffing;
create policy "Admins can view all staffing and engineers can view own staffing"
on public.engineer_work_staffing
for select
to authenticated
using (public.is_admin() or engineer_id = auth.uid());

drop policy if exists "Admins can manage staffing" on public.engineer_work_staffing;
create policy "Admins can manage staffing"
on public.engineer_work_staffing
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace view public.section_progress_with_user
with (security_invoker = true)
as
select
  progress.section_id,
  progress.percent,
  progress.status,
  progress.note,
  progress.updated_at,
  profile.email as updated_by_email
from public.section_progress progress
left join public.profiles profile on profile.id = progress.updated_by;

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.engineer_section_permissions to authenticated;
grant select, insert, update on public.section_progress to authenticated;
grant select, insert, update, delete on public.engineer_work_assignments to authenticated;
grant select, insert, delete on public.engineer_work_staffing to authenticated;
grant select on public.section_progress_with_user to authenticated;
