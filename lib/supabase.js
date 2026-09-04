import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xiskevunqbvmoclygppc.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aDaa3WVZP7siuPw8IbK_Wg_Y68x-MHH';
export const ADMIN_EMAIL = 'diretoria@institutovert.com.br';
export const ADMIN_REDIRECT_URL = 'https://instituto-vert-git-c-f3824f-rainbowimportadosgmailcoms-projects.vercel.app/admin/';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function loadCardContent() {
  const { data, error } = await supabase
    .from('digital_card_content')
    .select('content, updated_at')
    .eq('slug', 'instituto-vert')
    .single();

  if (error) throw error;
  return data;
}
