import { clinica, profissionais } from '../config/site'
import { BotaoWhatsApp } from './CTA'
import { Reveal } from './Reveal'

export function Dentistas() {
  return (
    <section id="dentistas" className="bg-forest-800 py-20 text-sand-50 sm:py-24">
      <div className="container-vert">
        <Reveal className="max-w-2xl">
          <p className="olho text-forest-300">{profissionais.titulo}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
            A Vert também trabalha com quem atende
          </h2>
          <p className="mt-4 text-base leading-relaxed text-forest-100/85">
            {profissionais.texto}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {profissionais.itens.map((item, indice) => (
            <Reveal key={item.titulo} delay={indice * 90}>
              <article className="flex h-full flex-col rounded-2xl border border-forest-600/60 bg-forest-700/40 p-7">
                <h3 className="font-display text-xl">{item.titulo}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-forest-100/85">
                  {item.texto}
                </p>
                <BotaoWhatsApp
                  rastreio={`dentistas_${indice === 0 ? 'cursos' : 'locacao'}`}
                  numero={clinica.whatsappComercial}
                  mensagem={item.mensagem}
                  variante="clara"
                  className="mt-6 self-start"
                >
                  {item.botao}
                </BotaoWhatsApp>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
