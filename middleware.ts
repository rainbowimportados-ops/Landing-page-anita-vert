import { rewrite } from '@vercel/functions'

/**
 * Faz vert.institutovert.app servir a landing page na raiz.
 *
 * Isto não dá para resolver com `rewrites` no vercel.json: o sistema de
 * arquivos é consultado antes deles, e como existe um index.html real na raiz
 * (o cartão digital), o rewrite nunca chegava a ser avaliado. Verifiquei em
 * produção — o subdomínio servia o cartão. O middleware roda antes de tudo.
 *
 * Só a raiz é interceptada: /config e o restante seguem o caminho normal.
 */
export const config = {
  matcher: '/',
}

const SUBDOMINIO = 'vert.institutovert.app'

export default function middleware(request: Request) {
  const host = request.headers.get('host')
  if (host !== SUBDOMINIO) return

  return rewrite(new URL('/agendar', request.url))
}
