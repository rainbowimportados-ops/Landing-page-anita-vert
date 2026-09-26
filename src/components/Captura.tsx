import { createContext, useCallback, useContext, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { enviarLead, telefoneValido, type Intencao } from '../lib/captura'
import { IconCheck, IconSeta, IconWhatsApp } from './Icon'
import { MarcaVert } from './MarcaVert'

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
  const [perfil, setPerfil] = useState('')
  /** Depois do envio: confirmação com o link do WhatsApp (abre sozinho em seguida). */
  const [pronto, setPronto] = useState<{ link: string; salvo: boolean } | null>(null)
  const idBase = useId()

  const abrir = useCallback<Abrir>((novo) => {
    setPedido(novo)
    setUnidade(novo.unidade ?? '')
    setErros({})
    setEnviando(false)
    setPerfil('')
    setPronto(null)
    registrarClique(novo.cta, novo.unidade ?? null, 'form_opened')
    dialogo.current?.showModal()
  }, [])

  function fechar() {
    dialogo.current?.close()
  }

  function abrirWhatsApp(numero: string, mensagem: string, salvo: boolean) {
    const link = linkWhatsApp(numero, mensagem)
    setPronto({ link, salvo })
    // A confirmação aparece por um instante e o WhatsApp abre sozinho; o botão
    // da confirmação cobre navegadores que bloqueiam a navegação automática.
    window.setTimeout(() => window.location.assign(link), 1200)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!pedido || enviando) return
    const dados = new FormData(evento.currentTarget)
    const nome = String(dados.get('nome') ?? '').trim()
    const telefone = String(dados.get('telefone') ?? '').trim()
    const profissao = perfil
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
    if (resultado.ok) registrarClique(pedido.cta, escolhida, 'lead_created')
    registrarClique(pedido.cta, escolhida, 'whatsapp_opened')

    const numero = dadosUnidade?.whatsapp ?? pedido.numero
    const primeiroNome = nome.split(/\s+/)[0]
    const complemento = dadosUnidade && !pedido.unidade ? ` Prefiro a unidade de ${dadosUnidade.cidade.split(' /')[0]}.` : ''
    abrirWhatsApp(numero, `${pedido.mensagem.replace(/^Olá!/, `Olá! Sou ${primeiroNome}.`)}${complemento}`, resultado.ok)
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
        className="captura w-[min(100%-2rem,30rem)] rounded-[1.75rem] border border-white/60 p-0 text-conteudo shadow-3"
        onClose={() => setPedido(null)}
      >
        {pedido && pronto && (
          <div className="grid justify-items-center gap-4 px-6 py-12 text-center sm:px-10">
            <span className="grid h-20 w-20 place-items-center rounded-full border border-conteudo/20 bg-superficie shadow-2">
              <IconCheck className="h-10 w-10 text-conteudo" />
            </span>
            <h2 id={`${idBase}-titulo`} className="mt-2 font-display text-4xl font-light">
              {pronto.salvo ? 'Tudo certo!' : 'Vamos continuar'}
            </h2>
            <p id={`${idBase}-descricao`} className="max-w-xs text-sm leading-relaxed text-conteudo-suave">
              {pronto.salvo ? 'Seus dados foram enviados. ' : ''}Agora você será direcionado para o WhatsApp da equipe.
            </p>
            <a href={pronto.link}
              className="mt-2 inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-marca-forte px-7 py-3 text-sm font-medium text-conteudo-inverso hover-fino:hover:bg-conteudo">
              Abrir WhatsApp <IconSeta className="h-4 w-4" />
            </a>
          </div>
        )}
        {pedido && !pronto && (
          <form
            onSubmit={enviar}
            onInput={(evento) => {
              // Some o aviso do campo assim que a pessoa começa a corrigi-lo.
              const campo = (evento.target as HTMLInputElement).name as keyof Erros
              if (erros[campo]) setErros(({ [campo]: _removido, ...resto }) => resto)
            }}
            noValidate
            className="relative grid gap-5 p-6 pt-8 sm:p-9"
          >
            <button
              type="button"
              onClick={fechar}
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-2xl font-light text-conteudo-suave hover-fino:hover:bg-superficie-suave"
              aria-label="Fechar"
            >
              ×
            </button>
            <div className="grid justify-items-center text-center">
              <MarcaVert versao="circular" className="h-14 text-conteudo" />
              <h2 id={`${idBase}-titulo`} className="mt-5 font-display text-4xl font-light leading-tight">
                {eProfissional ? 'Quase lá!' : 'Vamos conversar?'}
              </h2>
              <p id={`${idBase}-descricao`} className="mt-2 max-w-xs text-sm leading-relaxed text-conteudo-suave">
                Preencha seus dados e fale com nossa equipe pelo WhatsApp
                {pedido.intencao === 'curso' ? ' sobre os cursos.' : pedido.intencao === 'locacao' ? ' sobre a locação de consultório.' : '.'}
              </p>
            </div>

            <Campo id={`${idBase}-nome`} rotulo="Nome completo" erro={erros.nome}>
              <input id={`${idBase}-nome`} name="nome" autoComplete="name" maxLength={100} required placeholder="Seu nome"
                aria-invalid={!!erros.nome} aria-describedby={erros.nome ? `${idBase}-nome-erro` : undefined} />
            </Campo>

            <Campo id={`${idBase}-telefone`} rotulo="WhatsApp" erro={erros.telefone}>
              <input id={`${idBase}-telefone`} name="telefone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20}
                placeholder="(16) 99999-9999" required aria-invalid={!!erros.telefone}
                aria-describedby={erros.telefone ? `${idBase}-telefone-erro` : undefined} />
            </Campo>

            {perguntarUnidade && (
              <fieldset aria-describedby={erros.unidade ? `${idBase}-unidade-erro` : undefined}>
                <legend className="text-sm font-medium">Onde prefere ser atendido?</legend>
                <div className="captura__segmentos mt-2">
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
              <>
                <fieldset>
                  <legend className="text-sm font-medium">Você é?</legend>
                  <div className="captura__segmentos captura__segmentos--2 mt-2">
                    {['Dentista', 'Estudante'].map((opcao) => (
                      <label key={opcao} className="captura__opcao">
                        <input type="radio" name="perfil" value={opcao} checked={perfil === opcao} onChange={() => setPerfil(opcao)} />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Campo id={`${idBase}-cidade`} rotulo="Cidade">
                  <input id={`${idBase}-cidade`} name="cidade" autoComplete="address-level2" maxLength={80} placeholder="Onde você atende" />
                </Campo>
              </>
            )}

            <button type="submit" disabled={enviando}
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-marca-forte px-6 py-3 text-sm font-medium text-conteudo-inverso shadow-2 transition duration-padrao ease-saida active:scale-[0.98] disabled:opacity-70 hover-fino:hover:bg-conteudo">
              <IconWhatsApp className="h-[18px] w-[18px]" />
              {enviando ? 'Abrindo o WhatsApp…' : 'Continuar no WhatsApp'}
              {!enviando && <IconSeta className="h-4 w-4" />}
            </button>

            <p className="-mt-1 text-center text-xs leading-relaxed text-conteudo-tenue">
              Seus dados estão seguros: ao continuar, você autoriza o Instituto Vert a usá-los apenas para responder à
              sua solicitação. <a href="/privacidade" target="_blank" className="underline underline-offset-2">Política de privacidade</a>
            </p>

            {!eProfissional && (
              <a
                href={linkWhatsApp(clinica.whatsappAtendimento, 'Olá! Já sou paciente do Instituto Vert e preciso de atendimento.')}
                onClick={() => registrarClique('ja_sou_paciente', null, 'whatsapp_opened')}
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
