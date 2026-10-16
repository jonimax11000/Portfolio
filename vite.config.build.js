// Config temporal para build sin importar 'vite' (no está en node_modules local)
export default {
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    target: 'es2022',
    minify: 'esbuild'
  }
};
