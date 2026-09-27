-- Operação dos leads captados nas duas superfícies do Instituto Vert.
alter table public.digital_card_leads
  add column if not exists appointment_at timestamptz,
  add column if not exists assigned_to text;

create index if not exists digital_card_leads_appointment_idx
  on public.digital_card_leads (appointment_at)
  where appointment_at is not null;

create policy card_admins_can_insert_digital_card_leads
  on public.digital_card_leads for insert to authenticated
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));

create table public.site_lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.digital_card_leads(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 180),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index site_lead_tasks_lead_idx on public.site_lead_tasks (lead_id, due_at);
alter table public.site_lead_tasks enable row level security;

create policy site_lead_tasks_admin_select on public.site_lead_tasks for select to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_lead_tasks_admin_insert on public.site_lead_tasks for insert to authenticated
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_lead_tasks_admin_update on public.site_lead_tasks for update to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_lead_tasks_admin_delete on public.site_lead_tasks for delete to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
grant select, insert, update, delete on public.site_lead_tasks to authenticated;

create table public.site_lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.digital_card_leads(id) on delete cascade,
  kind text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index site_lead_activity_lead_idx on public.site_lead_activity (lead_id, created_at desc);
alter table public.site_lead_activity enable row level security;
create policy site_lead_activity_admin_select on public.site_lead_activity for select to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
grant select on public.site_lead_activity to authenticated;

create function public.site_record_lead_activity() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.site_lead_activity (lead_id, kind, detail)
    values (new.id, 'created', coalesce(new.button, 'Novo contato'));
  else
    if new.pipeline_status is distinct from old.pipeline_status then
      insert into public.site_lead_activity (lead_id, kind, detail)
      values (new.id, 'stage', new.pipeline_status);
    end if;
    if new.appointment_at is distinct from old.appointment_at then
      insert into public.site_lead_activity (lead_id, kind, detail)
      values (new.id, 'appointment', coalesce(new.appointment_at::text, 'cancelado'));
    end if;
    if new.internal_notes is distinct from old.internal_notes and new.internal_notes is not null then
      insert into public.site_lead_activity (lead_id, kind, detail)
      values (new.id, 'note', new.internal_notes);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.site_record_lead_activity() from public, anon, authenticated;
create trigger site_lead_activity_trigger after insert or update of pipeline_status, appointment_at, internal_notes
  on public.digital_card_leads for each row execute function public.site_record_lead_activity();

create table public.site_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9_-]{1,59}$'),
  destination text not null default 'landing' check (destination in ('landing', 'digital_card')),
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_campaigns enable row level security;
create policy site_campaigns_admin_select on public.site_campaigns for select to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_campaigns_admin_insert on public.site_campaigns for insert to authenticated
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_campaigns_admin_update on public.site_campaigns for update to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_campaigns_admin_delete on public.site_campaigns for delete to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
grant select, insert, update, delete on public.site_campaigns to authenticated;
