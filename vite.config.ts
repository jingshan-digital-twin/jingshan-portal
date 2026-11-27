import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 前后端分离：开发时将 /api 代理到 Spring Boot 后端（默认 127.0.0.1:8080，可通过 API_TARGET 覆盖）
const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}'],
    },
  },
})
