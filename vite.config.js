import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // CRITICAL for GitHub Pages: must match your repo name exactly
  // Change 'mariposas-cuba' if your repo has a different name
  base: '/mariposas-cuba/',

  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,jpg,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Mariposas de Cuba',
        short_name: 'Mariposas',
        description: 'A field guide to the butterflies of Cuba',
        theme_color: '#1a1c2c',
        background_color: '#1a1c2c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/mariposas-cuba/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
  }
})
