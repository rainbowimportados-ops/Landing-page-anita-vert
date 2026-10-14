-- Funções da tela "Avisos" do painel /admin (aviso de lead novo no WhatsApp).
--
-- O painel não lê as tabelas de aviso nem a conexão do WhatsApp diretamente.
-- Estas três funções fazem o trabalho e só respondem aos administradores do
-- painel (digital_card_admins):
--   site_aviso_status()                  estado do aviso, da conexão e dos últimos envios
--   site_aviso_salvar(destino, ativo)    valida e grava o destino e o liga/desliga
--   site_aviso_testar()                  envia uma mensagem de teste para o destino

create or replace function public.site_aviso_status()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  cfg record;
  con record;
  v_envios jsonb;
begin
  if not exists (select 1 from public.digital_card_admins a where a.user_id = auth.uid()) then
    raise exception 'sem_permissao';
  end if;

  select ativo, destino, conexao_id into cfg from public.site_aviso_lead where id = 1;
  select display_name, status, last_status_at into con from public.whatsapp_connections where id = cfg.conexao_id;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.id desc), '[]'::jsonb) into v_envios
    from (
      select e.id, e.criado_em, e.lead_id, e.erro, r.status_code
        from public.site_aviso_lead_envios e
        left join net._http_response r on r.id = e.request_id
       order by e.id desc
       limit 15
    ) t;

  return jsonb_build_object(
    'ativo', coalesce(cfg.ativo, false),
    'destino', cfg.destino,
    'conexao', jsonb_build_object('nome', con.display_name, 'status', con.status, 'verificado_em', con.last_status_at),
    'envios', v_envios);
end;
$function$;

create or replace function public.site_aviso_salvar(p_destino text, p_ativo boolean)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v text := btrim(coalesce(p_destino, ''));
  d text;
begin
  if not exists (select 1 from public.digital_card_admins a where a.user_id = auth.uid()) then
    raise exception 'sem_permissao';
  end if;

  if v = '' then
    if coalesce(p_ativo, false) then
      return jsonb_build_object('ok', false, 'erro', 'destino_vazio');
    end if;
    update public.site_aviso_lead set destino = null, ativo = false, atualizado_em = now() where id = 1;
    return jsonb_build_object('ok', true);
  end if;

  if v ~* '@g\.us$' then
    if v !~* '^[0-9]+(-[0-9]+)?@g\.us$' then
      return jsonb_build_object('ok', false, 'erro', 'destino_invalido');
    end if;
    d := lower(v);
  else
    d := regexp_replace(v, '\D', '', 'g');
    if length(d) in (10, 11) then d := '55' || d; end if;
    if d !~ '^55[0-9]{10,11}$' then
      return jsonb_build_object('ok', false, 'erro', 'destino_invalido');
    end if;
  end if;

  insert into public.site_aviso_lead (id, ativo, destino, conexao_id)
  values (1, coalesce(p_ativo, false), d,
          (select id from public.whatsapp_connections where instance_name = 'vert-0a0b44b4' limit 1))
  on conflict (id) do update set ativo = excluded.ativo, destino = excluded.destino, atualizado_em = now();

  return jsonb_build_object('ok', true);
end;
$function$;

create or replace function public.site_aviso_testar()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  cfg record;
  con record;
  v_req bigint;
begin
  if not exists (select 1 from public.digital_card_admins a where a.user_id = auth.uid()) then
    raise exception 'sem_permissao';
  end if;

  select destino, conexao_id into cfg from public.site_aviso_lead where id = 1;
  if cfg.destino is null or btrim(cfg.destino) = '' then
    return jsonb_build_object('ok', false, 'erro', 'sem_destino');
  end if;

  select base_url, api_key, instance_name into con
    from public.whatsapp_connections
   where id = cfg.conexao_id and is_active = true
     and base_url is not null and api_key is not null and instance_name is not null;
  if not found then
    return jsonb_build_object('ok', false, 'erro', 'conexao_indisponivel');
  end if;

  -- Um teste a cada 30 segundos, para um clique repetido não virar spam.
  if exists (select 1 from public.site_aviso_lead_envios where lead_id is null and criado_em > now() - interval '30 seconds') then
    return jsonb_build_object('ok', false, 'erro', 'aguarde');
  end if;

  v_req := net.http_post(
    url := rtrim(con.base_url, '/') || '/message/sendText/' || replace(con.instance_name, ' ', '%20'),
    headers := jsonb_build_object('apikey', con.api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('number', cfg.destino,
      'text', E'✅ Teste do aviso de lead novo.\nSe você recebeu esta mensagem, o aviso está funcionando.'),
    timeout_milliseconds := 15000);
  insert into public.site_aviso_lead_envios (lead_id, request_id) values (null, v_req);
  return jsonb_build_object('ok', true);
end;
$function$;

revoke all on function public.site_aviso_status() from public, anon;
revoke all on function public.site_aviso_salvar(text, boolean) from public, anon;
revoke all on function public.site_aviso_testar() from public, anon;
grant execute on function public.site_aviso_status() to authenticated;
grant execute on function public.site_aviso_salvar(text, boolean) to authenticated;
grant execute on function public.site_aviso_testar() to authenticated;
