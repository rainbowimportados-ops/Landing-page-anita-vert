import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { MAXIMO_FOTOS, agruparPorPasta, analisarCaso, arquivosDoArraste, casoNoSite, importarCaso, listarCasos, type Caso } from './dados'
import { RevisarCaso } from './RevisarCaso'

const botao = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-borda-forte px-4 text-sm font-medium text-conteudo disabled:opacity-50'

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
    <div className={integrado ? 'space-y-6' : 'space-y-8'}>
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
        className={`grid place-items-center gap-3 rounded-card border-2 border-dashed p-8 text-center transition-colors ${
          arrastando ? 'border-marca-forte bg-superficie' : 'border-borda-forte bg-superficie-suave'
        }`}
      >
        <p className="font-display text-xl text-conteudo">Solte aqui as pastas dos pacientes</p>
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
        <h3 className="font-display text-2xl text-conteudo">Casos importados</h3>
        {casos.length === 0 ? (
          <p className="mt-3 text-sm text-conteudo-suave">Nenhum caso ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-borda rounded-card border border-borda bg-superficie">
            {casos.map((caso) => (
              <li key={caso.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-conteudo">{caso.nome}</p>
                  <p className="text-xs text-conteudo-suave">
                    {new Date(caso.criado_em).toLocaleDateString('pt-BR')} · {rotuloStatus[caso.status]}
                    {caso.autorizacao_paciente ? ' · autorização ok' : ''}
                  </p>
                </div>
                {noSite === caso.id && <span className="rounded-full bg-marca-forte px-3 py-1 text-xs font-semibold text-conteudo-inverso">No site</span>}
                <button type="button" className={botao} onClick={() => setAberto(caso.id)}>Abrir</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
