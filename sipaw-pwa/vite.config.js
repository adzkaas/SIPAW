import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'placeholder-alat.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'SIPAW - Sistem Peminjaman Alat WAPEALA',
        short_name: 'SIPAW WAPEALA',
        description: 'Aplikasi PWA Manajemen Inventaris & Peminjaman Alat WAPEALA UNDIP',
        theme_color: '#12382d',
        background_color: '#f4f5f0',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sipaw-supabase-cache',
              expiration: { maxEntries: 150, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
})
