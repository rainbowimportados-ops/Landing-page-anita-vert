import { useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { BotaoWhatsApp } from './CTA'
import { IconCheck, IconEquipe, IconLocal, IconPrancheta } from './Icon'
import { Reveal } from './Reveal'

const pontos = [
  { Icone: IconCheck, texto: 'Atendimento personalizado' },
  { Icone: IconEquipe, texto: 'Equipe especializada' },
  { Icone: IconPrancheta, texto: 'Avaliação completa, com plano por escrito' },
  { Icone: IconLocal, texto: 'Dois endereços: Franca e Ribeirão Preto' },
]

/** "Agende sua avaliação": paciente novo entra no funil; paciente atual vai ao atendimento. */
export function ChamadaFinal() {
  const { clinica } = useConteudo()
  const [aba, setAba] = useState<'novo' | 'atual'>('novo')

  return (
    <section id="contato" className="secao">
      <div className="container-vert grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="olho">Agendamento</p>
          <h2 className="titulo-secao mt-4">Agende sua avaliação</h2>
          <p className="lead mt-4 max-w-md">
            Dê o primeiro passo para o seu novo sorriso. É rápido, prático e sem compromisso.
          </p>
          <ul className="mt-8 grid gap-4">
            {pontos.map(({ Icone, texto }) => (
              <li key={texto} className="flex items-center gap-4 text-[0.95rem] text-conteudo">
                <Icone className="h-6 w-6 shrink-0" />
                {texto}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={80}>
          <div className="tratamento-card rounded-[1.75rem] border border-white/70 p-6 sm:p-9">
            <div role="tablist" aria-label="Tipo de atendimento" className="unidades-abas grid grid-cols-2 gap-1 rounded-2xl p-1">
              {(
                [
                  ['novo', 'Paciente novo'],
                  ['atual', 'Paciente atual'],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  role="tab"
                  aria-selected={aba === valor}
                  onClick={() => setAba(valor)}
                  className={`min-h-[44px] rounded-xl px-4 text-sm transition-colors duration-rapido ${
                    aba === valor ? 'bg-marca-forte text-conteudo-inverso shadow-2' : 'text-conteudo-suave hover-fino:hover:text-conteudo'
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="mt-8">
              {aba === 'novo' ? (
                <>
                  <h3 className="font-display text-3xl font-light">Comece pela avaliação.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-conteudo-suave">
                    Informe nome, WhatsApp e a unidade de preferência. A conversa abre no WhatsApp da equipe já com
                    o seu nome, e o próximo passo é combinado por lá.
                  </p>
                  <BotaoWhatsApp
                    rastreio="chamada_final_agendar"
                    intencao="avaliacao"
                    numero={clinica.whatsappComercial}
                    mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
                    icone="seta"
                    className="mt-8 w-full"
                  >
                    Solicitar agendamento
                  </BotaoWhatsApp>
                </>
              ) : (
                <>
                  <h3 className="font-display text-3xl font-light">Já é nosso paciente?</h3>
                  <p className="mt-3 text-sm leading-relaxed text-conteudo-suave">
                    Fale direto com o atendimento para remarcar, tirar dúvidas ou acompanhar o seu tratamento.
                  </p>
                  <BotaoWhatsApp
                    rastreio="chamada_final_ja_sou_paciente"
                    numero={clinica.whatsappAtendimento}
                    mensagem="Olá! Já sou paciente do Instituto Vert e preciso de atendimento."
                    className="mt-8 w-full"
                  >
                    Falar com o atendimento
                  </BotaoWhatsApp>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
