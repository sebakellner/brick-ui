/* A Storybook build that registers nothing looks finished from the outside: the page
 * loads, the manager is styled, every story renders as bare text because an unregistered
 * custom element shows its light-DOM children and nothing else. That is how GitHub Pages
 * served this kit for a day, so this check asks the only question the build cannot: did
 * every element this repository defines actually register?
 *
 * The failure it exists for: the `sideEffects` field named the compiled `define.js` only,
 * which is true for the published package and false for a build that reads the TypeScript
 * sources, so Rollup tree-shook every registration out of the bundle. */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT = process.argv[2] ?? 'storybook-static';
const DEFINE = /customElements\.define\(\s*['"`]([a-z0-9-]+)['"`]/g;

const componentsDir = 'src/components';
const tags = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((dir) => {
    const definePath = join(componentsDir, dir.name, 'define.ts');

    try {
      const source = readFileSync(definePath, 'utf8');

      return [...source.matchAll(DEFINE)].map((match) => match[1]);
    } catch {
      return [];
    }
  });

if (tags.length === 0) {
  console.error('check:storybook — no define.ts registered a tag; the check would prove nothing');
  process.exit(1);
}

const assetsDir = join(OUTPUT, 'assets');
const bundle = readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
  .join('\n');

const missing = tags.filter(
  (tag) => !new RegExp(`customElements\\.define\\(\\s*[\`'"]${tag}[\`'"]`).test(bundle),
);

if (missing.length > 0) {
  console.error(
    `check:storybook — the build registers no element for: ${missing.join(', ')}\n` +
      'A story renders bare text when its element never upgraded. The usual cause is a ' +
      '`sideEffects` field that does not match the extension the build reads.',
  );
  process.exit(1);
}

console.log(`check:storybook — every defined element registers (${tags.length} tags)`);
