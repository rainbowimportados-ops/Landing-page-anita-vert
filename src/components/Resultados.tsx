import videoResultado from '../../assets/resultado.mp4'
import posterVideo from '../../assets/video-poster.webp'
import { CasoCompleto } from './CasosDestaque'
import { Reveal } from './Reveal'
import { ComparadorSorriso, registros } from './Sorrisos'

export function Resultados() {
  return (
    <section id="resultados" className="secao bg-fundo" aria-labelledby="resultados-titulo">
      <span id="sorrisos" className="block scroll-mt-24" />
      <div className="container-vert">
        <Reveal className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="olho">Sorrisos reais · Antes e depois</p>
            <h2 id="resultados-titulo" className="titulo-secao mt-3">O sorriso, em cada detalhe.</h2>
          </div>
          <p className="lead max-w-texto lg:justify-self-end">
            Deslize sobre as fotografias ou reproduza a transição para acompanhar o antes e
            depois dos sorrisos reais dos nossos pacientes.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <CasoCompleto />
        </Reveal>

        <div className="sorrisos-grid mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {registros.map((registro, indice) => (
              <Reveal key={registro.url} delay={indice * 45} className={`result-bento result-bento--caso-${indice + 1}`}>
              <div className="resultado-card glass-card sorriso-card">
                <h3 className="resultado-card__caption resultado-card__label">{registro.titulo}</h3>
                <ComparadorSorriso registro={registro} />
              </div>
            </Reveal>
          ))}

          <Reveal delay={registros.length * 45} className="result-bento result-bento--video">
            <figure className="resultado-card resultado-card--video glass-card interactive-card">
              <video
                controls
                playsInline
                preload="metadata"
                poster={posterVideo}
                aria-label="Vídeo de resultado real do Instituto Vert"
              >
                <source src={videoResultado} type="video/mp4" />
                Seu navegador não suporta vídeo.
              </video>
              <figcaption className="resultado-card__caption">
                <span className="resultado-card__label">Resultado em vídeo</span>
                <span>Reprodução manual, sem áudio automático.</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-conteudo-tenue">
          Fotografias originais, sem simulação digital do resultado. Cada caso é único. Os resultados podem variar de acordo com as características e
          necessidades de cada paciente.
        </p>
      </div>
    </section>
  )
}
