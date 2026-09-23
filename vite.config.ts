import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Allow Cloudflare / localtunnel preview hosts while developing.
    allowedHosts: true,
    host: true,
  },
})
