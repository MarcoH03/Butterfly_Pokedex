import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// Cambia REPO si el repositorio de GitHub tiene otro nombre.
const REPO = 'Butterfly_Pokedex'

export default defineConfig({
  // Imprescindible en GitHub Pages: si falta, la página sale en blanco.
  base: `/${REPO}/`,
  plugins: [
    react(),
    basicSsl(),               // HTTPS en la red local -> permite instalar la PWA en el iPhone
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,jpg,jpeg,png,webp,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      },
      manifest: {
        name: 'Mariposas de Cuba',
        short_name: 'Mariposas',
        description: 'Guía y libreta de campo de las mariposas de Cuba',
        lang: 'es',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `/${REPO}/`,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: { host: true, port: 5173 }
})
