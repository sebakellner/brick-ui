import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* One place that knows where the tree lives.
 *
 * Every check and every config reads its roots from here instead of writing `src/...`
 * itself, so that moving a directory is one edit and not six, and so that a root that no
 * longer exists fails loudly: a check that walks an empty path passes, and a gate that
 * passes over nothing is worse than no gate.
 *
 * `BRIKKA_ROOT` overrides the resolution, which is how the acceptance for this change is
 * proved — point it at a directory that is not the repository and every check must fail
 * with the name of the root it could not find. */

export const root = process.env.BRIKKA_ROOT ?? dirname(dirname(fileURLToPath(import.meta.url)));

const at = (...parts) => join(root, ...parts);

export const paths = {
  src: at('packages', 'web-components', 'src'),
  components: at('packages', 'web-components', 'src', 'components'),
  stylesTokens: at('packages', 'styles', 'src', 'tokens'),
  colorCss: at('packages', 'styles', 'src', 'tokens', 'color.css'),
  hooks: at('packages', 'styles', 'style-dictionary.config.mjs'),
  storybook: at('storybook', 'web-components', '.storybook'),
  tokensJson: at('packages', 'styles', 'tokens'),
  manifest: at('packages', 'web-components', 'src', 'custom-elements.json'),
  styles: at('packages', 'styles', 'src'),
};

export class MissingRoot extends Error {
  constructor(name, path) {
    super(`root check: ${name} does not exist at ${path}. BRIKKA_ROOT is ${root}`);
    this.name = 'MissingRoot';
  }
}

/* Called at the top of a check, before it walks anything. */
export const requireRoots = (...names) => {
  for (const name of names) {
    if (!existsSync(paths[name])) throw new MissingRoot(name, paths[name]);
  }
};
