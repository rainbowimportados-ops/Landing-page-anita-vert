import videoResultado from '../../assets/resultado.mp4'
import posterVideo from '../../assets/video-poster.webp'
import { CasoCompleto } from './CasosDestaque'
import { ComparadorRosto } from './ComparadorRosto'
import { Reveal } from './Reveal'

export function Resultados() {
  return (
    <section id="resultados" className="secao" aria-labelledby="resultados-titulo">
      <span id="sorrisos" className="block scroll-mt-24" />
      <div className="container-vert">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="olho">Sorrisos reais · Antes e depois</p>
          <h2 id="resultados-titulo" className="titulo-secao mt-4">Resultados reais</h2>
          <p className="lead mt-4">
            Histórias que comprovam o que fazemos. Fotografias originais dos nossos pacientes, sem simulação do
            resultado.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <article className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:gap-12">
            <ComparadorRosto url="/assets/comparadores/rosto-antes-depois.webp" titulo="Resultado real de paciente do Instituto Vert" focoVertical={36} />
            <div>
              <p className="olho-linha">Caso em destaque</p>
              <h3 className="mt-4 font-display text-display-sm font-light text-conteudo">O sorriso que muda o rosto inteiro.</h3>
              <p className="mt-4 font-display text-xl leading-snug text-conteudo-suave">
                Mesma paciente, antes e depois do tratamento. Fotografia original, sem retoque do resultado.
              </p>
            </div>
          </article>
        </Reveal>

        <Reveal className="mt-14">
          <CasoCompleto />
        </Reveal>

        <Reveal className="mt-5">
          <figure className="tratamento-card grid overflow-hidden rounded-[1.5rem] border border-white/70 md:grid-cols-[0.6fr_1.4fr] md:items-center">
            <video
              controls
              playsInline
              preload="metadata"
              poster={posterVideo}
              aria-label="Vídeo de resultado real do Instituto Vert"
              className="aspect-[4/5] w-full bg-conteudo object-contain md:max-h-[28rem]"
            >
              <source src={videoResultado} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
            <figcaption className="p-7 sm:p-10">
              <p className="olho-linha">Resultado em vídeo</p>
              <p className="mt-4 font-display text-3xl font-light text-conteudo">Veja o sorriso em movimento.</p>
              <p className="mt-3 text-sm text-conteudo-suave">Reprodução manual, sem áudio automático.</p>
            </figcaption>
          </figure>
        </Reveal>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-conteudo-tenue">
          Fotografias originais, sem simulação digital do resultado. Cada caso é único. Os resultados podem variar de acordo com as características e
          necessidades de cada paciente.
        </p>
      </div>
    </section>
  )
}
