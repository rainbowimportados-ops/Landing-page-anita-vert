import { useEffect, useState, type ReactNode } from 'react'
import {
  clinica as clinicaPadrao,
  faq as faqPadrao,
  rodapeLegal as rodapeLegalPadrao,
  unidades as unidadesPadrao,
} from '../config/site'
import { SLUG, type Ajustes } from '../lib/conteudo'
import { CampoImagem } from './CampoImagem'
import { supabase } from './supabase'

type Estado = 'carregando' | 'pronto' | 'salvando' | 'salvo' | 'erro'

const rotulo = 'block text-sm font-medium text-conteudo'
const campo =
  'mt-1.5 w-full rounded-lg border border-borda-forte bg-superficie px-3 py-2.5 text-sm text-conteudo'

export function Editor({ email, aoSair, abas }: { email: string; aoSair: () => void; abas?: ReactNode }) {
  const integrado = new URLSearchParams(window.location.search).has('embed')
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
        const vindos = (data?.content as Ajustes) ?? {}
        setAjustes(vindos)
        setEstado('pronto')
      })
  }, [])

  async function salvar() {
    setEstado('salvando')
    setErro(null)

    const paraSalvar: Ajustes = { ...ajustes }

    // O caso de antes e depois é publicado pela aba Casos: preserva o que está no
    // banco agora, para salvar aqui nunca desfazer uma publicação feita depois
    // que esta tela abriu.
    const { data: atual } = await supabase.from('landing_content').select('content').eq('slug', SLUG).maybeSingle()
    paraSalvar.resultados = (atual?.content as Ajustes | undefined)?.resultados ?? null

    const { error } = await supabase
      .from('landing_content')
      .upsert({ slug: SLUG, content: paraSalvar, updated_at: new Date().toISOString() })

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
    <div className={`${integrado ? 'min-h-full' : 'min-h-dvh'} bg-fundo pb-28`}>
      {!integrado && <header className="border-b border-borda bg-superficie">
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
        {abas}
      </header>}

      <main className="container-vert max-w-3xl space-y-10 py-6">
        <p className="lead">
          Estes campos substituem o que está no código. Deixe em branco para manter o texto
          padrão. A página é atualizada assim que você salva.
        </p>

        <section>
          <h2 className="titulo-secao">Contato</h2>
          <p className="mt-2 rounded-card border border-borda bg-superficie-suave p-4 text-sm text-conteudo-suave">
            WhatsApp da clínica, Instagram (da clínica e da Dra. Anita), endereço e WhatsApp das
            unidades ficam em <strong>WhatsApp e contatos</strong> e <strong>Unidades</strong> e valem
            para o site e o cartão. Aqui ficam só o e-mail e um WhatsApp de atendimento, se for diferente.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ['whatsappAtendimento', 'WhatsApp do atendimento (se diferente)', '55 + DDD + número'],
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
          <h2 className="titulo-secao">Horários das unidades</h2>
          <div className="mt-5 space-y-8">
            {unidadesPadrao.map((unidade) => (
              <div key={unidade.slug} className="rounded-card border border-borda bg-superficie p-5">
                <h3 className="font-display text-lg text-conteudo">{unidade.nome}</h3>
                <div className="mt-4 space-y-4">
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
          <h2 className="titulo-secao">Campanha em destaque</h2>
          <p className="lead mt-2">
            Um banner logo abaixo do topo. Fica oculto enquanto não houver imagem nem título.
          </p>
          <div className="mt-5 space-y-4">
            <CampoImagem
              rotulo="Imagem do banner"
              pasta="campanhas"
              valor={ajustes.banner?.imagem}
              aoMudar={(url) => setAjustes((a) => ({ ...a, banner: { ...a.banner, imagem: url } }))}
            />
            <div>
              <label className={rotulo}>Título</label>
              <input
                className={campo}
                value={ajustes.banner?.titulo ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({ ...a, banner: { ...a.banner, titulo: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className={rotulo}>Texto</label>
              <textarea
                className={campo}
                rows={2}
                value={ajustes.banner?.texto ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({ ...a, banner: { ...a.banner, texto: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className={rotulo}>Link ao clicar</label>
              <input
                className={campo}
                placeholder="Deixe vazio para o banner não ser clicável"
                value={ajustes.banner?.link ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({ ...a, banner: { ...a.banner, link: e.target.value } }))
                }
              />
            </div>
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

        <section className="rounded-card border border-borda bg-superficie-suave p-5 text-sm text-conteudo-suave">
          <h2 className="font-display text-lg text-conteudo">O que fica em outras áreas</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li><strong>Depoimentos</strong>: em Depoimentos, no menu do painel. Valem para o site e o cartão.</li>
            <li><strong>Fotos de antes e depois</strong>: em Antes e depois. O caso publicado aparece no site e no cartão.</li>
            <li><strong>WhatsApp, Instagram e endereços</strong>: em WhatsApp e contatos e em Unidades.</li>
            <li><strong>Logotipo e foto do topo</strong>: em Dados da empresa (cartão). O site usa a identidade fixa do layout.</li>
          </ul>
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
