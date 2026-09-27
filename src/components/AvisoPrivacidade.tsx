import { useEffect, useRef } from 'react'
import { MarcaVert } from './MarcaVert'
import { registrarClique } from '../lib/analytics'
import { origemDaVisita } from '../lib/origem'
import { escolhaPrivacidade, guardarEscolha } from '../lib/privacidade'

export function AvisoPrivacidade() {
  const dialogo = useRef<HTMLDialogElement>(null)
  const inicializado = useRef(false)

  useEffect(() => {
    if (!inicializado.current) {
      inicializado.current = true
      if (escolhaPrivacidade() === 'accepted') {
        origemDaVisita()
        registrarClique('visualizacao_pagina', null, 'page_view')
      } else if (!escolhaPrivacidade()) {
        dialogo.current?.showModal()
      }
    }
    const reabrir = () => dialogo.current?.showModal()
    window.addEventListener('vert:privacy-settings', reabrir)
    return () => window.removeEventListener('vert:privacy-settings', reabrir)
  }, [])

  function escolher(opcao: 'accepted' | 'declined') {
    guardarEscolha(opcao)
    dialogo.current?.close()
    if (opcao === 'accepted') {
      origemDaVisita()
      registrarClique('visualizacao_pagina', null, 'page_view')
    }
  }

  return (
    <dialog ref={dialogo} className="aviso-privacidade" aria-labelledby="aviso-privacidade-titulo"
      aria-describedby="aviso-privacidade-descricao" onCancel={(evento) => evento.preventDefault()}>
      <div className="aviso-privacidade__corpo">
        <MarcaVert versao="circular" className="h-12 text-conteudo" />
        <p className="olho mt-5">Sua escolha</p>
        <h2 id="aviso-privacidade-titulo" className="mt-2 font-display text-3xl font-light">Privacidade no Instituto Vert</h2>
        <p id="aviso-privacidade-descricao" className="mt-3 text-sm leading-relaxed text-conteudo-suave">
          Você pode conhecer o site sem autorizar métricas. Se permitir, registramos acessos e cliques para entender o interesse pelos nossos serviços. Seus dados de contato são pedidos somente quando você decide falar com a equipe.
        </p>
        <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4">Ler a política de privacidade</a>
        <div className="aviso-privacidade__acoes">
          <button className="aviso-privacidade__autorizar" type="button" onClick={() => escolher('accepted')}>Autorizar métricas</button>
          <button className="aviso-privacidade__recusar" type="button" onClick={() => escolher('declined')}>Continuar sem métricas</button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-conteudo-tenue">Você pode mudar sua escolha em “Privacidade e dados”, no rodapé.</p>
      </div>
    </dialog>
  )
}
