import { profissionais } from '../config/site'
import { useConteudo } from '../lib/ConteudoContexto'
import { BotaoWhatsApp } from './CTA'
import { Reveal } from './Reveal'

/** Cursos em destaque; locação de consultório como frente secundária. */
export function Dentistas() {
  const { clinica } = useConteudo()
  const [cursos, locacao] = profissionais.itens

  return (
    <section id="cursos" className="secao relative overflow-hidden bg-superficie-inversa text-conteudo-inverso" aria-labelledby="cursos-titulo">
      <span id="dentistas" className="absolute top-0" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-[28rem] w-[28rem] rounded-full bg-realce/20 blur-3xl" />

      <div className="container-vert relative">
        <Reveal className="max-w-texto">
          <p className="olho text-conteudo-inverso-tenue">{profissionais.titulo} · Cursos</p>
          <h2 id="cursos-titulo" className="mt-3 font-display text-display-sm">
            Aprender estética na prática, com quem atende todos os dias.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-conteudo-inverso-suave">{profissionais.texto}</p>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Reveal>
            <article className="cursos-painel glass-card glass-card--dark flex h-full flex-col rounded-card border border-borda-inversa p-7 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-realce">Formação</p>
              <h3 className="mt-3 font-display text-3xl sm:text-4xl">{cursos.titulo}</h3>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-conteudo-inverso-suave">{cursos.texto}</p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {['Estética e reabilitação', 'Prática clínica', 'Turmas reduzidas'].map((item) => (
                  <li key={item} className="rounded-2xl border border-borda-inversa bg-superficie-inversa/60 px-4 py-3 text-sm text-conteudo-inverso">
                    {item}
                  </li>
                ))}
              </ul>
              <BotaoWhatsApp
                rastreio="dentistas_cursos"
                intencao="curso"
                numero={clinica.whatsappComercial}
                mensagem={cursos.mensagem}
                variante="clara"
                className="mt-8 self-start"
              >
                {cursos.botao}
              </BotaoWhatsApp>
            </article>
          </Reveal>

          <Reveal delay={60}>
            <article className="glass-card glass-card--dark flex h-full flex-col rounded-card border border-borda-inversa bg-superficie-inversa-suave/50 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-conteudo-inverso-tenue">Estrutura</p>
              <h3 className="mt-3 font-display text-2xl">{locacao.titulo}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-conteudo-inverso-suave">{locacao.texto}</p>
              <BotaoWhatsApp
                rastreio="dentistas_locacao"
                intencao="locacao"
                numero={clinica.whatsappComercial}
                mensagem={locacao.mensagem}
                variante="clara"
                className="mt-6 self-start"
              >
                {locacao.botao}
              </BotaoWhatsApp>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
