import { IconLocal, IconPrancheta, IconEquipe } from './Icon'

/**
 * Faixa logo abaixo da dobra. Só afirma o que a clínica de fato oferece —
 * nada de números inventados de pacientes ou anos de mercado.
 */
const pontos = [
  { Icone: IconLocal, titulo: 'Duas unidades', texto: 'Franca e Ribeirão Preto' },
  { Icone: IconEquipe, titulo: 'Estética e clínica', texto: 'A mesma equipe nas duas frentes' },
  { Icone: IconPrancheta, titulo: 'Plano por escrito', texto: 'Etapas, sessões e valores' },
]

export function Confianca() {
  return (
    <section className="border-b border-borda bg-superficie">
      <div className="container-vert grid gap-px py-2 sm:grid-cols-3">
        {pontos.map(({ Icone, titulo, texto }) => (
          <div key={titulo} className="flex items-center gap-3 py-4 sm:justify-center sm:py-6">
            <Icone className="h-5 w-5 shrink-0 text-marca" />
            <p className="text-sm">
              <span className="font-semibold text-conteudo">{titulo}</span>
              <span className="text-conteudo-tenue"> · {texto}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
