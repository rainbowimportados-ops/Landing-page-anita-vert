import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { ComparadorAlinhado } from '../../components/ComparadorAlinhado'
import { rotuloAngulo, type Angulo } from '../../lib/casos'
import {
  analisarCaso,
  atualizarCaso,
  atualizarFoto,
  carregarCaso,
  casoNoSite,
  despublicar,
  excluirCaso,
  publicarCaso,
  type Caso,
  type FotoVista,
  type ParEscolhido,
} from './dados'

const angulos = Object.keys(rotuloAngulo) as Angulo[]
const botao = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-borda-forte px-4 text-sm font-medium text-conteudo disabled:opacity-50'
const botaoForte = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-marca-forte px-5 text-sm font-semibold text-conteudo-inverso disabled:opacity-50'
const seletor = 'min-h-[40px] rounded-lg border border-borda-forte bg-superficie px-2 text-sm text-conteudo'

type Par = ParEscolhido & { chave: string; antes: FotoVista; depois: FotoVista }

/**
 * Revisão de um caso: a IA já sugeriu antes/depois, ângulo e dentes; aqui a
 * pessoa confere na prévia (o mesmo comparador do site), corrige com um toque
 * e publica.
 */
export function RevisarCaso({ id, aoVoltar }: { id: string; aoVoltar: () => void }) {
  const [caso, setCaso] = useState<Caso | null>(null)
  const [fotos, setFotos] = useState<FotoVista[]>([])
  const [noSite, setNoSite] = useState<string | null>(null)
  const [fora, setFora] = useState<Set<string>>(new Set())
  const [destaque, setDestaque] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const recarregar = useCallback(async () => {
    const [dados, atual] = await Promise.all([carregarCaso(id), casoNoSite()])
    setCaso(dados.caso)
    setFotos(dados.fotos)
    setNoSite(atual)
  }, [id])

  useEffect(() => {
    recarregar().catch((e: Error) => setAviso({ tipo: 'erro', texto: e.message }))
  }, [recarregar])

  // Pares completos (um antes e um depois com o mesmo "par") e o que sobrou.
  const { pares, soltas } = useMemo(() => {
    const grupos = new Map<string, FotoVista[]>()
    for (const f of fotos) if (f.par) grupos.set(f.par, [...(grupos.get(f.par) ?? []), f])
    const pares: Par[] = []
    const usadas = new Set<string>()
    for (const [chave, grupo] of [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }))) {
      const antes = grupo.find((f) => f.momento === 'antes')
      const depois = grupo.find((f) => f.momento === 'depois')
      if (antes && depois) {
        pares.push({ chave, angulo: depois.angulo ?? antes.angulo ?? 'frente', antes, depois })
        usadas.add(antes.id).add(depois.id)
      }
    }
    return { pares, soltas: fotos.filter((f) => !usadas.has(f.id)) }
  }, [fotos])

  // Destaque sugerido: um par de frente, de preferência o de maior confiança.
  const chaveDestaque = destaque ?? [...pares].sort((a, b) => {
    const nota = (p: Par) => (p.angulo === 'frente' ? 1 : 0) + ((p.antes.confianca ?? 0) + (p.depois.confianca ?? 0)) / 4
    return nota(b) - nota(a)
  })[0]?.chave ?? null

  async function mudarFoto(foto: FotoVista, campos: Partial<FotoVista>) {
    setFotos((lista) => lista.map((f) => (f.id === foto.id ? { ...f, ...campos } : f)))
    const { url: _u, urlMini: _m, ...persistir } = campos
    try {
      await atualizarFoto(foto.id, persistir)
    } catch (e) {
      setAviso({ tipo: 'erro', texto: (e as Error).message })
    }
  }

  function marcarDentes(foto: FotoVista, evento: MouseEvent<HTMLButtonElement>) {
    const area = evento.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (evento.clientX - area.left) / area.width))
    const y = Math.min(1, Math.max(0, (evento.clientY - area.top) / area.height))
    void mudarFoto(foto, { dentes_x: x, dentes_y: y, ajustado_manualmente: true })
  }

  async function executar(rotulo: string, acao: () => Promise<string | void>) {
    setOcupado(rotulo)
    setAviso(null)
    try {
      const mensagem = await acao()
      if (mensagem) setAviso({ tipo: 'ok', texto: mensagem })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: (e as Error).message })
    } finally {
      setOcupado(null)
    }
  }

  if (!caso) {
    return <p className="py-10 text-sm text-conteudo-suave">{aviso?.texto ?? 'Carregando caso…'}</p>
  }

  const incluidos = pares.filter((p) => !fora.has(p.chave))
  const parDestaque = pares.find((p) => p.chave === chaveDestaque)
  const semDentes = incluidos.filter((p) => p.antes.dentes_x == null || p.depois.dentes_x == null)
  const podePublicar = caso.autorizacao_paciente && !!parDestaque && !fora.has(parDestaque.chave) && semDentes.length === 0
  const proximaChave = `p${Math.max(0, ...fotos.map((f) => Number(f.par?.slice(1)) || 0)) + 1}`

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={aoVoltar} className="text-sm text-conteudo-suave underline underline-offset-4">← Todos os casos</button>
        {noSite === caso.id && <span className="rounded-full bg-marca-forte px-3 py-1 text-xs font-semibold text-conteudo-inverso">No site agora</span>}
      </div>

      <header>
        <h2 className="titulo-secao">{caso.nome}</h2>
        <p className="mt-1 text-sm text-conteudo-suave">
          {fotos.length} fotos · {pares.length} {pares.length === 1 ? 'par' : 'pares'} formados
          {caso.status === 'analisando' && ' · análise em andamento'}
        </p>
        {caso.status === 'erro' && caso.erro_analise && (
          <p className="mt-3 rounded-card border border-red-300 bg-red-50 p-3 text-sm text-red-800">{caso.erro_analise}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={botao}
            disabled={!!ocupado}
            onClick={() => executar('analisar', async () => {
              const r = await analisarCaso(caso.id)
              setDestaque(null)
              await recarregar()
              return `A IA analisou ${r.fotos} fotos e formou ${r.pares} ${r.pares === 1 ? 'par' : 'pares'}. Confira abaixo.`
            })}
          >
            {ocupado === 'analisar' ? 'Analisando… (até 1 minuto)' : caso.analisado_em ? 'Analisar de novo com IA' : 'Analisar com IA'}
          </button>
        </div>
      </header>

      {aviso && (
        <p role="status" className={`rounded-card border p-3 text-sm ${aviso.tipo === 'ok' ? 'border-green-300 bg-green-50 text-green-900' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {aviso.texto}
        </p>
      )}

      {pares.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-display text-2xl text-conteudo">Pares de antes e depois</h3>
          <p className="text-sm text-conteudo-suave">
            Arraste na prévia para conferir: os dentes devem ficar no mesmo lugar. Se não ficarem, toque no ponto entre os dois
            dentes da frente de cima, na foto de antes e na de depois.
          </p>
          {pares.map((par) => (
            <article key={par.chave} className="grid gap-5 rounded-card border border-borda bg-superficie p-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
              <ComparadorAlinhado
                par={{
                  antes: { src: par.antes.url, largura: par.antes.largura, altura: par.antes.altura, dentes: { x: par.antes.dentes_x ?? 0.5, y: par.antes.dentes_y ?? 0.5 } },
                  depois: { src: par.depois.url, largura: par.depois.largura, altura: par.depois.altura, dentes: { x: par.depois.dentes_x ?? 0.5, y: par.depois.dentes_y ?? 0.5 } },
                }}
                titulo={`Prévia ${par.chave}`}
                proporcao={par.angulo === 'sorriso' ? undefined : 0.8}
                creditos={false}
              />
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className={seletor}
                    value={par.angulo}
                    onChange={(e) => {
                      const angulo = e.target.value as Angulo
                      void mudarFoto(par.antes, { angulo })
                      void mudarFoto(par.depois, { angulo })
                    }}
                    aria-label="Ângulo do par"
                  >
                    {angulos.map((a) => <option key={a} value={a}>{rotuloAngulo[a]}</option>)}
                  </select>
                  <button
                    type="button"
                    className={botao}
                    onClick={() => {
                      void mudarFoto(par.antes, { momento: 'depois' })
                      void mudarFoto(par.depois, { momento: 'antes' })
                    }}
                  >
                    Trocar antes ↔ depois
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([['Antes', par.antes], ['Depois', par.depois]] as const).map(([rotulo, foto]) => (
                    <div key={foto.id}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-conteudo-suave">
                        {rotulo}
                        {foto.dentes_x == null && <span className="ml-2 normal-case text-red-700">marque os dentes</span>}
                        {foto.ajustado_manualmente && <span className="ml-2 normal-case text-conteudo-tenue">ajustado</span>}
                      </p>
                      <button
                        type="button"
                        className="relative block w-full cursor-crosshair overflow-hidden rounded-lg"
                        onClick={(e) => marcarDentes(foto, e)}
                        aria-label={`Marcar os dentes na foto de ${rotulo.toLowerCase()} (${foto.arquivo})`}
                      >
                        <img src={foto.url} alt="" className="block w-full" />
                        {foto.dentes_x != null && foto.dentes_y != null && (
                          <span
                            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500/70 shadow"
                            style={{ left: `${foto.dentes_x * 100}%`, top: `${foto.dentes_y * 100}%` }}
                          />
                        )}
                      </button>
                      <p className="mt-1 truncate text-xs text-conteudo-tenue">{foto.arquivo}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-conteudo">
                  <label className="inline-flex min-h-[44px] items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!fora.has(par.chave)}
                      onChange={(e) => setFora((s) => { const n = new Set(s); if (e.target.checked) n.delete(par.chave); else n.add(par.chave); return n })}
                    />
                    Mostrar no site
                  </label>
                  <label className="inline-flex min-h-[44px] items-center gap-2">
                    <input type="radio" name="destaque" checked={chaveDestaque === par.chave} onChange={() => setDestaque(par.chave)} />
                    Usar como caso em destaque
                  </label>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {soltas.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-display text-2xl text-conteudo">Fotos sem par</h3>
          <p className="text-sm text-conteudo-suave">
            Diga se é antes ou depois e junte com a outra foto do mesmo ângulo escolhendo o mesmo par.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {soltas.map((foto) => (
              <li key={foto.id} className="rounded-card border border-borda bg-superficie p-3">
                <img src={foto.urlMini} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" />
                <p className="mt-2 truncate text-xs text-conteudo-tenue">{foto.arquivo}</p>
                <div className="mt-2 grid gap-2">
                  <select className={seletor} value={foto.momento ?? ''} onChange={(e) => void mudarFoto(foto, { momento: (e.target.value || null) as FotoVista['momento'] })} aria-label="Antes ou depois">
                    <option value="">Antes ou depois?</option>
                    <option value="antes">Antes</option>
                    <option value="depois">Depois</option>
                  </select>
                  <select className={seletor} value={foto.angulo ?? ''} onChange={(e) => void mudarFoto(foto, { angulo: (e.target.value || null) as Angulo | null })} aria-label="Ângulo">
                    <option value="">Ângulo?</option>
                    {angulos.map((a) => <option key={a} value={a}>{rotuloAngulo[a]}</option>)}
                  </select>
                  <select className={seletor} value={foto.par ?? ''} onChange={(e) => void mudarFoto(foto, { par: e.target.value || null })} aria-label="Par">
                    <option value="">Sem par</option>
                    {[...new Set([...fotos.map((f) => f.par).filter(Boolean) as string[], proximaChave])].map((p) => (
                      <option key={p} value={p}>{p === proximaChave ? `Novo par (${p})` : `Par ${p}`}</option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4 rounded-card border border-borda-forte bg-superficie p-5">
        <h3 className="font-display text-2xl text-conteudo">Publicar no site</h3>
        <label className="flex items-start gap-3 text-sm text-conteudo">
          <input
            type="checkbox"
            className="mt-1"
            checked={caso.autorizacao_paciente}
            onChange={(e) => executar('autorizacao', async () => {
              const marcado = e.target.checked
              await atualizarCaso(caso.id, { autorizacao_paciente: marcado, autorizado_em: marcado ? new Date().toISOString() : null })
              setCaso({ ...caso, autorizacao_paciente: marcado })
            })}
          />
          <span>
            Tenho o termo de autorização de uso de imagem assinado pelo paciente para divulgação no site, como exige o CFO.
          </span>
        </label>
        <ul className="list-disc space-y-1 pl-5 text-sm text-conteudo-suave">
          <li>{incluidos.length} {incluidos.length === 1 ? 'par vai' : 'pares vão'} para o site{parDestaque ? `; destaque: ${rotuloAngulo[parDestaque.angulo].toLowerCase()} (${parDestaque.chave})` : ''}.</li>
          {semDentes.length > 0 && <li className="text-red-700">Marque os dentes em {semDentes.length} {semDentes.length === 1 ? 'par' : 'pares'} antes de publicar.</li>}
          {!parDestaque && <li className="text-red-700">Forme pelo menos um par de antes e depois.</li>}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={botaoForte}
            disabled={!podePublicar || !!ocupado}
            onClick={() => {
              if (!parDestaque || !window.confirm('Trocar os resultados do site por este caso?')) return
              void executar('publicar', async () => {
                await publicarCaso(caso, incluidos, parDestaque)
                await recarregar()
                return 'Publicado. O site já mostra este caso na seção Resultados.'
              })
            }}
          >
            {ocupado === 'publicar' ? 'Publicando…' : noSite === caso.id ? 'Atualizar no site' : 'Publicar no site'}
          </button>
          {noSite === caso.id && (
            <button
              type="button"
              className={botao}
              disabled={!!ocupado}
              onClick={() => window.confirm('Tirar este caso do site e voltar às fotos padrão?') && void executar('despublicar', async () => {
                await despublicar()
                await recarregar()
                return 'O site voltou às fotos padrão.'
              })}
            >
              Tirar do site
            </button>
          )}
          <button
            type="button"
            className={`${botao} ml-auto border-red-300 text-red-700`}
            disabled={!!ocupado || noSite === caso.id}
            title={noSite === caso.id ? 'Tire do site antes de excluir' : undefined}
            onClick={() => window.confirm('Excluir este caso e as fotos dele? Não dá para desfazer.') && void executar('excluir', async () => {
              await excluirCaso(caso.id)
              aoVoltar()
            })}
          >
            Excluir caso
          </button>
        </div>
      </section>
    </div>
  )
}
