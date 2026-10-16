import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AvisoPrivacidade } from './components/AvisoPrivacidade'
import { BotaoAvaliar } from './components/Avaliacoes'
import { MarcaVert } from './components/MarcaVert'
import { ProvedorDeConteudo, useConteudo } from './lib/ConteudoContexto'
import './index.css'

/**
 * Página de destino do QR code do consultório e dos links de WhatsApp.
 * `/avaliar?u=franca` mostra só a unidade escolhida; sem `u`, o cliente
 * escolhe onde foi atendido. O QR aponta para cá (e não direto ao Google)
 * para o link poder mudar sem reimprimir nada.
 */
function Avaliar() {
  const { clinica, unidades } = useConteudo()
  const slug = new URLSearchParams(window.location.search).get('u')
  const comLink = unidades.filter((u) => u.avaliacaoUrl)
  const escolhida = comLink.find((u) => u.slug === slug)
  const lista = escolhida ? [escolhida] : comLink

  return (
    <div className="min-h-screen bg-fundo text-conteudo">
      <header className="border-b border-borda bg-superficie-inversa text-conteudo-inverso">
        <div className="container-vert flex h-[4.5rem] items-center justify-between">
          <a href="/" aria-label={`${clinica.nome} — início`} className="inline-flex min-h-[44px] items-center">
            <MarcaVert className="h-6" />
          </a>
          <a href="/" className="text-sm text-conteudo-inverso-suave underline-offset-4 hover:underline">Ir ao site</a>
        </div>
      </header>
      <main className="container-vert max-w-xl py-14 text-center sm:py-20">
        <p className="olho justify-center">Sua opinião</p>
        <h1 className="titulo-secao mt-3">Como foi o seu atendimento?</h1>
        <p className="lead mt-4">
          Sua avaliação no Google leva menos de um minuto e nos ajuda muito. Obrigado pela confiança!
        </p>
        <ul className="mt-9 grid gap-3">
          {lista.map((unidade) => (
            <li key={unidade.slug} className="grid gap-1.5">
              <BotaoAvaliar unidade={unidade} rastreio={`avaliar_pagina_${unidade.slug}`} className="w-full text-base">
                {lista.length > 1 ? `Avaliar ${unidade.nome}` : 'Avaliar no Google'}
              </BotaoAvaliar>
              <span className="text-xs text-conteudo-tenue">{unidade.cidade}</span>
            </li>
          ))}
        </ul>
        {lista.length === 0 && <p className="mt-9 text-conteudo-suave">Em breve disponível. Obrigado!</p>}
        <p className="mt-8 text-xs leading-relaxed text-conteudo-tenue">
          Você será levado ao Google e precisa estar com a sua conta Google conectada.
        </p>
      </main>
      <AvisoPrivacidade />
    </div>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado')
createRoot(container).render(
  <StrictMode>
    <ProvedorDeConteudo>
      <Avaliar />
    </ProvedorDeConteudo>
  </StrictMode>,
)
