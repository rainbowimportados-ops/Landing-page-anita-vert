alter table public.digital_card_leads
  add column if not exists age_range text,
  add column if not exists gender text;

alter table public.digital_card_leads
  drop constraint if exists digital_card_leads_age_range_check,
  add constraint digital_card_leads_age_range_check
    check (age_range is null or age_range in ('18-24', '25-34', '35-44', '45-54', '55-64', '65+')),
  drop constraint if exists digital_card_leads_gender_check,
  add constraint digital_card_leads_gender_check
    check (gender is null or gender in ('feminino', 'masculino', 'outro', 'prefiro_nao_informar'));

comment on column public.digital_card_leads.age_range is
  'Faixa etária opcional informada voluntariamente pela pessoa no formulário do cartão.';

comment on column public.digital_card_leads.gender is
  'Gênero opcional informado voluntariamente pela pessoa no formulário do cartão.';
