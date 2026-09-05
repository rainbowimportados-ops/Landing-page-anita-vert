import { registrarClique } from '../lib/analytics'
import { useConteudo } from '../lib/ConteudoContexto'
import { Reveal } from './Reveal'

/** Campanha em destaque. Não aparece enquanto não houver imagem ou título. */
export function Banner() {
  const { banner } = useConteudo()
  if (!banner) return null

  const conteudo = (
    <div className="overflow-hidden rounded-painel border border-borda bg-superficie shadow-1">
      {banner.imagem && (
        <img
          src={banner.imagem}
          alt={banner.titulo ?? 'Campanha do Instituto Vert'}
          className="w-full object-cover"
          loading="lazy"
        />
      )}
      {(banner.titulo || banner.texto) && (
        <div className="p-6 sm:p-8">
          {banner.titulo && (
            <h2 className="font-display text-2xl text-conteudo">{banner.titulo}</h2>
          )}
          {banner.texto && <p className="lead mt-2">{banner.texto}</p>}
        </div>
      )}
    </div>
  )

  return (
    <section className="bg-fundo pt-16 sm:pt-20">
      <div className="container-vert">
        <Reveal>
          {banner.link ? (
            <a
              href={banner.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarClique('banner_campanha')}
              className="block transition duration-padrao ease-saida hover-fino:hover:-translate-y-1"
            >
              {conteudo}
            </a>
          ) : (
            conteudo
          )}
        </Reveal>
      </div>
    </section>
  )
}
