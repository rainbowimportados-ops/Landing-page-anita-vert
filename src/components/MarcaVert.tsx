const marcaVert = '/assets/marca/wordmark-horizontal-light.png'

/**
 * Lockup oficial "INSTITUTO VERT" usado como máscara CSS.
 * A arte mantém exatamente as proporções e a tipografia recebidas, enquanto
 * `currentColor` permite a leitura correta sobre hero escuro e header claro.
 */
export function MarcaVert({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        aspectRatio: '1444 / 312',
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${marcaVert})`,
        maskImage: `url(${marcaVert})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'left center',
        maskPosition: 'left center',
      }}
    />
  )
}
