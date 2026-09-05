import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Três páginas no mesmo build: o cartão digital na raiz, o painel
// administrativo e a landing page de captação em /agendar.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        card: 'index.html',
        admin: 'admin/index.html',
        agendar: 'agendar/index.html',
      },
    },
  },
})
