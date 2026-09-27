-- Trava atômica da sincronização do Instagram. A função sincronizar-instagram
-- é chamada com a chave publicável (pelo pg_cron), então qualquer um poderia
-- chamá-la; esta reserva garante no máximo uma leitura da Windsor por janela,
-- mesmo com várias chamadas simultâneas.

create table if not exists public.site_instagram_controle (
  id int primary key default 1 check (id = 1),
  reservado_em timestamptz not null default '-infinity'
);

insert into public.site_instagram_controle (id) values (1) on conflict do nothing;

alter table public.site_instagram_controle enable row level security;
revoke all on public.site_instagram_controle from anon, authenticated;

-- Devolve true só para quem conseguiu reservar; o UPDATE com a condição de
-- tempo é atômico, então chamadas concorrentes não passam juntas.
create or replace function public.reservar_sincronizacao_instagram(p_horas numeric)
returns boolean
language sql
security definer
set search_path = public
as $$
  with r as (
    update public.site_instagram_controle
       set reservado_em = now()
     where id = 1
       and reservado_em < now() - make_interval(secs => p_horas * 3600)
    returning 1
  )
  select exists (select 1 from r);
$$;

revoke execute on function public.reservar_sincronizacao_instagram(numeric) from public, anon, authenticated;
grant execute on function public.reservar_sincronizacao_instagram(numeric) to service_role;

-- Agendamento a cada 6 h. A URL do projeto e a chave publicável vêm do Vault
-- na hora da chamada (segredos "project_url" e "publishable_key"), então a
-- migração vale para qualquer ambiente; sem os segredos, a chamada só falha.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'sincronizar-instagram';

select cron.schedule('sincronizar-instagram', '17 */6 * * *', $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/sincronizar-instagram',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
$cron$);
