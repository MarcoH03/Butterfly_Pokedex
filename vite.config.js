import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    // Enables HTTPS on your local network so the PWA installs fully on iPhone
    // Safari will show a security warning the first time — tap "Advanced > Visit Website"
    basicSsl(),

    VitePWA({
      registerType: 'autoUpdate',

      // These are the files Vite will pre-cache on first load.
      // Everything in /public and all built JS/CSS is included automatically.
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,jpg,png,svg,webp}'],
        // Allow caching large image files (up to 5MB each)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      // manifest.json controls how the app looks when installed on iPhone
      manifest: {
        name: 'Mariposas de Cuba',
        short_name: 'Mariposas',
        description: 'A field guide to the butterflies of Cuba',
        theme_color: '#1a1c2c',
        background_color: '#1a1c2c',
        display: 'standalone',       // hides Safari chrome — feels like a native app
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],

  server: {
    // When you run `npm run dev:host`, Vite serves on your local IP
    // so your iPhone can reach it at https://192.168.x.x:5173
    host: true,
    port: 5173,
  }
})
