-- O cadastro manual usa a mesma RPC validada dos formulários públicos.
-- A inserção direta pela API não é necessária.
drop policy if exists card_admins_can_insert_digital_card_leads on public.digital_card_leads;
