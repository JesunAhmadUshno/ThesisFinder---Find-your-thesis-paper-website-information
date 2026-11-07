import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site imports ../run.py, ../fixtures/* and ../README.md at build time, so every number on the page is derived, never typed.
export default defineConfig({
  base: '/ThesisFinder---Find-your-thesis-paper-website-information/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
