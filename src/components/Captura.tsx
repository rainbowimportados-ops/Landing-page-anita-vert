import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { enviarLead, telefoneValido, type Intencao } from '../lib/captura'
import { IconCheck, IconSeta, IconWhatsApp } from './Icon'
import { MarcaVert } from './MarcaVert'

export type PedidoCaptura = {
  /** Interesse revelado pelo clique; só é perguntado quando o botão é genérico. */
  intencao: Intencao
  /** Unidade já escolhida pelo botão; quando nula, o formulário pergunta. */
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
  paciente_atual: 'Já sou paciente',
}

/** O que a pessoa procura, quando o botão não diz. Cada opção vira a intenção do lead. */
const interesses: { intencao: Intencao; texto: string }[] = [
  { intencao: 'avaliacao', texto: 'Avaliação' },
  { intencao: 'lentes', texto: 'Lentes em resina' },
  { intencao: 'estetica', texto: 'Estética do sorriso' },
  { intencao: 'ortodontia', texto: 'Ortodontia' },
  { intencao: 'implante', texto: 'Próteses e implantes' },
]

const assuntosCurso = ['Lentes em resina', 'Estética odontológica', 'Mentoria prática', 'Outros cursos']
const periodos = ['Até o 4º semestre', 'Do 5º ao 8º semestre', 'Último ano', 'Já me formei há pouco']
const frequencias = ['Uso pontual', 'Semanalmente', 'Mensalmente']

type Valores = {
  nome: string
  telefone: string
  unidade: string
  interesse: Intencao
  jaPaciente: '' | 'sim' | 'nao'
  perfil: '' | 'Dentista' | 'Estudante' | 'Profissional da saúde'
  profissaoSaude: string
  cidade: string
  jaFezCurso: '' | 'sim' | 'nao'
  assunto: string
  periodo: string
  finalidade: string
  frequencia: string
}

const vazio = (pedido: PedidoCaptura): Valores => ({
  nome: '', telefone: '', unidade: pedido.unidade ?? '', interesse: pedido.intencao,
  jaPaciente: '', perfil: '', profissaoSaude: '', cidade: '', jaFezCurso: '', assunto: '', periodo: '', finalidade: '', frequencia: '',
})

type Erros = Partial<Record<keyof Valores | 'geral', string>>

type Resultado = { tipo: 'ok'; link: string } | { tipo: 'falha'; link: string; limite: boolean }

/**
 * Fluxo de captação da landing: botão → formulário de duas etapas → lead salvo → WhatsApp.
 * Etapa 1: nome e WhatsApp. Etapa 2: todas as perguntas do tipo de contato, de uma vez.
 * A confirmação só aparece quando o banco confirma o registro; se o registro falhar,
 * a pessoa é avisada e ainda pode seguir para o WhatsApp.
 */
