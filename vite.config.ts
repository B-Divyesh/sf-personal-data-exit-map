import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const rootDirectory = new URL('.', import.meta.url).pathname;

function injectServiceWorkerAssets() {
  return {
    name: 'inject-service-worker-assets',
    closeBundle() {
      const assetDirectory = resolve(rootDirectory, 'dist/assets');
      const serviceWorker = resolve(rootDirectory, 'dist/sw.js');
      const assets = readdirSync(assetDirectory, { recursive: true })
        .filter((file): file is string => typeof file === 'string')
        .filter((file) => !file.endsWith('.map'))
        .map((file) => `/assets/${file.replaceAll('\\', '/')}`);
      const source = readFileSync(serviceWorker, 'utf8');
      writeFileSync(serviceWorker, source.replace('/* INJECT_ASSETS */', assets.map((asset) => JSON.stringify(asset)).join(', ')));
    }
  };
}

export default defineConfig({
  plugins: [injectServiceWorkerAssets()],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        app: resolve(rootDirectory, 'index.html'),
        privacy: resolve(rootDirectory, 'privacy/index.html'),
        terms: resolve(rootDirectory, 'terms/index.html')
      }
    }
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
});
