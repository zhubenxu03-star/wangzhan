import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'react-bits-license',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'react-bits.LICENSE.txt', source: readFileSync(new URL('./react-bits.LICENSE.txt', import.meta.url), 'utf8') });
    },
  }],
});
