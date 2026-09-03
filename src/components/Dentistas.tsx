import { clinica, profissionais } from '../config/site'
import { BotaoWhatsApp } from './CTA'
import { Reveal } from './Reveal'

export function Dentistas() {
  return (
    <section id="dentistas" className="secao bg-superficie-inversa text-conteudo-inverso">
      <div className="container-vert">
        <Reveal className="max-w-texto">
          <p className="olho text-conteudo-inverso-tenue">{profissionais.titulo}</p>
          <h2 className="mt-3 font-display text-display-sm">
            A Vert também trabalha com quem atende
          </h2>
          <p className="mt-4 text-base leading-relaxed text-conteudo-inverso-suave">
            {profissionais.texto}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {profissionais.itens.map((item, indice) => (
            <Reveal key={item.titulo} delay={indice * 45}>
              <article className="flex h-full flex-col rounded-card border border-borda-inversa bg-superficie-inversa-suave/50 p-7">
                <h3 className="font-display text-xl">{item.titulo}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-conteudo-inverso-suave">
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
