import { useState } from 'react'
import { supabase } from './supabase'

/**
 * Login por link mágico. Não há senha para vazar, e quem realmente pode salvar
 * é decidido pelo RLS: só usuários em digital_card_admins.
 */
export function Login() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'enviado'>('parado')
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setEstado('enviando')
    setErro(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    })

    if (error) {
      setErro(error.message)
      setEstado('parado')
      return
    }
    setEstado('enviado')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-fundo px-5">
      <div className="w-full max-w-sm rounded-painel border border-borda bg-superficie p-8 shadow-2">
        <p className="olho">Instituto Vert</p>
        <h1 className="mt-2 font-display text-2xl text-conteudo">Configuração da landing</h1>

        {estado === 'enviado' ? (
          <p className="mt-6 text-sm leading-relaxed text-conteudo-suave">
            Link enviado para <strong className="text-conteudo">{email}</strong>. Abra o e-mail
            neste mesmo navegador para entrar. Confira também a caixa de spam.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-6">
            <label htmlFor="email" className="block text-sm font-medium text-conteudo">
              E-mail autorizado
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-borda-forte bg-superficie px-3 text-sm text-conteudo"
            />
            <p className="mt-2 text-xs leading-relaxed text-conteudo-tenue">
              Enviamos um link de acesso. Não há senha.
            </p>

            {erro && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                Não foi possível enviar: {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={estado === 'enviando'}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-marca-forte px-6 text-sm font-semibold text-conteudo-inverso transition duration-padrao active:scale-[0.98] disabled:opacity-50"
            >
              {estado === 'enviando' ? 'Enviando…' : 'Receber link de acesso'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
