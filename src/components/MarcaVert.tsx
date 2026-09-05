import marcaVert from '../assets/marca-vert.png'

/**
 * Lockup oficial "INSTITUTO VERT", extraído de assets/logo-horizontal-oficial.jpeg.
 *
 * O arquivo oficial é JPEG com fundo marrom chapado, então colá-lo direto
 * viraria um retângulo marrom sobre o hero verde. Aqui a arte entra como
 * máscara CSS e a marca assume `currentColor` — é o que permite o mesmo
 * arquivo servir sobre o hero escuro e sobre o header claro, que era o que
 * o "V" em SVG fazia trocando de cor.
 */
export function MarcaVert({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        aspectRatio: '8 / 1',
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
