import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { MAXIMO_FOTOS, agruparPorPasta, analisarCaso, arquivosDoArraste, casoNoSite, importarCaso, listarCasos, type Caso } from './dados'
import { RevisarCaso } from './RevisarCaso'

const botao = 'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-borda-forte px-3 text-xs font-medium text-conteudo disabled:opacity-50'

const rotuloStatus: Record<Caso['status'], string> = {
  importado: 'Aguardando análise',
  analisando: 'Analisando…',
  analisado: 'Pronto para revisar',
  erro: 'Erro na análise',
}

/**
 * Aba Casos do /config: arraste pastas (uma por paciente), a IA organiza
 * antes, depois e o alinhamento, e você escolhe o que vai para o site.
 */
export function Casos({ integrado = false }: { integrado?: boolean }) {
  const [casos, setCasos] = useState<Caso[]>([])
  const [noSite, setNoSite] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [progresso, setProgresso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [avisos, setAvisos] = useState<string[]>([])
  const pastas = useRef<HTMLInputElement>(null)
  const avulsas = useRef<HTMLInputElement>(null)

  const recarregar = useCallback(async () => {
    try {
      const [lista, atual] = await Promise.all([listarCasos(), casoNoSite()])
      setCasos(lista)
      setNoSite(atual)
    } catch (e) {
      setErro((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  async function importar(arquivos: File[]) {
    setErro(null)
    setAvisos([])
    if (arquivos.length === 0) {
      setErro('Nenhum arquivo chegou. Se as fotos estão no app Fotos do Mac, exporte para uma pasta no Finder (Arquivo → Exportar) e arraste a pasta.')
      return
    }
    const { grupos, ignorados } = agruparPorPasta(arquivos)
    const novosAvisos: string[] = []
    if (ignorados.length) {
      novosAvisos.push(`${ignorados.length} ${ignorados.length === 1 ? 'arquivo não é foto e foi ignorado' : 'arquivos não são fotos e foram ignorados'}: ${ignorados.slice(0, 4).join(', ')}${ignorados.length > 4 ? '…' : ''}.`)
    }
    if (grupos.size === 0) {
      setErro('Nenhuma foto reconhecida. Use JPG, PNG, WebP ou HEIC (fotos do iPhone).')
      setAvisos(novosAvisos)
      return
    }
    const criados: string[] = []
    try {
      let n = 0
      for (const [nome, lista] of grupos) {
        n += 1
        if (lista.length < 2) {
          novosAvisos.push(`"${nome}" tem só 1 foto e ficou de fora: cada caso precisa de pelo menos uma foto de antes e uma de depois.`)
          continue
        }
        if (lista.length > MAXIMO_FOTOS) {
          novosAvisos.push(`"${nome}" tem ${lista.length} fotos e ficou de fora: o limite é ${MAXIMO_FOTOS} por caso. Divida em duas pastas.`)
          continue
        }
        try {
          const { id, puladas } = await importarCaso(nome, lista, (etapa, feitas) =>
            setProgresso(
              `${etapa === 'preparando' ? 'Preparando' : 'Enviando'} "${nome}" (${n} de ${grupos.size}): foto ${feitas + 1} de ${lista.length}`,
            ),
          )
          criados.push(id)
          if (puladas.length) novosAvisos.push(`Em "${nome}", ${puladas.length === 1 ? 'esta foto não abriu' : 'estas fotos não abriram'} e ficou de fora: ${puladas.join(', ')}.`)
        } catch (e) {
          novosAvisos.push((e as Error).message)
        }
      }
      setAvisos([...novosAvisos])
      await recarregar()
      for (const [i, id] of criados.entries()) {
        setProgresso(`A IA está analisando o caso ${i + 1} de ${criados.length}… (1 a 3 minutos)`)
        await analisarCaso(id).catch((e: Error) => novosAvisos.push(e.message)) // o erro também fica gravado no caso
        await recarregar()
      }
      setAvisos([...novosAvisos])
      if (criados.length === 1 && novosAvisos.length === 0) setAberto(criados[0])
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setProgresso(null)
      void recarregar()
    }
  }

  async function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastando(false)
    await importar(await arquivosDoArraste(evento.dataTransfer))
  }

  if (aberto) {
    return (
      <RevisarCaso
        id={aberto}
        aoVoltar={() => {
          setAberto(null)
          void recarregar()
        }}
      />
    )
  }

  return (
    <div className={integrado ? 'vert-cases space-y-4' : 'vert-cases space-y-6'}>
      <div hidden={integrado}>
        <h2 className="titulo-secao">Casos de antes e depois</h2>
        <p className="lead mt-2">
          Arraste as pastas dos pacientes — uma pasta por paciente, com as fotos de antes e de depois. A IA separa antes e
          depois, forma os pares e alinha pelos dentes. Você confere e escolhe qual caso aparece no site.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={`grid place-items-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors ${
          arrastando ? 'border-marca-forte bg-superficie' : 'border-borda-forte bg-superficie-suave'
        }`}
      >
        <p className="font-sans text-base font-semibold text-conteudo">Solte aqui as pastas dos pacientes</p>
        <p className="text-sm text-conteudo-suave">JPG, PNG, WebP ou HEIC (iPhone). Até {MAXIMO_FOTOS} fotos por pasta. As fotos ficam privadas até você publicar.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={botao} disabled={!!progresso} onClick={() => pastas.current?.click()}>Escolher pastas</button>
          <button type="button" className={botao} disabled={!!progresso} onClick={() => avulsas.current?.click()}>Escolher fotos de um paciente</button>
        </div>
        <input
          ref={pastas}
          type="file"
          multiple
          className="hidden"
          // Seleção de pasta inteira (Chrome, Edge, Safari, Firefox).
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
          onChange={(e) => {
            const lista = [...(e.target.files ?? [])]
            e.target.value = ''
            void importar(lista)
          }}
        />
        <input
          ref={avulsas}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            const lista = [...(e.target.files ?? [])]
            e.target.value = ''
            void importar(lista)
          }}
        />
        {progresso && <p role="status" className="text-sm font-medium text-conteudo">{progresso}</p>}
      </div>

      {avisos.length > 0 && (
        <ul role="status" className="space-y-1 rounded-card border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      )}

      {erro && <p role="alert" className="rounded-card border border-red-300 bg-red-50 p-3 text-sm text-red-800">{erro}</p>}

      <section>
        <h3 className="text-base font-semibold text-conteudo">Casos e autorizações</h3>
        <div className="mt-3 overflow-x-auto rounded-lg border border-borda bg-superficie">
          <table className="w-full min-w-[660px] text-left text-xs">
            <thead className="border-b border-borda bg-superficie-suave text-conteudo-suave">
              <tr>{['Caso','Análise das fotos','Autorização','Publicação','Ações'].map(t=><th key={t} className="px-4 py-3 font-medium">{t}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {casos.map(caso=><tr key={caso.id}>
                <td className="px-4 py-4"><strong className="block font-semibold">{caso.nome}</strong><small className="text-conteudo-suave">{new Date(caso.criado_em).toLocaleDateString('pt-BR')}</small></td>
                <td className="px-4 py-4">{rotuloStatus[caso.status]}</td>
                <td className="px-4 py-4"><span className={`inline-block rounded-md px-2 py-1 ${caso.autorizacao_paciente?'bg-stone-100 text-stone-700':'bg-amber-50 text-amber-800'}`}>{caso.autorizacao_paciente?'Autorização registrada':'Autorização pendente'}</span></td>
                <td className="px-4 py-4">{noSite===caso.id?'Publicado no site':'Não publicado'}</td>
                <td className="px-4 py-4"><button type="button" className={botao} onClick={()=>setAberto(caso.id)}>Revisar caso</button></td>
              </tr>)}
            </tbody>
          </table>
          {casos.length===0&&<p className="px-4 py-8 text-center text-sm text-conteudo-suave">Nenhum caso importado. Adicione as fotos para iniciar a revisão.</p>}
        </div>
      </section>
    </div>
  )
}
