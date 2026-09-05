import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Editor } from './Editor'
import { Login } from './Login'
import { supabase } from './supabase'

export default function Painel() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [verificando, setVerificando] = useState(true)

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

  if (verificando) {
    return <p className="container-vert py-20 text-sm text-conteudo-suave">Verificando acesso…</p>
  }

  if (!sessao) return <Login />

  return (
    <Editor
      email={sessao.user.email ?? ''}
      aoSair={() => {
        void supabase.auth.signOut()
      }}
    />
  )
}
