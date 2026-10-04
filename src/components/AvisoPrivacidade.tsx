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
        <h2 id="aviso-privacidade-titulo" className="mt-2 font-display text-3xl font-light">Cookies e proteção de dados</h2>
        <p id="aviso-privacidade-descricao" className="mt-3 text-sm leading-relaxed text-conteudo-suave">
          Usamos armazenamento necessário para lembrar sua escolha. Se aceitar os recursos opcionais, registramos acessos, origem e cliques apenas para medir e melhorar o site e o atendimento. Você pode continuar sem métricas.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-conteudo-suave">
          Nome e WhatsApp são pedidos só quando você decide falar com a equipe, e usados apenas para responder ao pedido. Origem e campanha só acompanham o contato se você aceitar as métricas.</p>
        <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4">Ler a política de privacidade</a>
        <div className="aviso-privacidade__acoes">
          <button className="aviso-privacidade__autorizar" type="button" onClick={() => escolher('accepted')}>Aceitar todos os opcionais</button>
          <button className="aviso-privacidade__recusar" type="button" onClick={() => escolher('declined')}>Continuar sem métricas</button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-conteudo-tenue">Você pode mudar sua escolha em “Privacidade e dados”, no rodapé.</p>
      </div>
    </dialog>
  )
}
