import { useConteudo } from '../lib/ConteudoContexto'
import foto1200 from '../assets/hero/sorriso-vert-1200.webp'
import foto720 from '../assets/hero/sorriso-vert-720.webp'
import { BotaoAncora, BotaoWhatsApp } from './CTA'
import { IconBrilho, IconEquipe, IconEscudo } from './Icon'

// Só atributos que a clínica de fato oferece — nada de números inventados.
const atributos = [
  { Icone: IconBrilho, texto: 'Planejamento personalizado' },
  { Icone: IconEquipe, texto: 'Equipe especializada' },
  { Icone: IconEscudo, texto: 'Resultados reais' },
]

export function Hero() {
  const { clinica } = useConteudo()

  return (
    <section id="topo" className="hero-claro relative overflow-hidden pt-[5.5rem]">
      <div className="container-vert relative grid gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-14 lg:pb-24">
        <div className="animate-fade-up">
          <p className="olho-linha">Resultados reais</p>
          <h1 className="mt-5 font-display text-display-lg font-light tracking-[-0.02em] text-conteudo">
            Sorrisos que transformam histórias.
          </h1>
          <p className="mt-6 max-w-md font-display text-xl leading-snug text-conteudo-suave sm:text-2xl">
            Mais que estética, devolvemos confiança, bem-estar e qualidade de vida. Resultados reais, com
            planejamento e segurança.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BotaoWhatsApp
              rastreio="hero_agendar"
              intencao="avaliacao"
              numero={clinica.whatsappComercial}
              mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
              icone="seta"
              className="w-full px-7 sm:w-auto"
            >
              Agendar avaliação
            </BotaoWhatsApp>
            <BotaoAncora href="#unidades" className="w-full sm:w-auto">
              Conheça nossas unidades
            </BotaoAncora>
          </div>

          <ul className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {atributos.map(({ Icone, texto }) => (
              <li key={texto} className="flex flex-col items-center gap-3 text-center text-[0.8125rem] leading-snug text-conteudo-suave">
                <Icone className="h-7 w-7 text-conteudo" />
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <figure className="hero-foto animate-fade-up [animation-delay:120ms]">
          <img
            src={foto1200}
            srcSet={`${foto720} 720w, ${foto1200} 1200w`}
            sizes="(min-width: 1024px) 58vw, 100vw"
            alt="Mulher sorrindo com os olhos fechados e as mãos no rosto"
            width={1200}
            height={1800}
            fetchPriority="high"
          />
          <figcaption className="hero-foto__legenda">
            Mais que sorrisos,
            <br />
            vidas reais.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
