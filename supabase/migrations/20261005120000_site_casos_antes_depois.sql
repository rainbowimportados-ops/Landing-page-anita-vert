-- Biblioteca de casos de antes e depois (painel /config, aba Casos).
--
-- Fluxo: o administrador importa pastas (uma por paciente) → as fotos vão para
-- o bucket PRIVADO casos-pacientes → a função analisar-caso pede à IA (OpenAI)
-- antes/depois, ângulo e a posição dos dentes → o administrador revisa, marca a
-- autorização do paciente e publica. Só no momento de publicar as fotos
-- escolhidas são copiadas para o bucket público e entram em
-- landing_content.content.resultados.
--
-- Fotos de pacientes são dado de saúde: nada aqui é legível sem ser
-- administrador (digital_card_admins).

-- 1. Armazenamento privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('casos-pacientes', 'casos-pacientes', false, 20971520, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy casos_pacientes_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'casos-pacientes' and exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy casos_pacientes_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'casos-pacientes' and exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy casos_pacientes_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'casos-pacientes' and exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy casos_pacientes_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'casos-pacientes' and exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));

-- 2. Casos (um por pasta importada)
create table public.site_casos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  -- Termo de autorização de uso de imagem assinado pelo paciente (exigência do CFO).
  autorizacao_paciente boolean not null default false,
  autorizado_em timestamptz,
  autorizado_por uuid references auth.users(id) on delete set null,
  status text not null default 'importado' check (status in ('importado', 'analisando', 'analisado', 'erro')),
  erro_analise text,
  analisado_em timestamptz,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null default auth.uid()
);
create index site_casos_criado_idx on public.site_casos (criado_em desc);

-- 3. Fotos de cada caso
create table public.site_caso_fotos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.site_casos(id) on delete cascade,
  arquivo text not null,                -- nome original, ajuda a IA e o administrador
  caminho text not null,                -- foto em casos-pacientes (até 1800 px, WebP)
  caminho_mini text not null,           -- miniatura em casos-pacientes (360 px, WebP)
  largura int not null check (largura > 0),
  altura int not null check (altura > 0),
  momento text check (momento in ('antes', 'depois')),
  angulo text check (angulo in ('frente', 'perfil_direito', 'perfil_esquerdo', 'sorriso', 'outro')),
  -- Ponto entre os incisivos centrais superiores, em fração da foto (0–1).
  dentes_x real check (dentes_x between 0 and 1),
  dentes_y real check (dentes_y between 0 and 1),
  confianca real check (confianca between 0 and 1),
  -- Fotos com o mesmo "par" formam um antes e depois (mesmo ângulo).
  par text,
  ajustado_manualmente boolean not null default false,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index site_caso_fotos_caso_idx on public.site_caso_fotos (caso_id, ordem);

-- 4. Somente administradores
alter table public.site_casos enable row level security;
alter table public.site_caso_fotos enable row level security;

create policy site_casos_admin_all on public.site_casos for all to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));
create policy site_caso_fotos_admin_all on public.site_caso_fotos for all to authenticated
  using (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.digital_card_admins a where a.user_id = (select auth.uid())));

grant select, insert, update, delete on public.site_casos, public.site_caso_fotos to authenticated;
