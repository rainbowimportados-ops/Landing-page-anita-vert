import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Canvas visual: links de saída e submissões não geram contatos ou mensagens.
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('a') : null
  if (target && !target.getAttribute('href')?.startsWith('#')) {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
}, true)
document.addEventListener('submit', event => {
  event.preventDefault()
  event.stopImmediatePropagation()
}, true)
const container = document.getElementById('root')
if (container) createRoot(container).render(<StrictMode><App /></StrictMode>)
