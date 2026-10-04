import { IconCheck, IconCoracao, IconEquipe, IconEscudo } from './Icon'
import { Reveal } from './Reveal'
import { ComparadorSorriso } from './Sorrisos'

const itens = [
  { Icone: IconCheck, texto: 'Tratamentos personalizados' },
  { Icone: IconEquipe, texto: 'Equipe experiente' },
  { Icone: IconEscudo, texto: 'Plano por escrito, com etapas e valores' },
  { Icone: IconCoracao, texto: 'Resultados que elevam a sua autoestima' },
]

/** Segunda dobra: o sorriso de perto, com o comparador de arrastar. */
export function Detalhes() {
  return (
    <section className="relative py-[clamp(1.5rem,5svh,3.5rem)]" aria-labelledby="detalhes-titulo">
      <div className="container-vert grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-12">
        <Reveal variante="imagem">
          <ComparadorSorriso
            className="detalhes-comparador"
            registro={{ url: '/assets/comparadores/caso-perto-1.webp', titulo: 'Sorriso de perto', largura: 1100, altura: 1100 }}
          />
        </Reveal>
        <Reveal delay={80}>
          <p className="olho-linha">Detalhes que fazem a diferença</p>
          <h2 id="detalhes-titulo" className="mt-4 font-display text-display-sm font-light text-conteudo">
            Mais que um sorriso.
            <br />
            Uma nova fase.
          </h2>
          <p className="mt-4 font-display text-lg leading-snug text-conteudo-suave sm:mt-5 sm:text-xl">
            Lentes, clareamento, alinhamento ou implantes. Cada tratamento é planejado para o seu momento e para o
            resultado que você deseja.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:mt-7 sm:grid-cols-1">
            {itens.map(({ Icone, texto }) => (
              <li key={texto} className="flex items-center gap-2.5 text-sm text-conteudo sm:gap-4 sm:text-[0.95rem]">
                <Icone className="h-5 w-5 shrink-0 text-conteudo sm:h-6 sm:w-6" />
                {texto}
              </li>
            ))}
          </ul>
          <a
            href="#tratamentos"
            className="mt-6 inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-marca-forte px-7 py-3 text-sm font-medium text-conteudo-inverso shadow-2 transition duration-padrao ease-saida hover-fino:hover:bg-conteudo active:scale-[0.98]"
          >
            Conheça nossos tratamentos <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  )
}
