import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

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

function createDemoEntry() {
  return {
    name: 'create-demo-entry',
    closeBundle() {
      const output = resolve(rootDirectory, 'dist');
      mkdirSync(resolve(output, 'demo'), { recursive: true });
      writeFileSync(resolve(output, 'demo/index.html'), readFileSync(resolve(output, 'index.html')));
    }
  };
}

export default defineConfig({
  plugins: [injectServiceWorkerAssets(), createDemoEntry()],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        app: resolve(rootDirectory, 'index.html'),
        notFound: resolve(rootDirectory, '404.html'),
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
