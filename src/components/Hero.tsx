import { useConteudo } from '../lib/ConteudoContexto'
import foto1200 from '../assets/hero/dra-anita-1200.webp'
import foto720 from '../assets/hero/dra-anita-720.webp'
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
      <div className="container-vert relative grid gap-6 pb-10 pt-4 sm:gap-8 sm:pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12 lg:pb-16">
        <div className="animate-fade-up">
          <p className="olho-linha">Resultados reais</p>
          <h1 className="mt-5 font-display text-display-lg font-light tracking-[-0.02em] text-conteudo">
            Sorrisos que transformam histórias.
          </h1>
          <p className="mt-6 max-w-md font-display text-xl leading-snug text-conteudo-suave sm:text-2xl">
            Mais que estética, devolvemos confiança, bem-estar e qualidade de vida. Resultados reais, com
            planejamento e segurança.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
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
        </div>

        <figure className="hero-foto order-first animate-fade-up [animation-delay:120ms] lg:order-none">
          <img
            src={foto1200}
            srcSet={`${foto720} 720w, ${foto1200} 1200w`}
            sizes="(min-width: 1024px) 58vw, 100vw"
            alt="Dra. Anita Matias de Almeida, do Instituto Vert, sorrindo"
            width={1200}
            height={1800}
            fetchPriority="high"
          />
          <figcaption className="hero-foto__legenda">
            Mais que sorrisos,
            <br />
            vidas reais.
          </figcaption>
          {/* No celular a mesma informação aparece na faixa logo abaixo da primeira dobra. */}
          <ul className="hero-selos hidden lg:grid">
            {atributos.map(({ Icone, texto }) => (
              <li key={texto}>
                <Icone className="h-6 w-6 text-conteudo" />
                {texto}
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </section>
  )
}
