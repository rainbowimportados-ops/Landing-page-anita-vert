import videoResultado from '../../assets/resultado.mp4'
import { VideoCameraLenta } from './movimento/VideoCameraLenta'
import posterVideo from '../../assets/video-poster.webp'
import { CasoCompleto } from './CasosDestaque'
import { ComparadorRosto } from './ComparadorRosto'
import { CreditosMidiaPaciente, MarcaMidiaPaciente } from './MarcaMidiaPaciente'
import { Reveal } from './Reveal'

export function Resultados() {
  return (
    <section id="resultados" className="secao resultados-cenario" aria-labelledby="resultados-titulo">
      <span id="sorrisos" className="block scroll-mt-24" />
      <figure className="resultados-cenario__foto" aria-hidden="true">
        <img src="/assets/ambientes/sorriso-vert.webp" alt="" loading="lazy" width="1100" height="1650" />
        <MarcaMidiaPaciente />
      </figure>
      <div className="container-vert resultados-cenario__conteudo">

        <Reveal variante="imagem">
          <article className="resultados-destaque grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:gap-12">
            <ComparadorRosto url="/assets/comparadores/rosto-antes-depois.webp" titulo="Resultado real de paciente do Instituto Vert" focoVertical={36} />
            <div className="order-first lg:order-none">
              <p className="olho">Sorrisos reais · Antes e depois</p>
              <h2 id="resultados-titulo" className="titulo-secao mt-3">Resultados reais</h2>
              <p className="lead mt-3">
                Histórias que comprovam o que fazemos. Fotografias originais dos nossos pacientes, sem simulação do resultado.
              </p>
              <p className="olho-linha mt-[clamp(1.25rem,4svh,2.25rem)]">Caso em destaque</p>
              <h3 className="mt-3 font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-light leading-tight text-conteudo">O sorriso que muda o rosto inteiro.</h3>
              <p className="mt-2 text-sm leading-relaxed text-conteudo-suave">
                Mesma paciente, antes e depois do tratamento. Fotografia original, sem retoque do resultado.
              </p>
            </div>
          </article>
        </Reveal>

        <Reveal className="mt-[clamp(2.5rem,8svh,4.5rem)]">
          <CasoCompleto />
        </Reveal>

        <Reveal variante="imagem" className="mt-[clamp(2.5rem,8svh,4.5rem)]">
          <figure className="tratamento-card grid overflow-hidden rounded-[1.5rem] border border-white/70 md:grid-cols-[0.6fr_1.4fr] md:items-center">
            <div className="midia-paciente__video">
              <VideoCameraLenta
                src={videoResultado}
                poster={posterVideo}
                rotulo="Vídeo de resultado real do Instituto Vert, em câmera lenta"
                className="aspect-[4/5] w-full bg-conteudo object-contain md:max-h-[min(28rem,calc(100svh-10rem))]"
              />
              <MarcaMidiaPaciente />
            </div>
            <figcaption className="p-7 sm:p-10">
              <p className="olho-linha">Resultado em vídeo</p>
              <p className="mt-4 font-display text-3xl font-light text-conteudo">Veja o sorriso em movimento.</p>
              <p className="mt-3 text-sm text-conteudo-suave">Em câmera lenta e sem som. Toque no vídeo para controlar.</p>
              <CreditosMidiaPaciente />
            </figcaption>
          </figure>
        </Reveal>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-conteudo-tenue">
          Fotografias originais, sem simulação digital do resultado. Cada caso é único. Os resultados podem variar de acordo com as características e
          necessidades de cada paciente.
        </p>
        <CreditosMidiaPaciente className="resultados-cenario__creditos" />
      </div>
    </section>
  )
}
