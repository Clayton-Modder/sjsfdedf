import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'MegaTV - TV Online',
        short_name: 'MegaTV',
        description: 'Assista TV Online Grátis',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Fallback generic TV icon
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Strategy: Cache First for Channel Logos
            // Matches: https://embedtv.best/assets/images/*
            urlPattern: ({ url }) => url.hostname === 'embedtv.best' && url.pathname.includes('/assets/images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'channel-logos-cache',
              expiration: {
                maxEntries: 100, // Keep most recent 100 logos
                maxAgeSeconds: 60 * 60 * 24 * 30, // Cache for 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Strategy: Network First for API calls (if we had a real endpoint)
            // or other external resources
            urlPattern: ({ url }) => url.pathname.includes('channels.php'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 3,
            },
          }
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
  }
});