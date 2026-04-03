import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
     proxy: {
      '/api': {  // 所有以 /api 开头的请求都会被代理
        target: 'http://localhost:8080',  // 你的后端地址
        changeOrigin: true  // 改变请求源头
      },
      // 2. 代理所有以 /images 开头的图片资源请求
      // 这样前端访问 localhost:5173/images/xxx 会自动转发到 localhost:8080/images/xxx
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})

