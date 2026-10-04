import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Casos } from './casos/Casos'
import { Editor } from './Editor'
import { Login } from './Login'
import { supabase } from './supabase'

type Aba = 'conteudo' | 'casos'

/** Aberto dentro do painel administrativo (/admin), num iframe: sem cabeçalho próprio. */
const integrado = new URLSearchParams(window.location.search).has('embed')
if (integrado) document.documentElement.classList.add('painel-admin')

function abaDaUrl(): Aba {
  return new URLSearchParams(window.location.search).get('aba') === 'casos' ? 'casos' : 'conteudo'
}

function Abas({ aba, mudar }: { aba: Aba; mudar: (a: Aba) => void }) {
  const item = (valor: Aba, rotulo: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={aba === valor}
      onClick={() => mudar(valor)}
      className={`min-h-[44px] border-b-2 px-1 text-sm font-medium ${
        aba === valor ? 'border-marca-forte text-conteudo' : 'border-transparent text-conteudo-suave'
      }`}
    >
      {rotulo}
    </button>
  )
  return (
    <nav role="tablist" aria-label="Seções do painel" className="container-vert flex gap-6">
      {item('conteudo', 'Conteúdo do site')}
      {item('casos', 'Casos de antes e depois')}
    </nav>
  )
}

export default function Painel() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [verificando, setVerificando] = useState(true)
  const [aba, setAba] = useState<Aba>(abaDaUrl)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setVerificando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  function mudar(nova: Aba) {
    setAba(nova)
    const url = new URL(window.location.href)
    if (nova === 'casos') url.searchParams.set('aba', 'casos')
    else url.searchParams.delete('aba')
    window.history.replaceState(null, '', url)
  }

  if (verificando) {
    return <p className="container-vert py-20 text-sm text-conteudo-suave">Verificando acesso…</p>
  }

  if (!sessao) return <Login />

  const email = sessao.user.email ?? ''
  const sair = () => {
    void supabase.auth.signOut()
  }
  // No /admin o menu lateral já escolhe a área: aqui entra só o conteúdo.
  if (integrado) {
    if (aba === 'conteudo') return <Editor email={email} aoSair={sair} />
    return (
      <main className="min-h-full bg-fundo px-4 py-5 sm:px-6">
        <Casos integrado />
      </main>
    )
  }

  const abas = <Abas aba={aba} mudar={mudar} />

  if (aba === 'conteudo') return <Editor email={email} aoSair={sair} abas={abas} />

  return (
    <div className="min-h-dvh bg-fundo pb-28">
      <header className="border-b border-borda bg-superficie">
        <div className="container-vert flex h-16 items-center justify-between gap-4">
          <span className="font-display text-lg text-conteudo">
            Configuração da <span className="text-marca">landing</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-conteudo-tenue sm:inline">{email}</span>
            <button
              onClick={sair}
              className="inline-flex min-h-[44px] items-center rounded-full border border-borda-forte px-4 text-sm font-medium text-conteudo"
            >
              Sair
            </button>
          </div>
        </div>
        {abas}
      </header>
      <main className="container-vert max-w-4xl py-6">
        <Casos />
      </main>
    </div>
  )
}
