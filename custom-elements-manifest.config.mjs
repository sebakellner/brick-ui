import { relative } from 'node:path';
import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';
import { paths, requireRoots, root } from './scripts/roots.mjs';

requireRoots('components', 'src');

/* The analyzer joins `outdir` onto the working directory, so an absolute path there writes
 * into a directory named after the absolute path — `outdir: '/repo/src'` produced
 * `./repo/src/custom-elements.json` beside the one it was asked for. It gets the path
 * relative to the root, which is what it wants and what the repository has always used. */
export default {
  globs: [`${relative(root, paths.components)}/**/*.ts`],
  exclude: ['**/test/**', '**/*.stories.ts'],
  outdir: relative(root, paths.src),
  plugins: litPlugin(),
};
