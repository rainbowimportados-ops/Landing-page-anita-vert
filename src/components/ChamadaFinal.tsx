import { clinica } from '../config/site'
import { BotaoWhatsApp } from './CTA'
import { Reveal } from './Reveal'

export function ChamadaFinal() {
  return (
    <section className="bg-sand-50 py-20 sm:py-24">
      <div className="container-vert">
        <Reveal>
          <div className="rounded-3xl border border-forest-100 bg-white px-7 py-14 text-center sm:px-12">
            <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight text-forest-800 sm:text-4xl">
              Comece pela avaliação. O resto vem planejado.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-forest-700/90">
              Conte pelo WhatsApp o que você gostaria de mudar no seu sorriso e a equipe indica o
              próximo passo.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BotaoWhatsApp
                rastreio="chamada_final_agendar"
                numero={clinica.whatsappComercial}
                mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
                className="w-full sm:w-auto"
              >
                Agendar avaliação
              </BotaoWhatsApp>

              <BotaoWhatsApp
                rastreio="chamada_final_ja_sou_paciente"
                numero={clinica.whatsappAtendimento}
                mensagem="Olá! Já sou paciente do Instituto Vert e preciso de atendimento."
                variante="secundaria"
                className="w-full sm:w-auto"
              >
                Já sou paciente
              </BotaoWhatsApp>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
