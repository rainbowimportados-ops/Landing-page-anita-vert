-- Perfis do Instagram exibidos na landing (institutovert.app), atualizados
-- pela Edge Function sincronizar-instagram. O site lê; só o service role grava.
create table if not exists public.site_instagram (
  usuario text primary key,
  nome text,
  seguidores integer,
  seguindo integer,
  publicacoes integer,
  bio text,
  site text,
  posts jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.site_instagram enable row level security;

drop policy if exists "site_instagram leitura publica" on public.site_instagram;
create policy "site_instagram leitura publica" on public.site_instagram
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.site_instagram from anon, authenticated;
grant select on public.site_instagram to anon, authenticated;

-- O agendamento do pg_cron fica em 20260927143000_site_instagram_reserva.sql.
