-- Aviso de lead novo no WhatsApp da equipe.
--
-- Quando um lead entra em digital_card_leads (formulário do site ou do cartão),
-- o banco manda uma mensagem curta pelo WhatsApp conectado ao CRM, usando o
-- mesmo caminho da rotina crm_whatsapp_keepalive: pg_net chamando o Evolution
-- com a URL e a chave que já estão em whatsapp_connections. Nenhuma chave nova.
--
-- Nasce DESLIGADO (ativo = false e sem destino). Para ligar, preencher o destino
-- e marcar ativo na tabela site_aviso_lead (ver o final deste arquivo).
--
-- O aviso nunca pode atrapalhar o recebimento do lead: qualquer falha dentro do
-- gatilho é registrada em site_aviso_lead_envios e ignorada.

create table if not exists public.site_aviso_lead (
  id int primary key default 1 check (id = 1),
  ativo boolean not null default false,
  conexao_id uuid references public.whatsapp_connections(id) on delete set null,
  -- Número com DDD (ex.: 16999990000; o 55 é acrescentado) ou id de grupo (xxxx@g.us).
  destino text,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.site_aviso_lead_envios (
  id bigserial primary key,
  lead_id uuid,
  criado_em timestamptz not null default now(),
  request_id bigint,
  erro text
);

alter table public.site_aviso_lead enable row level security;
alter table public.site_aviso_lead_envios enable row level security;

drop policy if exists site_aviso_lead_admin_select on public.site_aviso_lead;
create policy site_aviso_lead_admin_select on public.site_aviso_lead for select to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
drop policy if exists site_aviso_lead_admin_update on public.site_aviso_lead;
create policy site_aviso_lead_admin_update on public.site_aviso_lead for update to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
drop policy if exists site_aviso_lead_envios_admin_select on public.site_aviso_lead_envios;
create policy site_aviso_lead_envios_admin_select on public.site_aviso_lead_envios for select to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));

-- Linha única de configuração, apontando para a conexão COMERCIAL VERT, desligada.
insert into public.site_aviso_lead (id, ativo, conexao_id)
select 1, false, (select id from public.whatsapp_connections where instance_name = 'vert-0a0b44b4' limit 1)
on conflict (id) do nothing;

create or replace function public.site_avisar_lead_novo()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  cfg record;
  con record;
  v_dest text;
  v_partes text[];
  v_nome text;
  v_interesse text;
  v_origem text;
  v_campanha text;
  v_texto text;
  v_req bigint;
begin
  begin
    select ativo, conexao_id, destino into cfg from public.site_aviso_lead where id = 1;
    if not found or cfg.ativo is not true or cfg.conexao_id is null or btrim(coalesce(cfg.destino, '')) = '' then
      return new;
    end if;

    -- A mesma pessoa enviando de novo em poucos minutos gera um aviso só.
    if exists (select 1 from public.digital_card_leads l
                where l.id <> new.id and l.phone = new.phone and l.created_at > now() - interval '10 minutes') then
      return new;
    end if;

    select base_url, api_key, instance_name into con
      from public.whatsapp_connections
     where id = cfg.conexao_id and is_active = true
       and base_url is not null and api_key is not null and instance_name is not null;
    if not found then
      insert into public.site_aviso_lead_envios (lead_id, erro) values (new.id, 'conexao_indisponivel');
      return new;
    end if;

    -- Grupo (id com @g.us) segue como está; número recebe só dígitos e o 55.
    v_dest := btrim(cfg.destino);
    if v_dest !~* '@g\.us$' then
      v_dest := regexp_replace(v_dest, '\D', '', 'g');
      if length(v_dest) in (10, 11) then v_dest := '55' || v_dest; end if;
    end if;

    -- Nome curto: primeiro nome e inicial do sobrenome.
    v_partes := regexp_split_to_array(btrim(coalesce(new.name, '')), '\s+');
    v_nome := left(v_partes[1], 30);
    if array_length(v_partes, 1) > 1 then
      v_nome := v_nome || ' ' || upper(left(v_partes[array_length(v_partes, 1)], 1)) || '.';
    end if;

    v_interesse := left(coalesce(
      nullif(btrim(new.course_title), ''),
      nullif(btrim(new.answers->>'interesse'), ''),
      case new.lead_type
        when 'rental' then 'Locação de sala'
        when 'formation' then 'Curso'
        when 'patient' then 'Paciente atual'
        when 'close_friends' then 'Close Friends'
      end,
      nullif(btrim(new.button), ''),
      'Contato'), 60);

    v_campanha := nullif(btrim(coalesce(new.utm_campaign, '')), '');
    v_origem := case
      when coalesce(new.gclid, new.gbraid, new.wbraid) is not null
        then 'Google Ads' || coalesce(' · ' || v_campanha, '')
      when v_campanha is not null
        then v_campanha || coalesce(' · ' || nullif(btrim(coalesce(new.utm_medium, '')), ''), '')
      else coalesce(
        nullif(split_part(regexp_replace(regexp_replace(coalesce(new.source_origin, ''), '^(landing|digital_card):', ''), '^source=', ''), ';', 1), ''),
        'Não informada')
    end;
    if v_origem = 'nao_informada' then v_origem := 'Não informada'; end if;

    v_texto := E'🔔 Novo lead: ' || v_nome
      || E'\nInteresse: ' || v_interesse
      || E'\nUnidade: ' || coalesce(nullif(btrim(new.unit), ''), 'a definir')
      || E'\nOrigem: ' || left(v_origem, 80)
      || E'\n\nAbrir ficha:\nhttps://institutovert.app/admin?section=contatos';

    v_req := net.http_post(
      url := rtrim(con.base_url, '/') || '/message/sendText/' || replace(con.instance_name, ' ', '%20'),
      headers := jsonb_build_object('apikey', con.api_key, 'Content-Type', 'application/json'),
      body := jsonb_build_object('number', v_dest, 'text', v_texto),
      timeout_milliseconds := 15000);
    insert into public.site_aviso_lead_envios (lead_id, request_id) values (new.id, v_req);
  exception when others then
    begin
      insert into public.site_aviso_lead_envios (lead_id, erro) values (new.id, left(sqlerrm, 300));
    exception when others then
      null;
    end;
  end;
  return new;
end;
$function$;

revoke all on function public.site_avisar_lead_novo() from public, anon, authenticated;

drop trigger if exists site_avisar_lead_novo_trigger on public.digital_card_leads;
create trigger site_avisar_lead_novo_trigger
  after insert on public.digital_card_leads
  for each row execute function public.site_avisar_lead_novo();

-- Para ligar (depois de reconectar o WhatsApp no CRM):
--   update public.site_aviso_lead
--      set destino = '16999990000', ativo = true, atualizado_em = now()
--    where id = 1;
-- Para conferir os envios:
--   select e.criado_em, e.lead_id, e.erro, r.status_code, left(r.content, 200)
--     from public.site_aviso_lead_envios e
--     left join net._http_response r on r.id = e.request_id
--    order by e.id desc limit 20;
