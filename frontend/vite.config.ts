import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet']
  },
  server: {
    port: 5173,
    proxy: {
      '/health': { target: 'http://127.0.0.1:8100' },
      '/search': { target: 'http://127.0.0.1:8100' },
      '/flight/': { target: 'http://127.0.0.1:8100' },
      '/flights/': { target: 'http://127.0.0.1:8100' },
      '/flights': {
        target: 'http://127.0.0.1:8100',
        bypass: (req) => (req.url === '/flights' || req.headers.accept?.includes('html')) ? '/index.html' : undefined
      },
      '/airport/': { target: 'http://127.0.0.1:8100' },
      '/airport': {
        target: 'http://127.0.0.1:8100',
        bypass: (req) => (req.url?.startsWith('/airport/') && !req.headers.accept?.includes('json') ? '/index.html' : undefined)
      },
      '/route/': { target: 'http://127.0.0.1:8100' },
      '/route': {
        target: 'http://127.0.0.1:8100',
        bypass: (req) => (req.headers.accept?.includes('html') ? '/index.html' : undefined)
      },
      '/airline/': { target: 'http://127.0.0.1:8100' },
      '/airline': {
        target: 'http://127.0.0.1:8100',
        bypass: (req) => (req.headers.accept?.includes('html') ? '/index.html' : undefined)
      },
      '/prediction': { target: 'http://127.0.0.1:8100' },
      '/predict': { target: 'http://127.0.0.1:8100' },
      '/map/': { target: 'http://127.0.0.1:8100' },
      '/map': {
        target: 'http://127.0.0.1:8100',
        bypass: (req) => (req.url === '/map' || req.headers.accept?.includes('html')) ? '/index.html' : undefined
      },
      '/india': { target: 'http://127.0.0.1:8100' }
    }
  }
})
