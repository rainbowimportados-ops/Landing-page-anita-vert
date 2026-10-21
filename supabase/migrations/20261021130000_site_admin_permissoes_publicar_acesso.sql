-- Complemento das permissões do /admin (20261021120000_site_admin_permissoes.sql).
--
-- 1. Publicar rascunho exige poder EDITAR a área (site ou cartão), não só ser
--    administrador.
-- 2. Liberar acesso cria permissões vazias ("pendente": nada visível até a
--    diretoria definir) e revogar apaga as permissões junto, para um novo
--    acesso começar do zero.
--
-- Aplicar no Supabase: SQL Editor → colar este arquivo → Run.

create or replace function public.site_publish_draft(p_target text, p_updated_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
 declare d public.site_content_drafts; current_stamp timestamptz; current_content jsonb; begin
 if not site_private.pode(case when p_target = 'landing' then 'site' else 'cartao' end, 2) then raise exception 'Acesso negado'; end if;
 select * into d from public.site_content_drafts where target=p_target for update;
 if not found then raise exception 'Salve um rascunho antes de publicar'; end if;
 if d.updated_at is distinct from p_updated_at then raise exception 'O rascunho mudou. Recarregue antes de publicar.'; end if;
 if p_target='landing' then
 select content,updated_at into current_content,current_stamp from public.landing_content where slug='instituto-vert' for update;
 else
 select content,updated_at into current_content,current_stamp from public.digital_card_content where slug='instituto-vert' for update;
 end if;
 if current_stamp is distinct from d.base_updated_at then raise exception 'O conteúdo publicado mudou. Recarregue antes de publicar.'; end if;
 if p_target='landing' then
 -- Casos de antes e depois são publicados pelo fluxo próprio, com autorização do paciente.
 d.content:=jsonb_set(d.content,'{resultados}',coalesce(current_content->'resultados','null'::jsonb));
 insert into public.landing_content(slug,content,updated_at,updated_by) values('instituto-vert',d.content,now(),auth.uid()) on conflict(slug) do update set content=excluded.content,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
 else
 update public.digital_card_content set content=d.content,updated_at=now(),updated_by=auth.uid() where slug='instituto-vert';
 end if;
 delete from public.site_content_drafts where target=p_target;
 end $$;

create or replace function public.site_admin_access(p_email text, p_enabled boolean) returns void
language plpgsql security definer set search_path = '' as $$
 declare member_id uuid; begin
 if not site_private.diretoria() then raise exception 'Somente a diretoria pode alterar acessos'; end if;
 if lower(trim(p_email))='diretoria@institutovert.com.br' then raise exception 'A conta da diretoria deve permanecer ativa'; end if;
 select id into member_id from auth.users where lower(email)=lower(trim(p_email));
 if member_id is null then raise exception 'Conta não encontrada. Cadastre a conta no provedor de autenticação antes de conceder acesso.'; end if;
 if p_enabled then
   insert into public.digital_card_admins(user_id) values(member_id) on conflict do nothing;
   insert into public.site_admin_permissoes(user_id, perfil, areas, unidades, atualizado_por)
     values (member_id, 'pendente', '{}'::jsonb, null, auth.uid()) on conflict (user_id) do nothing;
 else
   delete from public.digital_card_admins where user_id=member_id;
   delete from public.site_admin_permissoes where user_id=member_id;
 end if;
 insert into public.site_admin_audit(entity,record_id,action,actor) values('digital_card_admins',member_id::text,case when p_enabled then 'GRANT' else 'REVOKE' end,auth.uid());
 end $$;
