// Explicit Babel config used only by Jest (Vite uses esbuild, not Babel, for dev/build).
// Kept as .cjs so it loads as CommonJS regardless of this package's "type": "module".
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
