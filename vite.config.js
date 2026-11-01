import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Les cartes générées sont un gros JSON : on le garde en chaîne, plus rapide à charger qu'un objet JS
  json: { stringify: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Les images des cartes viennent de Wikimedia Commons : gardées en cache pour le hors-ligne
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'upload.wikimedia.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-wikimedia',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Be Better — Culture générale',
        short_name: 'Be Better',
        description: 'Une carte par niveau, un quiz, des révisions : ta culture générale, chaque jour.',
        lang: 'fr',
        theme_color: '#191714',
        background_color: '#f5f2ec',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
