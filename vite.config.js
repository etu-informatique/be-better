import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Sur GitHub Pages, l'app est servie sous /be-better/ : le workflow de publication fixe BASE_PATH.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      workbox: {
        // Le contenu (public/content) n'est pas préchargé en entier : il est mis en cache
        // au fur et à mesure, comme les images.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/content/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'contenu', expiration: { maxEntries: 100 } },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'upload.wikimedia.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-wikimedia',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 },
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
        scope: '.',
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
