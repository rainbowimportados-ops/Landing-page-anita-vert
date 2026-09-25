import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registrarClique } from './lib/analytics'
import { origemDaVisita } from './lib/origem'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado no index.html')

// Guarda a origem da sessão e conta a visita (anônima) uma vez por carregamento.
origemDaVisita()
registrarClique('visualizacao_pagina', null, 'page_view')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
