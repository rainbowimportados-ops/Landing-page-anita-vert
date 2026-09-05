import { useState } from 'react'
import { supabase } from './supabase'

/**
 * Login por e-mail e senha, o mesmo par que já abre o painel do cartão.
 *
 * Não usa link mágico de propósito: ele depende de a URL de retorno estar
 * autorizada no Supabase, e só `https://instituto-vert.vercel.app/admin/`
 * está. Em institutovert.app/config o redirecionamento seria descartado e a
 * sessão nunca chegaria aqui.
 *
 * Quem pode salvar continua sendo decisão do RLS: o usuário precisa estar em
 * digital_card_admins. Esta tela apenas autentica.
 */
export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault()
    setEntrando(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setErro(
        error.message.toLowerCase().includes('invalid')
          ? 'E-mail ou senha incorretos.'
          : error.message,
      )
      setEntrando(false)
    }
    // No sucesso, o Painel troca de tela sozinho ao detectar a sessão.
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-fundo px-5 py-10">
      <div className="w-full max-w-sm rounded-painel border border-borda bg-superficie p-8 shadow-2">
        <p className="olho">Instituto Vert</p>
        <h1 className="mt-2 font-display text-2xl text-conteudo">Configuração da landing</h1>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-conteudo">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-borda-forte bg-superficie px-3 text-sm text-conteudo"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-conteudo">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-borda-forte bg-superficie px-3 text-sm text-conteudo"
            />
            <p className="mt-2 text-xs leading-relaxed text-conteudo-tenue">
              A mesma senha que abre o painel do cartão digital.
            </p>
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={entrando}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-marca-forte px-6 text-sm font-semibold text-conteudo-inverso transition duration-padrao active:scale-[0.98] disabled:opacity-50"
          >
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
