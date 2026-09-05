import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { aplicar, carregarAjustes, conteudoPadrao, type Conteudo } from './conteudo'

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
    carregarAjustes().then((ajustes) => {
      if (ativo && ajustes) setConteudo(aplicar(ajustes))
    })
    return () => {
      ativo = false
    }
  }, [])

  return <Contexto.Provider value={conteudo}>{children}</Contexto.Provider>
}
