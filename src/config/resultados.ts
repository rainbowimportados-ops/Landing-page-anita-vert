/**
 * Pares de resultados usados no redesign.
 *
 * Os arquivos atuais são recortes determinísticos das montagens autorizadas
 * existentes em /assets. Para incorporar os dois novos JPGs quando estiverem
 * disponíveis, adicione os arquivos em /assets/comparadores e substitua apenas
 * `antes` e `depois` no item correspondente — sem retocar ou alinhar rostos.
 */
export type ResultadoComparador = {
  id: string
  rotulo: string
  legenda: string
  antes: string
  depois: string
}

export const resultados: ResultadoComparador[] = [
  {
    id: 'caso-1',
    rotulo: 'Caso real 01',
    legenda: 'Comparativo visual de um sorriso real.',
    antes: '/assets/comparadores/caso-1-antes.webp',
    depois: '/assets/comparadores/caso-1-depois.webp',
  },
  {
    id: 'caso-2',
    rotulo: 'Caso real 02',
    legenda: 'Detalhes do sorriso vistos de perto.',
    antes: '/assets/comparadores/caso-2-antes.webp',
    depois: '/assets/comparadores/caso-2-depois.webp',
  },
  {
    id: 'caso-3',
    rotulo: 'Caso real 03',
    legenda: 'Uma mudança observada no conjunto do sorriso.',
    antes: '/assets/comparadores/caso-3-antes.webp',
    depois: '/assets/comparadores/caso-3-depois.webp',
  },
]
