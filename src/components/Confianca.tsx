/**
 * Faixa de fatos logo abaixo da dobra. Só afirma o que a clínica de fato
 * oferece — nada de números inventados de pacientes ou de satisfação.
 */
const fatos = [
  { titulo: 'Resultados reais', texto: 'Fotografias sem retoque' },
  { titulo: 'Plano por escrito', texto: 'Etapas, sessões e valores' },
  { titulo: 'Dois endereços', texto: 'Franca e Ribeirão Preto' },
]

export function Confianca() {
  return (
    <section className="faixa-fatos border-y border-borda/80">
      <div className="container-vert grid gap-6 py-9 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr] lg:items-center lg:gap-0">
        {fatos.map(({ titulo, texto }) => (
          <div key={titulo} className="lg:border-r lg:border-borda-forte/70 lg:px-8 lg:first:pl-0">
            <p className="font-display text-3xl font-light text-conteudo">{titulo}</p>
            <p className="mt-1 text-sm text-conteudo-suave">{texto}</p>
          </div>
        ))}
        <blockquote className="sm:col-span-3 lg:col-span-1 lg:pl-10">
          <p className="font-display text-2xl italic leading-snug text-conteudo">
            “Cada sorriso tem uma história… e é por isso que fazemos o que fazemos.”
          </p>
          <span className="mt-4 block h-px w-12 bg-conteudo/60" aria-hidden="true" />
        </blockquote>
      </div>
    </section>
  )
}
