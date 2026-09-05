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
/** Olho aberto quando a senha está visível; cortado quando está oculta. */
function Olho({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
      {!aberto && <path d="M4 20 20 4" />}
    </svg>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
            <div className="relative mt-1.5">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-11 w-full rounded-lg border border-borda-forte bg-superficie pl-3 pr-12 text-sm text-conteudo"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-conteudo-tenue transition-colors duration-rapido hover-fino:hover:text-conteudo"
              >
                <Olho aberto={mostrarSenha} />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-conteudo-tenue">
              A mesma senha que abre o painel do cartão digital, em
              institutovert.app/admin.
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
