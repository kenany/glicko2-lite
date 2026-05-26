import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  clean: true,
  dts: true,
  fixedExtension: true,
  format: ['cjs', 'esm'],
  hash: false,
});
