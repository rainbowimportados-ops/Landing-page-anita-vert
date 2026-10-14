export const BLOCOS = [
  ['detalhes', 'Apresentação'], ['banner', 'Campanha em destaque'],
  ['tratamentos', 'Tratamentos'], ['resultados', 'Antes e depois'],
  ['sobre', 'Sobre a clínica'], ['diferenciais', 'Diferenciais'],
  ['etapas', 'Como funciona'], ['instagram', 'Instagram'],
  ['depoimentos', 'Depoimentos'], ['unidades', 'Unidades'],
  ['cursos', 'Cursos e locação'], ['duvidas', 'Perguntas frequentes'],
] as const
export type BlocoId = typeof BLOCOS[number][0]
export type Bloco = { id: BlocoId; visivel: boolean }
/** Completa versões antigas e ignora IDs desconhecidos ou repetidos. */
export function normalizarBlocos(valor: unknown): Bloco[] {
  const result: Bloco[] = []
  for (const item of Array.isArray(valor) ? valor : []) {
    if (!item || !BLOCOS.some(([id]) => id === item.id) || result.some(b => b.id === item.id)) continue
    result.push({ id: item.id as BlocoId, visivel: item.visivel !== false })
  }
  for (const [id] of BLOCOS) if (!result.some(b => b.id === id)) result.push({ id, visivel: true })
  // Unidades é destino dos botões do topo e permanece disponível.
  return result.map(b => b.id === 'unidades' ? { ...b, visivel: true } : b)
}
