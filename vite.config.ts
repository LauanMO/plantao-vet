import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // caminhos relativos: o mesmo build serve no GitHub Pages (/plantao-vet/) e no .zip da release
  base: './',
  plugins: [
    react(),
    // App instalável que joga sem internet: o service worker guarda o jogo inteiro na primeira visita.
    // Versão nova entra quando o jogo é aberto de novo, sem recarregar no meio de um caso.
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{html,js,css,woff,woff2,png}'] },
      manifest: {
        name: 'Plantão Vet',
        short_name: 'Plantão Vet',
        description: 'Jogo de estudo de Medicina Veterinária: atenda os casos do plantão.',
        lang: 'pt-BR',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#1b1a26',
        theme_color: '#1b1a26',
        icons: [
          { src: 'arte/app-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'arte/app-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'arte/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
