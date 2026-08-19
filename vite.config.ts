import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const certificateDirectory = process.env.VITE_DEV_CERT_DIR

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/forma-school-favicon-v2.ico', 'icons/forma-school-apple-180-v2.png'],
      manifest: {
        id: '/?source=pwa-v2',
        name: 'Forma Школа — учёба и тесты',
        short_name: 'Forma Школа',
        description: 'Семейные учебные планы, тесты и работа над ошибками',
        lang: 'ru',
        theme_color: '#07245b',
        background_color: '#07245b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/forma-school-icon-192-v2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/forma-school-icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        importScripts: ['/push-sw.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-get-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 14
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: process.env.VITE_DEV_HOST || 'localhost',
    port: 5173,
    strictPort: false,
    https: certificateDirectory ? {
      key: readFileSync(resolve(certificateDirectory, 'key.pem')),
      cert: readFileSync(resolve(certificateDirectory, 'cert.pem'))
    } : undefined,
    proxy: process.env.VITE_DEV_API_PROXY ? {
      '/api': {target: process.env.VITE_DEV_API_PROXY, changeOrigin: true}
    } : undefined
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
