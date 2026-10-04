-- Locação de sala: apenas dentistas e profissionais da saúde, em qualquer
-- superfície (antes a regra valia só para o cartão; a landing aceitava qualquer perfil).
-- Origem sem autorização de métricas: o formulário passa a não enviar utm,
-- referência nem página; o registro fica como "nao_informada", e não "direto".
create or replace function public.site_capturar_lead(p jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_org constant uuid := '00000000-0000-0000-0000-000000000001';
  v_nome text := btrim(coalesce(p->>'nome', ''));
  v_tel text := public.crm_normalize_phone(p->>'telefone');
  v_intent text := coalesce(p->>'intencao', 'avaliacao');
  v_superficie text := coalesce(p->>'superficie', 'landing');
  v_unidade_slug text := nullif(p->>'unidade', '');
  v_unidade_nome text;
  v_unit_id uuid;
  v_profissao text := nullif(btrim(coalesce(p->>'profissao', '')), '');
  v_cidade text := nullif(btrim(coalesce(p->>'cidade', '')), '');
  v_rotulo text := left(coalesce(nullif(btrim(p->>'rotulo'), ''), 'Site'), 80);
  v_utm jsonb := case when jsonb_typeof(p->'utm') = 'object' and p->'utm' <> '{}'::jsonb then p->'utm' else null end;
  v_origem text := left(coalesce(nullif(p->'utm'->>'utm_source', ''), nullif(p->>'referrer', ''), 'nao_informada'), 100);
  v_instagram text := nullif(left(btrim(coalesce(p->>'instagram', '')), 31), '');
  v_faixa text := nullif(p->>'faixa_etaria', '');
  v_genero text := nullif(p->>'genero', '');
  v_visitor uuid := case when coalesce(p->>'visitor_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                         then (p->>'visitor_id')::uuid end;
  v_destino text := nullif(left(coalesce(p->>'destino', ''), 500), '');
  v_tipo text;
  v_contato uuid;
  v_paciente uuid;
begin
  if coalesce((p->>'consentimento')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'erro', 'consentimento');
  end if;
  if char_length(v_nome) not between 2 and 100 then
    return jsonb_build_object('ok', false, 'erro', 'nome');
  end if;
  if v_tel !~ '^[1-9][0-9]{9,10}$' then
    return jsonb_build_object('ok', false, 'erro', 'telefone');
  end if;
  if v_intent not in ('avaliacao','lentes','estetica','ortodontia','implante','curso','locacao','close_friends','paciente_atual') then
    return jsonb_build_object('ok', false, 'erro', 'intencao');
  end if;
  if v_superficie not in ('landing','digital_card') then
    return jsonb_build_object('ok', false, 'erro', 'superficie');
  end if;
  if v_intent = 'locacao'
     and (coalesce(v_profissao, '') not in ('Dentista', 'Profissional da saúde')
          or p->'respostas'->>'perfil' is distinct from v_profissao) then
    return jsonb_build_object('ok', false, 'erro', 'perfil_locacao');
  end if;
  if char_length(coalesce(v_profissao, '')) > 100 or char_length(coalesce(v_cidade, '')) > 80 then
    return jsonb_build_object('ok', false, 'erro', 'tamanho');
  end if;
  if octet_length(coalesce((p->'respostas')::text, '{}')) > 4000 then
    return jsonb_build_object('ok', false, 'erro', 'tamanho');
  end if;
  if v_faixa is not null and v_faixa not in ('18-24','25-34','35-44','45-54','55-64','65+') then v_faixa := null; end if;
  if v_genero is not null and v_genero not in ('feminino','masculino','outro','prefiro_nao_informar') then v_genero := null; end if;

  if (select count(*) from digital_card_leads
        where public.crm_normalize_phone(phone) = v_tel
          and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from digital_card_leads
        where created_at > now() - interval '10 minutes') >= 60 then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;

  v_unidade_nome := case
    when v_unidade_slug in ('franca','Franca') then 'Franca'
    when v_unidade_slug in ('ribeirao-preto','Ribeirão Preto','Ribeirao Preto') then 'Ribeirão Preto'
  end;
  if v_unidade_nome is not null then
    select id into v_unit_id from units where organization_id = v_org and name = v_unidade_nome limit 1;
  end if;

  v_tipo := case v_intent
    when 'curso' then 'formation'
    when 'locacao' then 'rental'
    when 'paciente_atual' then 'patient'
    else coalesce(nullif(p->>'tipo_painel', ''), 'appointment') end;

  insert into digital_card_leads (name, phone, profession, button, unit, destination, consent, lead_type,
      is_dentist, has_previous_course, city, course_id, course_title, visitor_id, instagram_handle,
      age_range, gender, source_origin, answers)
  values (v_nome, v_tel, v_profissao, v_rotulo, v_unidade_nome, v_destino, true, v_tipo,
      (p->>'dentista')::boolean, (p->>'ja_fez_curso')::boolean, v_cidade,
      nullif(left(coalesce(p->>'curso_id', ''), 100), ''), nullif(left(coalesce(p->>'curso_titulo', ''), 200), ''),
      v_visitor, v_instagram, v_faixa, v_genero, left(v_superficie || ':' || v_origem, 120),
      case when jsonb_typeof(p->'respostas') = 'object' then p->'respostas' else '{}'::jsonb end);

  insert into crm_contacts (organization_id, name, phone, city, unit_id, is_lead)
  values (v_org, v_nome, v_tel, v_cidade, v_unit_id, v_intent <> 'paciente_atual')
  on conflict (organization_id, phone_normalized) where (phone_normalized <> '')
  do update set
    name = coalesce(crm_contacts.name, excluded.name),
    city = coalesce(crm_contacts.city, excluded.city),
    unit_id = coalesce(crm_contacts.unit_id, excluded.unit_id),
    is_lead = crm_contacts.is_lead or (excluded.is_lead and crm_contacts.patient_id is null)
  returning id, patient_id into v_contato, v_paciente;

  if v_intent <> 'paciente_atual' then
    insert into crm_leads (organization_id, contact_id, patient_id, status, source, unit_id, consent,
                           intent, source_surface, utm, entry_page, entry_cta)
    values (v_org, v_contato, v_paciente, 'novo', 'site:' || v_superficie, v_unit_id, true,
            v_intent, v_superficie, v_utm, left(p->>'pagina', 300), left(p->>'cta', 80));
  end if;

  return jsonb_build_object('ok', true);
end;
$function$;
