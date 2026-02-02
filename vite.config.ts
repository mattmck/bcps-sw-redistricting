import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'angular-app/public',
  // Set base path for GitHub Pages deployment (repo name)
  // For custom domain or Azure Static Web Apps, this will be '/'
  base: process.env.GITHUB_PAGES === 'true' ? '/bcps-sw-redistricting/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
