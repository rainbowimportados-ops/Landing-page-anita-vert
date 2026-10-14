-- Additive website administration. Does not alter clinical records or existing CRM policies.
create schema if not exists site_private;
revoke all on schema site_private from public;
grant usage on schema site_private to authenticated;
create or replace function site_private.admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.digital_card_admins where user_id=(select auth.uid()));
$$;
revoke all on function site_private.admin() from public;
grant execute on function site_private.admin() to authenticated;

create table public.site_forms (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100),
 slug text unique not null check(slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
 description text not null default '' check(length(description)<=600),
 intent text not null default 'avaliacao' check(intent in ('avaliacao','lentes','estetica','ortodontia','implante','curso','locacao')),
 unit text check(unit in ('Franca','Ribeirão Preto')),
 fields text[] not null default '{}' check(fields <@ array['cidade','profissao','instagram','mensagem']::text[]),
 published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.site_tracking_links (
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 100),
 path text not null check(path in ('/','/cartao/')),
 source text not null check(length(source) between 1 and 100),medium text not null default 'campaign' check(length(medium)<=100),
 campaign text not null check(length(campaign) between 1 and 100),content text not null default '' check(length(content)<=100),
 created_at timestamptz not null default now()
);
create table public.site_privacy_requests (
 id uuid primary key default gen_random_uuid(), lead_id uuid references public.digital_card_leads(id) on delete set null,
 kind text not null check(kind in ('acesso','correcao','exclusao','revogacao')),
 status text not null default 'recebido' check(status in ('recebido','em_analise','concluido')),
 notes text not null default '' check(length(notes)<=2000), created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.site_content_drafts (
 target text primary key check(target in ('landing','card')),content jsonb not null check(jsonb_typeof(content)='object' and octet_length(content::text)<=1000000),
 base_updated_at timestamptz,updated_at timestamptz not null default now(),updated_by uuid references auth.users(id)
);
create table public.site_content_versions (
 id bigint generated always as identity primary key,target text not null,content jsonb not null,created_at timestamptz not null default now(),actor uuid
);
create table public.site_admin_audit (
 id bigint generated always as identity primary key,entity text not null,record_id text,action text not null,actor uuid,created_at timestamptz not null default now()
);

do $$ declare t text; begin
 foreach t in array array['site_forms','site_tracking_links','site_privacy_requests','site_content_drafts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy admin_all on public.%I for all to authenticated using ((select site_private.admin())) with check ((select site_private.admin()))',t);
 end loop;
 foreach t in array array['site_content_versions','site_admin_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy admin_read on public.%I for select to authenticated using ((select site_private.admin()))',t);
 end loop;
end $$;
create index on public.site_privacy_requests(lead_id);
create index on public.site_admin_audit(created_at desc);
create index on public.site_content_versions(target,created_at desc);

create function site_private.audit() returns trigger language plpgsql security definer set search_path='' as $$
 declare row_data jsonb; begin
 row_data:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 insert into public.site_admin_audit(entity,record_id,action,actor) values(tg_table_name,coalesce(row_data->>'id',row_data->>'target',row_data->>'slug'),tg_op,auth.uid());
 if tg_table_name in ('landing_content','digital_card_content') and tg_op<>'DELETE' then
 insert into public.site_content_versions(target,content,actor) values(case when tg_table_name='landing_content' then 'landing' else 'card' end,row_data->'content',auth.uid());
 end if;
 if tg_op='DELETE' then return old; end if; return new;
 end $$;
revoke all on function site_private.audit() from public;
do $$ declare t text; begin
 foreach t in array array['site_forms','site_tracking_links','site_privacy_requests','site_content_drafts','landing_content','digital_card_content','site_campaigns','site_lead_tasks'] loop
 execute format('create trigger site_admin_audit after insert or update or delete on public.%I for each row execute function site_private.audit()',t);
 end loop; end $$;

-- Read only the public definition, never the private submissions.
create function public.site_public_form(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',name,'slug',slug,'description',description,'intent',intent,'unit',unit,'fields',fields)
 from public.site_forms where slug=p_slug and published;
$$;
revoke all on function public.site_public_form(text) from public;
grant execute on function public.site_public_form(text) to anon,authenticated;
create function public.site_submit_form(p_slug text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare f public.site_forms; payload jsonb; begin
 select * into f from public.site_forms where slug=p_slug and published;
 if not found then return jsonb_build_object('ok',false,'erro','indisponivel'); end if;
 if octet_length(p::text)>6000 then return jsonb_build_object('ok',false,'erro','dados'); end if;
 payload:=jsonb_build_object('nome',p->>'nome','telefone',p->>'telefone','consentimento',p->'consentimento',
 'intencao',f.intent,'unidade',f.unit,'superficie','landing','rotulo',f.name,
 'cidade',p->>'cidade','profissao',p->>'profissao','instagram',p->>'instagram',
 'respostas',jsonb_build_object('formulario',f.slug,'mensagem',left(p->>'mensagem',1500),'perfil',p->>'profissao'),
 'utm',jsonb_build_object('utm_source',coalesce(nullif(p->'utm'->>'utm_source',''),'formulario'),'utm_medium','form','utm_campaign',f.slug),
 'pagina','/formulario/?f='||f.slug);
 return public.site_capturar_lead(payload);
 end $$;
revoke all on function public.site_submit_form(text,jsonb) from public;
grant execute on function public.site_submit_form(text,jsonb) to anon,authenticated;

-- Publishing locks the draft and the public record. A concurrent publication is never overwritten.
create function public.site_publish_draft(p_target text,p_updated_at timestamptz) returns void language plpgsql security definer set search_path='' as $$
 declare d public.site_content_drafts; current_stamp timestamptz; current_content jsonb; begin
 if not site_private.admin() then raise exception 'Acesso negado'; end if;
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
 -- Cases are published by their own consent-aware workflow.
 d.content:=jsonb_set(d.content,'{resultados}',coalesce(current_content->'resultados','null'::jsonb));
 insert into public.landing_content(slug,content,updated_at,updated_by) values('instituto-vert',d.content,now(),auth.uid()) on conflict(slug) do update set content=excluded.content,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
 else
 update public.digital_card_content set content=d.content,updated_at=now(),updated_by=auth.uid() where slug='instituto-vert';
 end if;
 delete from public.site_content_drafts where target=p_target;
 end $$;
revoke all on function public.site_publish_draft(text,timestamptz) from public;
grant execute on function public.site_publish_draft(text,timestamptz) to authenticated;

-- No service key, passwords or auth.users data are exposed to the browser.
create function public.site_admin_members() returns table(user_id uuid,email text,created_at timestamptz) language plpgsql security definer set search_path='' as $$
 begin
 if not site_private.admin() then raise exception 'Acesso negado'; end if;
 return query select a.user_id,u.email::text,a.created_at from public.digital_card_admins a join auth.users u on u.id=a.user_id order by a.created_at;
 end $$;
revoke all on function public.site_admin_members() from public;
grant execute on function public.site_admin_members() to authenticated;
create function public.site_admin_access(p_email text,p_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
 declare member_id uuid; begin
 if not site_private.admin() or not exists(select 1 from auth.users where id=auth.uid() and lower(email)='diretoria@institutovert.com.br') then raise exception 'Somente a diretoria pode alterar acessos'; end if;
 if lower(trim(p_email))='diretoria@institutovert.com.br' then raise exception 'A conta da diretoria deve permanecer ativa'; end if;
 select id into member_id from auth.users where lower(email)=lower(trim(p_email));
 if member_id is null then raise exception 'Conta não encontrada. Cadastre a conta no provedor de autenticação antes de conceder acesso.'; end if;
 if p_enabled then insert into public.digital_card_admins(user_id) values(member_id) on conflict do nothing;
 else delete from public.digital_card_admins where user_id=member_id; end if;
 insert into public.site_admin_audit(entity,record_id,action,actor) values('digital_card_admins',member_id::text,case when p_enabled then 'GRANT' else 'REVOKE' end,auth.uid());
 end $$;
revoke all on function public.site_admin_access(text,boolean) from public;
grant execute on function public.site_admin_access(text,boolean) to authenticated;
