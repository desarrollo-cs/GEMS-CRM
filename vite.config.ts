import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Configuración inteligente de base según el ambiente
  // - Desarrollo: '/'
  // - GitHub Pages con dominio personalizado: '/'
  // - GitHub Pages sin dominio personalizado: '/GEMS-CRM/'
  base: process.env.CUSTOM_DOMAIN === 'true' ? '/' : 
        (process.env.GITHUB_PAGES === 'true' ? '/GEMS-CRM/' : '/'),
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Librerías base en su propio chunk: cambian poco, así el navegador las
    // reutiliza de caché entre despliegues en vez de bajarlas otra vez.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['axios', 'date-fns', 'socket.io-client', 'sweetalert2']
        }
      }
    }
  },
  server: {
    // Configuración para desarrollo local
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://back-crm-ahcmawg9bnczgad6.canadacentral-01.azurewebsites.net',
        changeOrigin: true,
        secure: false, // Ignorar errores de certificado SSL en desarrollo
        rewrite: (path) => path
      },
      '/uploads': {
        target: 'https://back-crm-ahcmawg9bnczgad6.canadacentral-01.azurewebsites.net',
        changeOrigin: true,
        secure: false, // Ignorar errores de certificado SSL en desarrollo
        rewrite: (path) => path
      }
    }
  }
})
//testeo de subida