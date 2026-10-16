import { defineConfig } from 'vite';

// base: './' → rutas relativas en el build, requisito para GitHub Pages
// (el proyecto se sirve desde https://usuario.github.io/portfolio/, no desde la raíz del dominio).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    // R33: CSS en un único archivo minificado (cssCodeSplit) y target moderno
    // (sin transpilación legacy: la baseline es evergreen, ver SPEC §11).
    cssCodeSplit: false,
    target: 'es2022',
    minify: 'esbuild'
  }
});
