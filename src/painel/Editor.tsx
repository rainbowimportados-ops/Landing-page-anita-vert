import { useEffect, useState } from 'react'
import {
  clinica as clinicaPadrao,
  faq as faqPadrao,
  rodapeLegal as rodapeLegalPadrao,
  unidades as unidadesPadrao,
} from '../config/site'
import { SLUG, type Ajustes } from '../lib/conteudo'
import { supabase } from './supabase'

type Estado = 'carregando' | 'pronto' | 'salvando' | 'salvo' | 'erro'

const rotulo = 'block text-sm font-medium text-conteudo'
const campo =
  'mt-1.5 w-full rounded-lg border border-borda-forte bg-superficie px-3 py-2.5 text-sm text-conteudo'

export function Editor({ email, aoSair }: { email: string; aoSair: () => void }) {
  const [ajustes, setAjustes] = useState<Ajustes>({})
  const [estado, setEstado] = useState<Estado>('carregando')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('landing_content')
      .select('content')
      .eq('slug', SLUG)
      .maybeSingle()
      .then(({ data }) => {
        setAjustes((data?.content as Ajustes) ?? {})
        setEstado('pronto')
      })
  }, [])

  async function salvar() {
    setEstado('salvando')
    setErro(null)
    const { error } = await supabase
      .from('landing_content')
      .upsert({ slug: SLUG, content: ajustes, updated_at: new Date().toISOString() })

    if (error) {
      // O RLS recusa quem não está em digital_card_admins.
      setErro(
        error.message.includes('row-level security')
          ? 'Sua conta não tem permissão para editar este conteúdo.'
          : error.message,
      )
      setEstado('erro')
      return
    }
    setEstado('salvo')
    setTimeout(() => setEstado('pronto'), 2500)
  }

  function definirUnidade(slug: string, campo: string, valor: string | string[]) {
    setAjustes((a) => ({
      ...a,
      unidades: { ...a.unidades, [slug]: { ...a.unidades?.[slug], [campo]: valor } },
    }))
  }

  if (estado === 'carregando') {
    return <p className="container-vert py-20 text-sm text-conteudo-suave">Carregando…</p>
  }

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
              onClick={aoSair}
              className="inline-flex min-h-[44px] items-center rounded-full border border-borda-forte px-4 text-sm font-medium text-conteudo"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container-vert max-w-3xl space-y-10 py-10">
        <p className="lead">
          Estes campos substituem o que está no código. Deixe em branco para manter o texto
          padrão. A página é atualizada assim que você salva.
        </p>

        <section>
          <h2 className="titulo-secao">Contato</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ['whatsappComercial', 'WhatsApp comercial', '55 + DDD + número'],
              ['whatsappAtendimento', 'WhatsApp do atendimento', '55 + DDD + número'],
              ['instagram', 'Instagram (URL)', ''],
              ['email', 'E-mail de contato', ''],
            ] as const).map(([chave, texto, dica]) => (
              <div key={chave}>
                <label className={rotulo} htmlFor={chave}>
                  {texto}
                </label>
                <input
                  id={chave}
                  className={campo}
                  placeholder={clinicaPadrao[chave]}
                  value={ajustes.clinica?.[chave] ?? ''}
                  onChange={(e) =>
                    setAjustes((a) => ({
                      ...a,
                      clinica: { ...a.clinica, [chave]: e.target.value },
                    }))
                  }
                />
                {dica && <p className="mt-1 text-xs text-conteudo-tenue">{dica}</p>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="titulo-secao">Unidades</h2>
          <div className="mt-5 space-y-8">
            {unidadesPadrao.map((unidade) => (
              <div key={unidade.slug} className="rounded-card border border-borda bg-superficie p-5">
                <h3 className="font-display text-lg text-conteudo">{unidade.nome}</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={rotulo}>Endereço completo</label>
                    <input
                      className={campo}
                      placeholder={unidade.endereco}
                      value={ajustes.unidades?.[unidade.slug]?.endereco ?? ''}
                      onChange={(e) => definirUnidade(unidade.slug, 'endereco', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={rotulo}>Horários (um por linha)</label>
                    <textarea
                      className={campo}
                      rows={3}
                      placeholder={unidade.horarios.join('\n')}
                      value={(ajustes.unidades?.[unidade.slug]?.horarios ?? []).join('\n')}
                      onChange={(e) =>
                        definirUnidade(
                          unidade.slug,
                          'horarios',
                          e.target.value.split('\n').filter((l) => l.trim()),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className={rotulo}>Link do Google Maps</label>
                    <input
                      className={campo}
                      placeholder="Sem isto, o botão “Como chegar” não aparece"
                      value={ajustes.unidades?.[unidade.slug]?.mapsUrl ?? ''}
                      onChange={(e) => definirUnidade(unidade.slug, 'mapsUrl', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={rotulo}>WhatsApp desta unidade</label>
                    <input
                      className={campo}
                      placeholder={unidade.whatsapp}
                      value={ajustes.unidades?.[unidade.slug]?.whatsapp ?? ''}
                      onChange={(e) => definirUnidade(unidade.slug, 'whatsapp', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="titulo-secao">Perguntas frequentes</h2>
          <div className="mt-5 space-y-5">
            {faqPadrao.map((item) => (
              <div key={item.pergunta}>
                <label className={rotulo}>{item.pergunta}</label>
                <textarea
                  className={campo}
                  rows={3}
                  placeholder={item.resposta}
                  value={ajustes.faq?.[item.pergunta] ?? ''}
                  onChange={(e) =>
                    setAjustes((a) => ({
                      ...a,
                      faq: { ...a.faq, [item.pergunta]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="titulo-secao">Rodapé legal</h2>
          <p className="lead mt-2">
            Razão social, CNPJ e responsável técnico com CRO. Exigido pela resolução do CFO para
            publicidade odontológica. Em branco, vale o texto padrão mostrado abaixo.
          </p>
          <textarea
            className={`${campo} mt-4`}
            rows={2}
            placeholder={rodapeLegalPadrao}
            value={ajustes.rodapeLegal ?? ''}
            onChange={(e) => setAjustes((a) => ({ ...a, rodapeLegal: e.target.value }))}
          />
        </section>

        <section>
          <h2 className="titulo-secao">Depoimentos</h2>
          <p className="lead mt-2">
            A seção só aparece quando houver ao menos um depoimento. Use apenas depoimentos reais,
            com autorização do paciente.
          </p>
          <div className="mt-5 space-y-4">
            {(ajustes.depoimentos ?? []).map((dep, i) => (
              <div key={i} className="rounded-card border border-borda bg-superficie p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={campo}
                    placeholder="Nome do paciente"
                    value={dep.nome}
                    onChange={(e) =>
                      setAjustes((a) => {
                        const lista = [...(a.depoimentos ?? [])]
                        lista[i] = { ...lista[i], nome: e.target.value }
                        return { ...a, depoimentos: lista }
                      })
                    }
                  />
                  <input
                    className={campo}
                    placeholder="Tratamento realizado"
                    value={dep.tratamento}
                    onChange={(e) =>
                      setAjustes((a) => {
                        const lista = [...(a.depoimentos ?? [])]
                        lista[i] = { ...lista[i], tratamento: e.target.value }
                        return { ...a, depoimentos: lista }
                      })
                    }
                  />
                </div>
                <textarea
                  className={`${campo} mt-3`}
                  rows={3}
                  placeholder="Depoimento"
                  value={dep.texto}
                  onChange={(e) =>
                    setAjustes((a) => {
                      const lista = [...(a.depoimentos ?? [])]
                      lista[i] = { ...lista[i], texto: e.target.value }
                      return { ...a, depoimentos: lista }
                    })
                  }
                />
                <button
                  onClick={() =>
                    setAjustes((a) => ({
                      ...a,
                      depoimentos: (a.depoimentos ?? []).filter((_, j) => j !== i),
                    }))
                  }
                  className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-red-700"
                >
                  Remover depoimento
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setAjustes((a) => ({
                  ...a,
                  depoimentos: [...(a.depoimentos ?? []), { nome: '', texto: '', tratamento: '' }],
                }))
              }
              className="inline-flex min-h-[44px] items-center rounded-full border border-borda-forte px-5 text-sm font-medium text-conteudo"
            >
              Adicionar depoimento
            </button>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-borda bg-superficie/95 backdrop-blur">
        <div className="container-vert flex max-w-3xl items-center justify-between gap-4 py-3">
          <p role="status" className="text-sm text-conteudo-suave">
            {estado === 'salvo' && 'Salvo. A página já reflete a mudança.'}
            {estado === 'salvando' && 'Salvando…'}
            {estado === 'erro' && <span className="text-red-700">{erro}</span>}
          </p>
          <button
            onClick={salvar}
            disabled={estado === 'salvando'}
            className="inline-flex min-h-[44px] items-center rounded-full bg-marca-forte px-6 text-sm font-semibold text-conteudo-inverso transition duration-padrao active:scale-[0.98] disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
