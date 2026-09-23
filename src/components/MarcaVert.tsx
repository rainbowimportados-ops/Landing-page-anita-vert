type Variante = 'horizontal' | 'stacked' | 'circular' | 'dark'
const arquivos: Record<Variante, string> = {
  horizontal: 'horizontal-light', stacked: 'stacked-light',
  circular: 'circular-light', dark: 'circular-dark',
}
/** Only byte-identical approved originals. Never recolor or recreate this mark. */
export function MarcaVert({ className = '', variante = 'horizontal', decorativa = false }: { className?: string; variante?: Variante; decorativa?: boolean }) {
  return <span className={`official-brand official-brand--${variante === 'dark' ? 'circular official-brand--dark' : variante} ${className}`} aria-hidden={decorativa || undefined}>
    <img src={`/assets/brand-official/${arquivos[variante]}.jpeg`} alt={decorativa ? '' : 'Instituto Vert'} />
  </span>
}
