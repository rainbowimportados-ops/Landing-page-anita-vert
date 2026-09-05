import { createClient } from '@supabase/supabase-js'

const URL = 'https://xiskevunqbvmoclygppc.supabase.co'
const CHAVE = 'sb_publishable_aDaa3WVZP7siuPw8IbK_Wg_Y68x-MHH'

/**
 * Cliente com sessão persistida, para o login por link mágico sobreviver ao
 * redirecionamento de volta para o painel.
 *
 * Quem pode salvar não é decidido aqui: o RLS da tabela landing_content exige
 * que o usuário esteja em digital_card_admins. Esta tela só reflete isso.
 */
export const supabase = createClient(URL, CHAVE, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
