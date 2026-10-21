-- Permissões por usuário no painel /admin.
--
-- A diretoria (diretoria@institutovert.com.br) libera usuários e define, área
-- por área, se cada um não vê, só vê ou vê e edita; e, para contatos, agenda e
-- tarefas, de quais unidades ele vê os dados. Tudo é aplicado AQUI, no banco
-- (RLS e funções): esconder o menu no navegador é só conforto visual.
--
-- Áreas:
--   leads          Contatos, Funil, Agenda, Avaliações, Pacientes, Meu dia, Tarefas
--   relatorios     Visão geral, Relatórios, Origens, Instagram e acessos (leitura de contatos e cliques)
--   campanhas      Campanhas, Links e QR codes, Formulários
--   site           Editar site, Histórico
--   casos          Antes e depois
--   cartao         Dados da empresa, Unidades, WhatsApp e contatos, Formações, Promoções, Depoimentos
--   midia          Biblioteca de mídia
--   configuracoes  Avisos, Integrações
--   privacidade    Privacidade (pedidos de titulares de dados)
-- "Equipe e acesso" é sempre exclusivo da diretoria.
--
-- Compatibilidade: os administradores que já existiam (exceto a diretoria)
-- ganham uma linha com acesso completo, como antes. Quem não tem linha não vê
-- nada: quem for liberado a partir de agora começa SEM acesso até a diretoria
-- escolher o perfil.
--
-- Aplicado em produção em partes (site_admin_permissoes_1_base ... _6), com
-- ALTER POLICY nas políticas existentes (mesmo efeito de recriá-las).

-- ===================== 1. Base =====================
create table public.site_admin_permissoes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  perfil text not null default 'personalizado' check (char_length(perfil) between 1 and 40),
  -- {"leads":"editar","relatorios":"ver",...}; área ausente = sem acesso.
  areas jsonb not null default '{}'::jsonb check (jsonb_typeof(areas) = 'object'),
  -- null = todas as unidades; senão só as listadas.
  unidades text[] check (unidades is null or unidades <@ array['Franca', 'Ribeirão Preto']::text[]),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id) on delete set null
);
alter table public.site_admin_permissoes enable row level security;
-- Sem políticas: só as funções (security definer) leem e gravam.
revoke all on public.site_admin_permissoes from anon, authenticated;

create or replace function site_private.diretoria() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.digital_card_admins a join auth.users u on u.id = a.user_id
     where a.user_id = (select auth.uid()) and lower(u.email) = 'diretoria@institutovert.com.br')
$$;

/** 0 = sem acesso, 1 = ver, 2 = ver e editar. Sem linha de permissões: sem acesso. */
create or replace function site_private.nivel(p_area text) returns int
language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from public.digital_card_admins where user_id = (select auth.uid())) then 0
    when site_private.diretoria() then 2
    when p_area = 'equipe' then 0
    else coalesce(
      (select case p.areas ->> p_area when 'editar' then 2 when 'ver' then 1 else 0 end
         from public.site_admin_permissoes p where p.user_id = (select auth.uid())),
      0)
  end
$$;

create or replace function site_private.pode(p_area text, p_minimo int) returns boolean
language sql stable security definer set search_path = '' as $$
  select site_private.nivel(p_area) >= p_minimo
$$;

