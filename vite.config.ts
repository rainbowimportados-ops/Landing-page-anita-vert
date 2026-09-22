import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Quatro páginas no mesmo build: o cartão digital na raiz, o painel do
// cartão, a landing page de captação em /agendar e a configuração dela
// em /config.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        card: 'index.html',
        admin: 'admin/index.html',
        agendar: 'agendar/index.html',
        config: 'config/index.html',
      },
    },
  },
})
