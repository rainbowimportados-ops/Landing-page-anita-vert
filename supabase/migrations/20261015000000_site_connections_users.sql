-- Safe connection metadata; the clinical management roles remain authoritative.
create or replace function public.site_connections_status() returns jsonb
language plpgsql security definer set search_path='' as $$
declare c record;
begin
  if not site_private.admin() then raise exception 'Acesso negado'; end if;
  select w.id,w.display_name,w.status,w.last_status_at,w.organization_id into c
  from public.site_aviso_lead a join public.whatsapp_connections w on w.id=a.conexao_id
  where a.id=1 and w.is_active;
  return jsonb_build_object('id',c.id,'name',c.display_name,'status',c.status,'checked_at',c.last_status_at,
    'can_manage',exists(select 1 from public.profiles p join public.user_roles r on r.user_id=p.id
       where p.id=auth.uid() and p.organization_id=c.organization_id and r.role::text in ('admin','super_admin','gestor')));
end $$;
revoke all on function public.site_connections_status() from public,anon;
grant execute on function public.site_connections_status() to authenticated;

create or replace function public.site_admin_members_details() returns table(user_id uuid,email text,created_at timestamptz,confirmed_at timestamptz,last_sign_in_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
  if not site_private.admin() then raise exception 'Acesso negado'; end if;
  return query select a.user_id,u.email::text,a.created_at,u.email_confirmed_at,u.last_sign_in_at
    from public.digital_card_admins a join auth.users u on u.id=a.user_id order by a.created_at;
end $$;
revoke all on function public.site_admin_members_details() from public,anon;
grant execute on function public.site_admin_members_details() to authenticated;

-- Only the director may resolve accounts for the invite workflow.
create or replace function public.site_admin_account(p_email text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if not site_private.admin() or not exists(select 1 from auth.users where id=auth.uid() and lower(email)='diretoria@institutovert.com.br') then
    raise exception 'Somente a diretoria pode liberar usuários';
  end if;
  select jsonb_build_object('id',id,'confirmed',email_confirmed_at is not null) into result from auth.users where lower(email)=lower(btrim(p_email));
  return result;
end $$;
revoke all on function public.site_admin_account(text) from public,anon;
grant execute on function public.site_admin_account(text) to authenticated;
