import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Чтобы Vite был виден извне контейнера
    port: 5173, strictPort: true,
    allowedHosts: [
      'ministry.loc'
    ],
    proxy: {
      // '/api': {
      //   target: 'http://chess_back', // Имя сервиса из docker-compose
      //   changeOrigin: true,
      //   // Если в папке backend файлы лежат сразу (без папки api), оставляем rewrite:
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      // },
    },
    watch: {
      usePolling: true, // Обязательно для WSL! Иначе правки кода не будут подхватываться сразу
    },
  },
})