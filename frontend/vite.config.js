import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          // react-pdf (ya sale solo por el lazy import, pero por si acaso)
          if (id.includes('node_modules/@react-pdf/') || id.includes('node_modules/pdfkit')) {
            return 'react-pdf';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          // Librerías de países/teléfonos
          if (id.includes('node_modules/country-state-city') || id.includes('node_modules/libphonenumber') || id.includes('node_modules/google-libphonenumber')) {
            return 'geo';
          }
          // Resend / email
          if (id.includes('node_modules/resend') || id.includes('node_modules/@react-email')) {
            return 'email';
          }
          // Resto de node_modules → vendor
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
