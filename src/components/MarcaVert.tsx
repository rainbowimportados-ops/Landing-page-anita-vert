import marcaHorizontal from '../assets/marca-vert.png'
import marcaEmpilhada from '../assets/marcaVertEmpilhada'
import marcaCircular from '../assets/marcaVertCircular'

/**
 * Logos oficiais do Instituto Vert, sem redesenho.
 *
 * - `horizontal`: "INSTITUTO VERT" em linha, extraído de
 *   assets/logo-horizontal-oficial.jpeg.
 * - `circular`: arco com "INSTITUTO" e "VERT", extraído de
 *   public/assets/marca/logo-circular-principal.png (marcaVertCircular.ts).
 * - `empilhada`: "INSTITUTO" sobre "VERT", extraído de
 *   public/assets/marca/logo-horizontal-clara.png (data URI em marcaVertEmpilhada.ts).
 *
 * Os originais são JPEG/PNG com fundo marrom chapado. Aqui cada arte entra
 * como máscara CSS e assume `currentColor`, o que permite usar a mesma versão
 * sobre fundo escuro e claro (inversão permitida pelo manual). Nunca combinar
 * duas versões nem juntar a arte com texto digitado: cada local usa UMA versão
 * oficial completa.
 */
const versoes = {
  horizontal: { src: marcaHorizontal, proporcao: '8 / 1' },
  empilhada: { src: marcaEmpilhada, proporcao: '221 / 100' },
  circular: { src: marcaCircular, proporcao: '320 / 334' },
} as const

export type VersaoMarca = keyof typeof versoes

export function MarcaVert({
  className = '',
  versao = 'horizontal',
}: {
  className?: string
  versao?: VersaoMarca
}) {
  const { src, proporcao } = versoes[versao]
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        aspectRatio: proporcao,
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
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