/** Pode ver dados desta unidade? Contato sem unidade só aparece para quem vê todas. */
create or replace function site_private.unidade_ok(p_unidade text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when site_private.diretoria() then true
    else coalesce(
      (select p.unidades is null or p_unidade = any (p.unidades)
         from public.site_admin_permissoes p where p.user_id = (select auth.uid())),
      false)
  end
$$;

create or replace function site_private.lead_ok(p_lead uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select site_private.unidade_ok((select l.unit from public.digital_card_leads l where l.id = p_lead))
$$;

/** Edita alguma área que usa a biblioteca de imagens públicas. */
create or replace function site_private.edita_midia() returns boolean
language sql stable security definer set search_path = '' as $$
  select site_private.pode('midia', 2) or site_private.pode('site', 2) or site_private.pode('cartao', 2) or site_private.pode('casos', 2)
$$;

grant usage on schema site_private to authenticated;
grant execute on function site_private.diretoria(), site_private.nivel(text), site_private.pode(text, int),
  site_private.unidade_ok(text), site_private.lead_ok(uuid), site_private.edita_midia() to authenticated;

/** O que o usuário logado pode fazer: o painel usa para montar o menu. */
create or replace function public.site_minhas_permissoes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'diretoria', site_private.diretoria(),
    'areas', (select jsonb_object_agg(a, case site_private.nivel(a) when 2 then 'editar' when 1 then 'ver' else 'nenhum' end)
                from unnest(array['leads','relatorios','campanhas','site','casos','cartao','midia','configuracoes','privacidade','equipe']) a),
    'unidades', case when site_private.diretoria() then null
                     else (select to_jsonb(p.unidades) from public.site_admin_permissoes p where p.user_id = (select auth.uid())) end)
$$;
revoke all on function public.site_minhas_permissoes() from public, anon;
grant execute on function public.site_minhas_permissoes() to authenticated;

create or replace function public.site_admin_definir_permissoes(p_user_id uuid, p_perfil text, p_areas jsonb, p_unidades text[])
returns void language plpgsql security definer set search_path = '' as $$
declare chave text; valor text;
begin
  if not site_private.diretoria() then raise exception 'Somente a diretoria pode definir permissões'; end if;
  if not exists (select 1 from public.digital_card_admins where user_id = p_user_id) then raise exception 'Usuário sem acesso ao painel'; end if;
  if exists (select 1 from auth.users where id = p_user_id and lower(email) = 'diretoria@institutovert.com.br') then
    raise exception 'A diretoria sempre tem acesso completo';
  end if;
  if jsonb_typeof(p_areas) <> 'object' then raise exception 'Permissões inválidas'; end if;
  for chave, valor in select key, value #>> '{}' from jsonb_each(p_areas) loop
    if chave not in ('leads','relatorios','campanhas','site','casos','cartao','midia','configuracoes','privacidade')
       or valor not in ('ver','editar') then
      raise exception 'Permissão inválida: % = %', chave, valor;
    end if;
  end loop;
  if p_unidades is not null and (cardinality(p_unidades) = 0 or not p_unidades <@ array['Franca','Ribeirão Preto']::text[]) then
    raise exception 'Unidades inválidas';
  end if;
  insert into public.site_admin_permissoes(user_id, perfil, areas, unidades, atualizado_em, atualizado_por)
    values (p_user_id, left(coalesce(nullif(btrim(p_perfil), ''), 'personalizado'), 40), p_areas, p_unidades, now(), auth.uid())
    on conflict (user_id) do update set perfil = excluded.perfil, areas = excluded.areas, unidades = excluded.unidades,
      atualizado_em = now(), atualizado_por = auth.uid();
  insert into public.site_admin_audit(entity, record_id, action, actor)
    values ('site_admin_permissoes', p_user_id::text, 'UPDATE', auth.uid());
end $$;
revoke all on function public.site_admin_definir_permissoes(uuid, text, jsonb, text[]) from public, anon;
grant execute on function public.site_admin_definir_permissoes(uuid, text, jsonb, text[]) to authenticated;

-- Administradores que já existiam (exceto a diretoria) ficam com acesso completo, como antes.
insert into public.site_admin_permissoes (user_id, perfil, areas, unidades)
select a.user_id, 'completo',
       '{"leads":"editar","relatorios":"editar","campanhas":"editar","site":"editar","casos":"editar","cartao":"editar","midia":"editar","configuracoes":"editar","privacidade":"editar"}'::jsonb,
       null
  from public.digital_card_admins a
  join auth.users u on u.id = a.user_id
 where lower(u.email) <> 'diretoria@institutovert.com.br'
on conflict (user_id) do nothing;

-- ===================== 2. Contatos, tarefas e captação =====================
alter policy card_admins_can_read_digital_card_leads on public.digital_card_leads
  using ((site_private.pode('leads', 1) or site_private.pode('relatorios', 1)) and site_private.unidade_ok(unit));
alter policy card_admins_can_update_digital_card_leads on public.digital_card_leads
  using (site_private.pode('leads', 2) and site_private.unidade_ok(unit))
  with check (site_private.pode('leads', 2) and site_private.unidade_ok(unit));
alter policy card_admins_can_delete_digital_card_leads on public.digital_card_leads
  using (site_private.pode('leads', 2) and site_private.unidade_ok(unit));

alter policy site_lead_tasks_admin_select on public.site_lead_tasks
  using (site_private.pode('leads', 1) and site_private.lead_ok(lead_id));
alter policy site_lead_tasks_admin_insert on public.site_lead_tasks
  with check (site_private.pode('leads', 2) and site_private.lead_ok(lead_id));
alter policy site_lead_tasks_admin_update on public.site_lead_tasks
  using (site_private.pode('leads', 2) and site_private.lead_ok(lead_id))
  with check (site_private.pode('leads', 2) and site_private.lead_ok(lead_id));
alter policy site_lead_tasks_admin_delete on public.site_lead_tasks
  using (site_private.pode('leads', 2) and site_private.lead_ok(lead_id));

alter policy site_lead_activity_admin_select on public.site_lead_activity
  using (site_private.pode('leads', 1) and site_private.lead_ok(lead_id));

alter policy "administradores consultam cliques do cartao" on public.digital_card_clicks
  using (site_private.pode('relatorios', 1));

alter policy site_campaigns_admin_select on public.site_campaigns using (site_private.pode('campanhas', 1));
alter policy site_campaigns_admin_insert on public.site_campaigns with check (site_private.pode('campanhas', 2));
alter policy site_campaigns_admin_update on public.site_campaigns
  using (site_private.pode('campanhas', 2)) with check (site_private.pode('campanhas', 2));
alter policy site_campaigns_admin_delete on public.site_campaigns using (site_private.pode('campanhas', 2));

-- "admin_all" (todas as operações) passa a exigir editar; leitura ganha política própria.
alter policy admin_all on public.site_forms using (site_private.pode('campanhas', 2)) with check (site_private.pode('campanhas', 2));
create policy formularios_ver on public.site_forms for select to authenticated using (site_private.pode('campanhas', 1));
alter policy admin_all on public.site_tracking_links using (site_private.pode('campanhas', 2)) with check (site_private.pode('campanhas', 2));
create policy links_ver on public.site_tracking_links for select to authenticated using (site_private.pode('campanhas', 1));
alter policy admin_all on public.site_privacy_requests using (site_private.pode('privacidade', 2)) with check (site_private.pode('privacidade', 2));
create policy privacidade_ver on public.site_privacy_requests for select to authenticated using (site_private.pode('privacidade', 1));

-- ===================== 3. Site, cartão, casos e avisos =====================
-- "casos" também grava: publicar um caso de antes e depois atualiza a seção Resultados do site.
alter policy "diretoria pode inserir conteudo" on public.landing_content
  with check (slug = 'instituto-vert' and (site_private.pode('site', 2) or site_private.pode('casos', 2)));
alter policy "diretoria pode atualizar conteudo" on public.landing_content
  using (site_private.pode('site', 2) or site_private.pode('casos', 2))
  with check (slug = 'instituto-vert' and (site_private.pode('site', 2) or site_private.pode('casos', 2)));

alter policy "diretoria pode inserir conteudo" on public.digital_card_content
  with check (slug = 'instituto-vert' and site_private.pode('cartao', 2));
alter policy "diretoria pode atualizar conteudo" on public.digital_card_content
  using (site_private.pode('cartao', 2))
  with check (slug = 'instituto-vert' and site_private.pode('cartao', 2));

alter policy admin_all on public.site_content_drafts
  using (site_private.pode(case when target = 'landing' then 'site' else 'cartao' end, 2))
  with check (site_private.pode(case when target = 'landing' then 'site' else 'cartao' end, 2));
create policy rascunhos_ver on public.site_content_drafts for select to authenticated
  using (site_private.pode(case when target = 'landing' then 'site' else 'cartao' end, 1));

alter policy admin_read on public.site_content_versions
  using (site_private.pode(case when target = 'landing' then 'site' else 'cartao' end, 1));
alter policy admin_read on public.site_admin_audit using (site_private.pode('site', 1));

alter policy site_casos_admin_all on public.site_casos
  using (site_private.pode('casos', 2)) with check (site_private.pode('casos', 2));
create policy casos_ver on public.site_casos for select to authenticated using (site_private.pode('casos', 1));
alter policy site_caso_fotos_admin_all on public.site_caso_fotos
  using (site_private.pode('casos', 2)) with check (site_private.pode('casos', 2));
create policy caso_fotos_ver on public.site_caso_fotos for select to authenticated using (site_private.pode('casos', 1));

alter policy site_aviso_lead_admin_select on public.site_aviso_lead using (site_private.pode('configuracoes', 1));
alter policy site_aviso_lead_admin_update on public.site_aviso_lead
  using (site_private.pode('configuracoes', 2)) with check (site_private.pode('configuracoes', 2));
alter policy site_aviso_lead_envios_admin_select on public.site_aviso_lead_envios using (site_private.pode('configuracoes', 1));

-- ===================== 4. Arquivos =====================
alter policy casos_pacientes_admin_select on storage.objects
  using (bucket_id = 'casos-pacientes' and site_private.pode('casos', 1));
alter policy casos_pacientes_admin_insert on storage.objects
  with check (bucket_id = 'casos-pacientes' and site_private.pode('casos', 2));
alter policy casos_pacientes_admin_update on storage.objects
  using (bucket_id = 'casos-pacientes' and site_private.pode('casos', 2));
alter policy casos_pacientes_admin_delete on storage.objects
  using (bucket_id = 'casos-pacientes' and site_private.pode('casos', 2));

alter policy site_admin_media_list on storage.objects
  using (bucket_id = 'digital-card-media' and (site_private.pode('midia', 1) or site_private.edita_midia()));
alter policy "diretoria envia midias do cartao" on storage.objects
  with check (bucket_id = 'digital-card-media' and site_private.edita_midia());
alter policy "diretoria atualiza midias do cartao" on storage.objects
  using (bucket_id = 'digital-card-media' and site_private.edita_midia())
  with check (bucket_id = 'digital-card-media' and site_private.edita_midia());
alter policy "diretoria remove midias do cartao" on storage.objects
  using (bucket_id = 'digital-card-media' and site_private.pode('midia', 2));

-- ===================== 5. Funções =====================
-- site_aviso_status/salvar/testar e site_connections_status: mesma lógica de
-- antes, trocando "é administrador" por site_private.pode('configuracoes', 1|2).
-- site_admin_members e site_admin_members_details: só a diretoria.
create or replace function public.site_admin_equipe()
returns table(user_id uuid, email text, created_at timestamptz, confirmed_at timestamptz, last_sign_in_at timestamptz,
              diretoria boolean, perfil text, areas jsonb, unidades text[], configurado boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not site_private.diretoria() then raise exception 'Acesso negado'; end if;
  return query select a.user_id, u.email::text, a.created_at, u.email_confirmed_at, u.last_sign_in_at,
      lower(u.email) = 'diretoria@institutovert.com.br',
      coalesce(p.perfil, 'completo'), coalesce(p.areas, '{}'::jsonb), p.unidades, p.user_id is not null
    from public.digital_card_admins a
    join auth.users u on u.id = a.user_id
    left join public.site_admin_permissoes p on p.user_id = a.user_id
   order by a.created_at;
end $$;
revoke all on function public.site_admin_equipe() from public, anon;
grant execute on function public.site_admin_equipe() to authenticated;
-- (Os corpos completos de site_aviso_*, site_connections_status, site_admin_members
-- e site_admin_members_details estão na migração site_admin_permissoes_5a_funcoes
-- aplicada no Supabase.)
