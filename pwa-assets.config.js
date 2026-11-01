import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Fond sombre pour les icônes masquables (Android) et Apple, au lieu du blanc par défaut
const background = { background: '#191714' }

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: background },
    apple: { ...minimal2023Preset.apple, resizeOptions: background },
  },
  images: ['public/icon.svg'],
})
