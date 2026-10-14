import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { aplicar, carregarAjustes, carregarCartao, conteudoPadrao, type Conteudo, type Ajustes } from './conteudo'

const Contexto = createContext<Conteudo>(conteudoPadrao)

/** Conteúdo da página: padrões do código, sobrescritos pelo que a clínica salvou. */
export function useConteudo(): Conteudo {
  return useContext(Contexto)
}

/**
 * Renderiza imediatamente com os padrões e troca pelo conteúdo salvo assim que
 * ele chega. Assim a página nunca fica em branco esperando a rede.
 */
export function ProvedorDeConteudo({ children }: { children: ReactNode }) {
  const [conteudo, setConteudo] = useState<Conteudo>(conteudoPadrao)

  useEffect(() => {
    let ativo = true
    let draft: Ajustes | null = null
    let card: Awaited<ReturnType<typeof carregarCartao>> = null
    const previewHost = window.parent!==window ? window.parent : window.opener
    const isPreview=new URLSearchParams(window.location.search).get('preview')==='admin' && Boolean(previewHost)
    const receive=(event:MessageEvent)=>{
      if(!isPreview||event.origin!==window.location.origin||event.source!==previewHost||event.data?.type!=='vert-editor-preview')return
      draft=event.data.ajustes as Ajustes
      setConteudo(aplicar(draft,card))
    }
    window.addEventListener('message',receive)
    if(isPreview)previewHost.postMessage({type:'vert-preview-ready'},window.location.origin)
    Promise.all([carregarAjustes(), carregarCartao()]).then(([ajustes, cartao]) => {
      card=cartao
      if (ativo && (ajustes || cartao || draft)) setConteudo(aplicar(draft??ajustes, cartao))
    })
    return () => {
      ativo = false
      window.removeEventListener('message',receive)
    }
  }, [])

  return <Contexto.Provider value={conteudo}>{children}</Contexto.Provider>
}

