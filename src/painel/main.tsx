import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Painel from './Painel'
import '../index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado no config/index.html')

createRoot(container).render(
  <StrictMode>
    <Painel />
  </StrictMode>,
)