export function ProvedorDeCaptura({ children }: { children: ReactNode }) {
  const { clinica, unidades } = useConteudo()
  const dialogo = useRef<HTMLDialogElement>(null)
  const emEnvio = useRef(false)
  const [pedido, setPedido] = useState<PedidoCaptura | null>(null)
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [valores, setValores] = useState<Valores>(() => vazio({ intencao: 'avaliacao', cta: '', numero: '', mensagem: '' }))
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const idBase = useId()

  // Ao errar, o foco vai para o primeiro campo com problema (inputs ou grupo de opções).
  useEffect(() => {
    if (!Object.keys(erros).length) return
    const alvo = dialogo.current?.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby] input')
    alvo?.focus()
  }, [erros])

  const abrir = useCallback<Abrir>((novo) => {
    setPedido(novo)
    setValores(vazio(novo))
    setEtapa(1)
    setErros({})
    setEnviando(false)
    emEnvio.current = false
    setResultado(null)
    registrarClique(novo.cta, novo.unidade ?? null, 'form_opened')
    dialogo.current?.showModal()
  }, [])

  const fechar = () => dialogo.current?.close()

  function definir<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => {
      if (!atual[campo] && !atual.geral) return atual
      const { [campo]: _removido, geral: _geral, ...resto } = atual
      return resto
    })
  }
  const aoDigitar = (campo: 'nome' | 'telefone' | 'cidade' | 'profissaoSaude' | 'finalidade') => (e: ChangeEvent<HTMLInputElement>) =>
    definir(campo, e.target.value)

  const grupo = pedido?.intencao === 'curso' ? 'curso' : pedido?.intencao === 'locacao' ? 'locacao' : 'paciente'
  const estudanteAlugando = grupo === 'locacao' && valores.perfil === 'Estudante'
  const perguntarInteresse = grupo === 'paciente' && pedido?.intencao === 'avaliacao'
  const perguntarUnidade = grupo === 'paciente' && !pedido?.unidade

  function avancar() {
    const novos: Erros = {}
    if (valores.nome.trim().length < 2) novos.nome = 'Informe seu primeiro nome.'
    if (!telefoneValido(valores.telefone)) novos.telefone = 'Informe o WhatsApp com DDD, por exemplo (16) 99999-9999.'
    setErros(novos)
    if (Object.keys(novos).length === 0) setEtapa(2)
  }

  function validarEtapaDois(): Erros {
    const novos: Erros = {}
    if (grupo === 'paciente') {
      if (perguntarUnidade && !valores.unidade) novos.unidade = 'Escolha uma unidade ou "Ainda não sei".'
      if (!valores.jaPaciente) novos.jaPaciente = 'Conte se você já é paciente.'
    } else if (grupo === 'curso') {
      if (!valores.perfil) novos.perfil = 'Escolha uma opção.'
      if (!valores.assunto) novos.assunto = 'Escolha o assunto de interesse.'
    } else {
      if (!valores.perfil) novos.perfil = 'Escolha uma opção.'
      else if (valores.perfil === 'Estudante') novos.perfil = 'A locação é exclusiva para dentistas e profissionais da saúde.'
      else if (valores.perfil === 'Profissional da saúde' && valores.profissaoSaude.trim().length < 3)
        novos.profissaoSaude = 'Informe sua profissão na saúde.'
    }
    return novos
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!pedido) return
    if (etapa === 1) return avancar()
    if (emEnvio.current) return
    const novos = validarEtapaDois()
    setErros(novos)
    if (Object.keys(novos).length) return

    emEnvio.current = true
    setEnviando(true)

    const escolhida = valores.unidade && valores.unidade !== 'indefinida' ? valores.unidade : null
    const dadosUnidade = unidades.find((u) => u.slug === escolhida)
    const jaEPaciente = grupo === 'paciente' && valores.jaPaciente === 'sim'
    const intencao: Intencao = jaEPaciente ? 'paciente_atual' : grupo === 'paciente' ? valores.interesse : pedido.intencao
    const interesseTexto = grupo === 'curso' ? valores.assunto : titulos[intencao === 'paciente_atual' ? valores.interesse : intencao]
    const cidade = valores.cidade.trim()

    const respostas: Record<string, string | boolean | null> =
      grupo === 'curso'
        ? { perfil: valores.perfil, cidade, interesse: valores.assunto, ja_fez_curso: valores.jaFezCurso ? valores.jaFezCurso === 'sim' : null, periodo_graduacao: valores.periodo }
        : grupo === 'locacao'
          ? { perfil: valores.perfil, cidade, profissao: valores.profissaoSaude.trim(), finalidade: valores.finalidade.trim(), frequencia: valores.frequencia }
          : { situacao: valores.jaPaciente === 'sim' ? 'atual' : 'novo', interesse: interesseTexto, unidade: dadosUnidade?.cidade.split(' /')[0] ?? '' }

    const resposta = await enviarLead({
      nome: valores.nome.trim(),
      telefone: valores.telefone.trim(),
      intencao,
      unidade: escolhida,
      profissao: grupo === 'paciente' ? undefined : valores.perfil === 'Estudante' ? 'Estudante de Odontologia' : valores.perfil,
      cidade: cidade || undefined,
      dentista: grupo === 'paciente' ? null : valores.perfil === 'Dentista' ? true : valores.perfil === 'Estudante' ? false : null,
      jaFezCurso: grupo === 'curso' && valores.jaFezCurso ? valores.jaFezCurso === 'sim' : null,
      respostas,
      rotulo: `Site — ${titulos[intencao]}${dadosUnidade ? ` (${dadosUnidade.cidade.split(' /')[0]})` : ''}`,
      cta: pedido.cta,
    })

    emEnvio.current = false
    setEnviando(false)

    if (!resposta.ok && (resposta.erro === 'nome' || resposta.erro === 'telefone')) {
      setEtapa(1)
      setErros({ [resposta.erro]: resposta.erro === 'nome' ? 'Confira o nome.' : 'Confira o número com DDD.' })
      return
    }
    if (!resposta.ok && resposta.erro === 'perfil_locacao') {
      setErros({ perfil: 'A locação é exclusiva para dentistas e profissionais da saúde.' })
      return
    }

    const numero = jaEPaciente ? clinica.whatsappAtendimento : (dadosUnidade?.whatsapp ?? pedido.numero)
    const primeiroNome = valores.nome.trim().split(/\s+/)[0]
    const complemento = dadosUnidade && !pedido.unidade ? ` Prefiro a unidade de ${dadosUnidade.cidade.split(' /')[0]}.` : ''
    const base = jaEPaciente ? 'Olá! Já sou paciente do Instituto Vert e preciso de atendimento.' : pedido.mensagem
    const perfilTexto = grupo !== 'paciente' && valores.perfil ? ` Sou ${valores.perfil === 'Estudante' ? 'estudante de Odontologia' : valores.perfil.toLowerCase()}.` : ''
    const link = linkWhatsApp(numero, `${base.replace(/^Olá!/, `Olá! Sou ${primeiroNome}.`)}${perfilTexto}${complemento}`)

    if (resposta.ok) {
      registrarClique(pedido.cta, escolhida, 'lead_created')
      registrarClique(pedido.cta, escolhida, 'whatsapp_opened')
      setResultado({ tipo: 'ok', link })
      // O WhatsApp abre sozinho; o botão da confirmação cobre navegadores que bloqueiam a navegação automática.
      window.setTimeout(() => window.location.assign(link), 1400)
    } else {
      setResultado({ tipo: 'falha', link, limite: resposta.erro === 'limite' })
    }
  }

  const unidadesOpcoes = [...unidades.map((u) => ({ valor: u.slug, texto: u.cidade.split(' /')[0] })), { valor: 'indefinida', texto: 'Ainda não sei' }]

  return (
    <Contexto.Provider value={abrir}>
      {children}
      <dialog
        ref={dialogo}
        aria-labelledby={`${idBase}-titulo`}
        aria-describedby={`${idBase}-descricao`}
        className="captura w-[min(100%-1.5rem,28rem)] rounded-[1.5rem] border border-white/60 p-0 text-conteudo shadow-3"
        onClose={() => setPedido(null)}
        onClick={(e) => { if (e.target === dialogo.current) fechar() }}
      >
        {pedido && resultado?.tipo === 'ok' && (
          <div className="grid justify-items-center gap-3 px-6 py-10 text-center sm:px-9" role="status">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-conteudo/20 bg-superficie shadow-2">
              <IconCheck className="h-8 w-8 text-conteudo" />
            </span>
            <h2 id={`${idBase}-titulo`} className="mt-1 font-display text-3xl font-light">Tudo certo!</h2>
            <p id={`${idBase}-descricao`} className="max-w-xs text-sm leading-relaxed text-conteudo-suave">
              Registramos seu pedido. Agora você será direcionado para o WhatsApp da equipe.
            </p>
            <a href={resultado.link} className="captura__principal mt-1">
              Abrir WhatsApp <IconSeta className="h-4 w-4" />
            </a>
          </div>
        )}

        {pedido && resultado?.tipo === 'falha' && (
          <div className="grid justify-items-center gap-3 px-6 py-9 text-center sm:px-9" role="alert">
            <h2 id={`${idBase}-titulo`} className="font-display text-3xl font-light">Não conseguimos registrar</h2>
            <p id={`${idBase}-descricao`} className="max-w-xs text-sm leading-relaxed text-conteudo-suave">
              {resultado.limite
                ? 'Recebemos muitas solicitações deste número em pouco tempo. Aguarde alguns minutos ou fale direto com a equipe.'
                : 'Seu pedido não foi salvo por um problema de conexão. Suas respostas estão guardadas: tente de novo ou fale direto com a equipe.'}
            </p>
            <button type="button" className="captura__principal mt-1" onClick={() => setResultado(null)}>Tentar novamente</button>
            <a href={resultado.link} className="text-sm text-conteudo-suave underline decoration-borda-forte underline-offset-4">
              Continuar no WhatsApp sem registrar
            </a>
          </div>
        )}

        {pedido && !resultado && (
          <form onSubmit={enviar} noValidate className="relative grid gap-3.5 p-5 pt-5 sm:p-7">
            <button type="button" onClick={fechar} aria-label="Fechar"
              className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-2xl font-light text-conteudo-suave hover-fino:hover:bg-superficie-suave">
              ×
            </button>
            <div className="grid justify-items-center text-center">
              {etapa === 1 && <MarcaVert versao="circular" className="h-11 text-conteudo" />}
              <p className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-conteudo-tenue" aria-live="polite">Etapa {etapa} de 2</p>
              <h2 id={`${idBase}-titulo`} className="mt-1 font-display text-3xl font-light leading-tight">
                {etapa === 1 ? 'Vamos conversar?' : grupo === 'curso' ? 'Cursos e imersões' : grupo === 'locacao' ? 'Locação de consultório' : 'Só mais um detalhe'}
              </h2>
              <p id={`${idBase}-descricao`} className={`mt-1 max-w-xs text-sm leading-relaxed text-conteudo-suave ${etapa === 2 ? 'sr-only' : ''}`}>
                {etapa === 1 ? 'Seu nome e WhatsApp para a equipe falar com você.' : 'Responda abaixo para direcionarmos seu contato.'}
              </p>
            </div>

            {etapa === 1 && (
              <>
                <Campo id={`${idBase}-nome`} rotulo="Primeiro nome" erro={erros.nome}>
                  <input id={`${idBase}-nome`} name="nome" autoComplete="given-name" maxLength={100} placeholder="Como podemos chamar você?"
                    value={valores.nome} onChange={aoDigitar('nome')} aria-invalid={!!erros.nome} aria-describedby={erros.nome ? `${idBase}-nome-erro` : undefined} />
                </Campo>
                <Campo id={`${idBase}-telefone`} rotulo="WhatsApp com DDD" erro={erros.telefone}>
                  <input id={`${idBase}-telefone`} name="telefone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20}
                    placeholder="(16) 99999-9999" value={valores.telefone} onChange={aoDigitar('telefone')}
                    aria-invalid={!!erros.telefone} aria-describedby={erros.telefone ? `${idBase}-telefone-erro` : undefined} />
                </Campo>
              </>
            )}

            {etapa === 2 && (
              <>
                <button type="button" onClick={() => setEtapa(1)} className="justify-self-start text-sm text-conteudo-suave underline decoration-borda-forte underline-offset-4">
                  ← Voltar
                </button>

                {grupo === 'paciente' && (
                  <>
                    {perguntarInteresse ? (
                      <Opcoes legenda="O que você procura?" nome="interesse" colunas={2}
                        opcoes={interesses.map((i) => ({ valor: i.intencao, texto: i.texto }))}
                        valor={valores.interesse} aoEscolher={(v) => definir('interesse', v as Intencao)} />
                    ) : (
                      <p className="rounded-xl bg-superficie-suave px-4 py-2.5 text-sm text-conteudo-suave">
                        Interesse: <strong className="font-medium text-conteudo">{titulos[valores.interesse]}</strong>
                      </p>
                    )}
                    {perguntarUnidade && (
                      <Opcoes legenda="Onde prefere ser atendido?" nome="unidade" colunas={3} opcoes={unidadesOpcoes}
                        valor={valores.unidade} aoEscolher={(v) => definir('unidade', v)} erro={erros.unidade} idErro={`${idBase}-unidade-erro`} />
                    )}
                    <Opcoes legenda="Já é paciente do Instituto Vert?" nome="jaPaciente" colunas={2}
                      opcoes={[{ valor: 'nao', texto: 'Ainda não' }, { valor: 'sim', texto: 'Sim, já sou' }]}
                      valor={valores.jaPaciente} aoEscolher={(v) => definir('jaPaciente', v as Valores['jaPaciente'])}
                      erro={erros.jaPaciente} idErro={`${idBase}-jaPaciente-erro`} />
                  </>
                )}

                {grupo === 'curso' && (
                  <>
                    <Opcoes legenda="Você é?" nome="perfil" colunas={2} opcoes={[{ valor: 'Dentista', texto: 'Dentista' }, { valor: 'Estudante', texto: 'Estudante' }]}
                      valor={valores.perfil} aoEscolher={(v) => definir('perfil', v as Valores['perfil'])} erro={erros.perfil} idErro={`${idBase}-perfil-erro`} />
                    <Seletor id={`${idBase}-assunto`} rotulo="Qual assunto interessa?" valor={valores.assunto} opcoes={assuntosCurso}
                      aoMudar={(v) => definir('assunto', v)} erro={erros.assunto} />
                    {valores.perfil === 'Dentista' && (
                      <Opcoes legenda="Já fez curso na área? (opcional)" nome="jaFezCurso" colunas={2}
                        opcoes={[{ valor: 'sim', texto: 'Sim' }, { valor: 'nao', texto: 'Não' }]}
                        valor={valores.jaFezCurso} aoEscolher={(v) => definir('jaFezCurso', v as Valores['jaFezCurso'])} />
                    )}
                    {valores.perfil === 'Estudante' && (
                      <Seletor id={`${idBase}-periodo`} rotulo="Em que momento da graduação? (opcional)" valor={valores.periodo} opcoes={periodos}
                        aoMudar={(v) => definir('periodo', v)} />
                    )}
                    <Campo id={`${idBase}-cidade`} rotulo="Cidade onde atua ou estuda (opcional)">
                      <input id={`${idBase}-cidade`} name="cidade" autoComplete="address-level2" maxLength={80} placeholder="Ex.: Ribeirão Preto" value={valores.cidade} onChange={aoDigitar('cidade')} />
                    </Campo>
                  </>
                )}

                {grupo === 'locacao' && (
                  <>
                    <Opcoes legenda="Você é?" nome="perfil" colunas={3}
                      opcoes={[{ valor: 'Dentista', texto: 'Dentista' }, { valor: 'Profissional da saúde', texto: 'Profissional da saúde' }, { valor: 'Estudante', texto: 'Estudante' }]}
                      valor={valores.perfil} aoEscolher={(v) => definir('perfil', v as Valores['perfil'])} erro={erros.perfil} idErro={`${idBase}-perfil-erro`} />
                    {estudanteAlugando ? (
                      <p className="rounded-xl bg-superficie-suave px-4 py-3 text-sm leading-relaxed text-conteudo-suave" role="note">
                        A sala é alugada apenas por dentistas e profissionais da saúde habilitados. Para estudantes, temos cursos e imersões.
                        {' '}
                        <button type="button" className="font-medium text-conteudo underline underline-offset-4"
                          onClick={() => { setPedido({ ...pedido, intencao: 'curso', cta: `${pedido.cta}_curso`, mensagem: 'Olá! Quero informações sobre os cursos do Instituto Vert.' }); setValores((v) => ({ ...v, interesse: 'curso', perfil: 'Estudante' })); setErros({}) }}>
                          Ver cursos
                        </button>
                      </p>
                    ) : (
                      <>
                        {valores.perfil === 'Profissional da saúde' && (
                          <Campo id={`${idBase}-profissao`} rotulo="Qual é a sua profissão?" erro={erros.profissaoSaude}>
                            <input id={`${idBase}-profissao`} name="profissao" maxLength={80} placeholder="Ex.: Fisioterapeuta" value={valores.profissaoSaude} onChange={aoDigitar('profissaoSaude')} aria-invalid={!!erros.profissaoSaude} />
                          </Campo>
                        )}
                        <Campo id={`${idBase}-finalidade`} rotulo="Para qual atendimento precisa da sala? (opcional)">
                          <input id={`${idBase}-finalidade`} name="finalidade" maxLength={120} placeholder="Ex.: consultas, avaliações" value={valores.finalidade} onChange={aoDigitar('finalidade')} />
                        </Campo>
                        <Seletor id={`${idBase}-frequencia`} rotulo="Frequência de uso (opcional)" valor={valores.frequencia} opcoes={frequencias} aoMudar={(v) => definir('frequencia', v)} />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <p className="text-xs leading-relaxed text-conteudo-suave">
              Ao enviar, você pede que a equipe use estes dados para responder a este pedido.{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Política de privacidade</a>.
            </p>

            {estudanteAlugando ? null : (
              <button type="submit" disabled={enviando} className="captura__principal">
                {etapa === 1 ? (
                  <>Continuar <IconSeta className="h-4 w-4" /></>
                ) : (
                  <>
                    <IconWhatsApp className="h-[18px] w-[18px]" />
                    {enviando ? 'Registrando…' : 'Enviar e falar no WhatsApp'}
                  </>
                )}
              </button>
            )}

            {grupo === 'paciente' && etapa === 1 && (
              <a href={linkWhatsApp(clinica.whatsappAtendimento, 'Olá! Já sou paciente do Instituto Vert e preciso de atendimento.')}
                onClick={() => registrarClique('ja_sou_paciente', null, 'whatsapp_opened')}
                className="-mt-1 text-center text-sm text-conteudo-suave underline decoration-borda-forte underline-offset-4">
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
      {erro && <p id={`${id}-erro`} className="captura__erro" role="alert">{erro}</p>}
    </div>
  )
}

function Opcoes({ legenda, nome, opcoes, valor, aoEscolher, colunas, erro, idErro }: {
  legenda: string; nome: string; opcoes: { valor: string; texto: string }[]; valor: string
  aoEscolher: (valor: string) => void; colunas: 2 | 3; erro?: string; idErro?: string
}) {
  return (
    <fieldset aria-describedby={erro ? idErro : undefined}>
      <legend className="text-sm font-medium">{legenda}</legend>
      <div className={`captura__segmentos mt-1.5 ${colunas === 2 ? 'captura__segmentos--2' : ''}`}>
        {opcoes.map((opcao) => (
          <label key={opcao.valor} className="captura__opcao">
            <input type="radio" name={nome} value={opcao.valor} checked={valor === opcao.valor} onChange={() => aoEscolher(opcao.valor)} />
            <span>{opcao.texto}</span>
          </label>
        ))}
      </div>
      {erro && <p id={idErro} className="captura__erro mt-1.5" role="alert">{erro}</p>}
    </fieldset>
  )
}

function Seletor({ id, rotulo, valor, opcoes, aoMudar, erro }: {
  id: string; rotulo: string; valor: string; opcoes: string[]; aoMudar: (valor: string) => void; erro?: string
}) {
  return (
    <div className="captura__campo">
      <label htmlFor={id} className="text-sm font-medium">{rotulo}</label>
      <select id={id} name={id.split('-').pop()} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={!!erro}>
        <option value="">Selecione</option>
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {erro && <p id={`${id}-erro`} className="captura__erro" role="alert">{erro}</p>}
    </div>
  )
}
