import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'copy-404',
      closeBundle() {
        const source = resolve(process.cwd(), 'public', '404.html');
        const destinationDir = resolve(process.cwd(), 'dist');
        const destination = resolve(destinationDir, '404.html');

        if (existsSync(source)) {
          mkdirSync(destinationDir, { recursive: true });
          copyFileSync(source, destination);
        }
      },
    },
  ],
});
