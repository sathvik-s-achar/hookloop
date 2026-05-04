import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- You must import 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This forces Recharts to use your main app's React instance!
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  }
})