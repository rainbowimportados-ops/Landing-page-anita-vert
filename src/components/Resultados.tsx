import { resultados } from '../config/resultados'
import { Reveal } from './Reveal'
import { Comparador } from './Comparador'

export function Resultados() {
  return (
    <section id="resultados" className="secao bg-fundo">
      <div className="container-vert">
        <Reveal className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="olho">Resultados reais</p>
            <h2 className="titulo-secao mt-3">Naturalidade em cada detalhe.</h2>
          </div>
          <p className="lead max-w-texto lg:justify-self-end">
            Os casos abaixo são comparativos visuais. Arraste a barra para observar o antes e o
            depois de cada registro, sem prometer que uma imagem representa todos os casos.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {resultados.map((resultado, indice) => (
              <Reveal key={resultado.id} delay={indice * 45} className={`result-bento result-bento--${resultado.id}`}>
              <figure className="resultado-card glass-card interactive-card">
                <Comparador resultado={resultado} />
                <figcaption className="resultado-card__caption">
                  <span className="resultado-card__label">{resultado.rotulo}</span>
                  <span>{resultado.legenda}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}

          <Reveal delay={resultados.length * 45} className="result-bento result-bento--video">
            <figure className="resultado-card resultado-card--video glass-card interactive-card">
              <video
                controls
                playsInline
                preload="metadata"
                poster="/assets/video-poster.webp"
                aria-label="Vídeo de resultado real do Instituto Vert"
              >
                <source src="/assets/resultado.mp4" type="video/mp4" />
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
          Cada caso é único. Os resultados podem variar de acordo com as características e
          necessidades de cada paciente.
        </p>
      </div>
    </section>
  )
}
