export const PRIVACY_STORAGE_KEY = 'vert_privacy_choice_v1'
export const CONSENT_VERSION = '2026-09-v5'

export function escolhaPrivacidade(): 'accepted' | 'declined' | null {
  try {
    const escolha = window.localStorage.getItem(PRIVACY_STORAGE_KEY)
    if (escolha === `accepted:${CONSENT_VERSION}`) return 'accepted'
    if (escolha === `declined:${CONSENT_VERSION}`) return 'declined'
  } catch {
    // Sem armazenamento, a decisão vale apenas durante esta visita.
  }
  return null
}

export function guardarEscolha(escolha: 'accepted' | 'declined'): void {
  try {
    window.localStorage.setItem(PRIVACY_STORAGE_KEY, `${escolha}:${CONSENT_VERSION}`)
    if (escolha === 'declined') {
      window.localStorage.removeItem('vert_card_visitor_id')
      window.localStorage.removeItem('vert_card_instagram')
      window.sessionStorage.removeItem('vert_origem_v1')
    }
  } catch {}
}
