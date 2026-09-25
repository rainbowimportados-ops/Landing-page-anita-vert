import { createContext, useCallback, useContext, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { enviarLead, telefoneValido, type Intencao } from '../lib/captura'
import { IconWhatsApp } from './Icon'

export type PedidoCaptura = {
  /** Interesse revelado pelo clique; não é perguntado de novo. */
  intencao: Intencao
  /** Unidade já escolhida pelo botão; quando nula, o modal pergunta. */
  unidade?: string | null
  /** Identificador do botão, o mesmo gravado em link_clicks. */
  cta: string
  /** Número e mensagem do WhatsApp que o botão abria antes. */
  numero: string
  mensagem: string
}

type Abrir = (pedido: PedidoCaptura) => void
const Contexto = createContext<Abrir>(() => {})

export function useCaptura(): Abrir {
  return useContext(Contexto)
}

const titulos: Record<Intencao, string> = {
  avaliacao: 'Agendar avaliação',
  lentes: 'Lentes em resina',
  estetica: 'Estética do sorriso',
  ortodontia: 'Ortodontia',
  implante: 'Próteses e implantes',
  curso: 'Cursos e imersões',
  locacao: 'Locação de consultório',
}

const profissional = (intencao: Intencao) => intencao === 'curso' || intencao === 'locacao'

type Erros = Partial<Record<'nome' | 'telefone' | 'unidade' | 'geral', string>>

/**
 * Fluxo de captação da landing: botão → modal → lead salvo → WhatsApp.
 * Se o banco falhar ou demorar, o WhatsApp abre mesmo assim: o paciente
 * nunca perde o contato por causa da captação.
 */
export function ProvedorDeCaptura({ children }: { children: ReactNode }) {
  const { clinica, unidades } = useConteudo()
  const dialogo = useRef<HTMLDialogElement>(null)
  const [pedido, setPedido] = useState<PedidoCaptura | null>(null)
  const [unidade, setUnidade] = useState<string>('')
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const idBase = useId()

  const abrir = useCallback<Abrir>((novo) => {
    setPedido(novo)
    setUnidade(novo.unidade ?? '')
    setErros({})
    setEnviando(false)
    registrarClique(novo.cta, novo.unidade ?? null)
    dialogo.current?.showModal()
  }, [])

  function fechar() {
    dialogo.current?.close()
  }

  function abrirWhatsApp(numero: string, mensagem: string) {
    window.location.assign(linkWhatsApp(numero, mensagem))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!pedido || enviando) return
    const dados = new FormData(evento.currentTarget)
    const nome = String(dados.get('nome') ?? '').trim()
    const telefone = String(dados.get('telefone') ?? '').trim()
    const profissao = String(dados.get('profissao') ?? '').trim()
    const cidade = String(dados.get('cidade') ?? '').trim()

    const novosErros: Erros = {}
    if (nome.length < 2) novosErros.nome = 'Informe seu nome.'
    if (!telefoneValido(telefone)) novosErros.telefone = 'Informe o WhatsApp com DDD, por exemplo (16) 99999-9999.'
    if (!profissional(pedido.intencao) && !pedido.unidade && !unidade)
      novosErros.unidade = 'Escolha uma unidade ou "Ainda não sei".'
    setErros(novosErros)
    if (Object.keys(novosErros).length) return

    const escolhida = unidade && unidade !== 'indefinida' ? unidade : null
    const dadosUnidade = unidades.find((u) => u.slug === escolhida)
    setEnviando(true)
    const resultado = await enviarLead({
      nome,
      telefone,
      intencao: pedido.intencao,
      unidade: escolhida,
      profissao: profissao || undefined,
      cidade: cidade || undefined,
      rotulo: `Site — ${titulos[pedido.intencao]}${dadosUnidade ? ` (${dadosUnidade.cidade.split(' /')[0]})` : ''}`,
      cta: pedido.cta,
    })

    if (!resultado.ok && (resultado.erro === 'nome' || resultado.erro === 'telefone')) {
      setEnviando(false)
      setErros({ [resultado.erro]: resultado.erro === 'nome' ? 'Confira o nome.' : 'Confira o número com DDD.' })
      return
    }
    registrarClique(`${pedido.cta}_lead`, escolhida)

    const numero = dadosUnidade?.whatsapp ?? pedido.numero
    const primeiroNome = nome.split(/\s+/)[0]
    const complemento = dadosUnidade && !pedido.unidade ? ` Prefiro a unidade de ${dadosUnidade.cidade.split(' /')[0]}.` : ''
    abrirWhatsApp(numero, `${pedido.mensagem.replace(/^Olá!/, `Olá! Sou ${primeiroNome}.`)}${complemento}`)
  }

  const eProfissional = pedido ? profissional(pedido.intencao) : false
  const perguntarUnidade = pedido && !eProfissional && !pedido.unidade

  return (
    <Contexto.Provider value={abrir}>
      {children}
      <dialog
        ref={dialogo}
        aria-labelledby={`${idBase}-titulo`}
        aria-describedby={`${idBase}-descricao`}
        className="captura w-[min(100%-2rem,28rem)] rounded-2xl border border-borda bg-fundo p-0 text-conteudo shadow-3"
        onClose={() => setPedido(null)}
      >
        {pedido && (
          <form
            onSubmit={enviar}
            onInput={(evento) => {
              // Some o aviso do campo assim que a pessoa começa a corrigi-lo.
              const campo = (evento.target as HTMLInputElement).name as keyof Erros
              if (erros[campo]) setErros(({ [campo]: _removido, ...resto }) => resto)
            }}
            noValidate
            className="grid gap-5 p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`${idBase}-titulo`} className="font-display text-3xl leading-tight">
                  {titulos[pedido.intencao]}
                </h2>
                <p id={`${idBase}-descricao`} className="mt-2 text-sm leading-relaxed text-conteudo-suave">
                  Deixe seu contato e a conversa abre no WhatsApp da equipe, já com o seu nome.
                </p>
              </div>
              <button
                type="button"
                onClick={fechar}
                className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl text-conteudo-tenue hover-fino:hover:bg-superficie-suave"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <Campo id={`${idBase}-nome`} rotulo="Nome" erro={erros.nome}>
              <input id={`${idBase}-nome`} name="nome" autoComplete="name" maxLength={100} required
                aria-invalid={!!erros.nome} aria-describedby={erros.nome ? `${idBase}-nome-erro` : undefined} />
            </Campo>

            <Campo id={`${idBase}-telefone`} rotulo="WhatsApp com DDD" erro={erros.telefone}>
              <input id={`${idBase}-telefone`} name="telefone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20}
                placeholder="(16) 99999-9999" required aria-invalid={!!erros.telefone}
                aria-describedby={erros.telefone ? `${idBase}-telefone-erro` : undefined} />
            </Campo>

            {perguntarUnidade && (
              <fieldset aria-describedby={erros.unidade ? `${idBase}-unidade-erro` : undefined}>
                <legend className="text-sm font-medium">Unidade</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...unidades.map((u) => ({ valor: u.slug, texto: u.cidade.split(' /')[0] })), { valor: 'indefinida', texto: 'Ainda não sei' }].map((opcao) => (
                    <label key={opcao.valor} className="captura__opcao">
                      <input type="radio" name="unidade" value={opcao.valor} checked={unidade === opcao.valor}
                        onChange={() => setUnidade(opcao.valor)} />
                      <span>{opcao.texto}</span>
                    </label>
                  ))}
                </div>
                {erros.unidade && <p id={`${idBase}-unidade-erro`} className="captura__erro mt-2">{erros.unidade}</p>}
              </fieldset>
            )}

            {eProfissional && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id={`${idBase}-profissao`} rotulo="Profissão">
                  <input id={`${idBase}-profissao`} name="profissao" autoComplete="organization-title" maxLength={100}
                    placeholder="Dentista, estudante…" />
                </Campo>
                <Campo id={`${idBase}-cidade`} rotulo="Cidade">
                  <input id={`${idBase}-cidade`} name="cidade" autoComplete="address-level2" maxLength={80} />
                </Campo>
              </div>
            )}

            <p className="text-xs leading-relaxed text-conteudo-tenue">
              Ao continuar, você autoriza o Instituto Vert a usar estes dados para responder ao seu contato.
            </p>

            <button type="submit" disabled={enviando}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-marca-forte px-6 py-3 text-sm font-semibold text-conteudo-inverso transition duration-padrao ease-saida active:scale-[0.98] disabled:opacity-70 hover-fino:hover:bg-conteudo">
              <IconWhatsApp className="h-[18px] w-[18px]" />
              {enviando ? 'Abrindo o WhatsApp…' : 'Continuar no WhatsApp'}
            </button>

            {!eProfissional && (
              <a
                href={linkWhatsApp(clinica.whatsappAtendimento, 'Olá! Já sou paciente do Instituto Vert e preciso de atendimento.')}
                onClick={() => registrarClique(`${pedido.cta}_ja_sou_paciente`)}
                className="-mt-2 text-center text-sm text-conteudo-suave underline decoration-borda-forte underline-offset-4"
              >
                Já sou paciente — falar com o atendimento
              </a>
            )}
          </form>
        )}
      </dialog>
    </Contexto.Provider>
  )
}

function Campo({ id, rotulo, erro, children }: { id: string; rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <div className="captura__campo">
      <label htmlFor={id} className="text-sm font-medium">{rotulo}</label>
      {children}
      {erro && <p id={`${id}-erro`} className="captura__erro">{erro}</p>}
    </div>
  )
}
