import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// BASE_PATH wird im GitHub-Actions-Build gesetzt (z.B. /classroomtools/)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: { environment: 'node' },
});
