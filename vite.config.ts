import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Páginas no mesmo build: a landing page na raiz, o cartão digital em
// /cartao, os painéis /admin e /config, o acesso /gestao e as páginas
// de privacidade e termos.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        card: 'cartao/index.html',
        admin: 'admin/index.html',
        landing: 'index.html',
        config: 'config/index.html',
        privacidade: 'privacidade/index.html',
        termos: 'termos/index.html',
        gestao: 'gestao/index.html',
      },
    },
  },
})
