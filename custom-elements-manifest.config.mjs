import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';
import { paths, requireRoots } from './scripts/roots.mjs';

requireRoots('components', 'src');

export default {
  globs: [`${paths.components}/**/*.ts`],
  exclude: ['**/test/**', '**/*.stories.ts'],
  outdir: paths.src,
  plugins: litPlugin(),
};
