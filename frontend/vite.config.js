import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // react-pdf primero (tiene sus propios módulos de React internamente)
          if (id.includes('node_modules/@react-pdf/') || id.includes('node_modules/pdfkit')) {
            return 'react-pdf';
          }
          // React core — debe ir ANTES que cualquier lib que dependa de React
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-is/')
          ) {
            return 'react-core';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          // Librerías que dependen de React (react-select, react-signature-canvas, etc.)
          if (
            id.includes('node_modules/react-select') ||
            id.includes('node_modules/react-signature-canvas') ||
            id.includes('node_modules/@emotion/')
          ) {
            return 'react-libs';
          }
          // Resto de node_modules → vendor (no dependen de React)
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
