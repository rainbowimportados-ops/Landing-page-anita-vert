-- Acompanhamento dos contatos captados pelo site e cartão.
-- As políticas existentes de digital_card_leads limitam leitura e edição à diretoria.
alter table public.digital_card_leads
  add column if not exists pipeline_status text not null default 'novo',
  add column if not exists internal_notes text,
  add column if not exists next_followup_at timestamptz;

alter table public.digital_card_leads
  add constraint digital_card_leads_pipeline_status_check
  check (pipeline_status in ('novo', 'em_contato', 'agendado', 'concluido', 'perdido'));

create index if not exists digital_card_leads_pipeline_followup_idx
  on public.digital_card_leads (pipeline_status, next_followup_at)
  where next_followup_at is not null;
