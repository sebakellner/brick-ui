/* A Storybook build that registers nothing looks finished from the outside: the page
 * loads, the manager is styled, every story renders as bare text because an unregistered
 * custom element shows its light-DOM children and nothing else. That is how GitHub Pages
 * served this kit for a day, so this check asks the only question the build cannot: did
 * every element this repository defines actually register?
 *
 * The failure it exists for: the `sideEffects` field named the compiled `define.js` only,
 * which is true for the published package and false for a build that reads the TypeScript
 * sources, so Rollup tree-shook every registration out of the bundle.
 *
 * What this cannot see: a tag registered through a constant or a helper (refused with a
 * message rather than skipped), a tag whose chunk exists but no page loads, and a build
 * that registers and then fails at runtime. Catches the shipped failure, not every one. */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT = process.argv[2] ?? 'storybook-static';
const DEFINE = /customElements\.define\(\s*['"`]([a-z0-9-]+)['"`]/g;
const DEFINE_CALL = /customElements\.define\(/g;

const componentsDir = 'src/components';
const components = readdirSync(componentsDir, { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
);

const tags = [];
const unreadable = [];

for (const dir of components) {
  const definePath = join(componentsDir, dir.name, 'define.ts');
  const isComponent = readdirSync(join(componentsDir, dir.name)).some((file) =>
    /^bk-.*\.ts$/.test(file),
  );
  let source;

  /* `shared/` is a layer, not an element: only a folder that carries a `bk-*.ts` element
   * is a component, and a component without a define.ts has lost its registration. */
  if (!isComponent) continue;

  try {
    source = readFileSync(definePath, 'utf8');
  } catch {
    unreadable.push(`${dir.name} has no define.ts`);
    continue;
  }

  const found = [...source.matchAll(DEFINE)].map((match) => match[1]);

  /* A registration written through a constant or a helper hides its tag from this
   * check, and a hidden tag is a tag nobody verifies. Say so instead of shrinking. */
  if (found.length === 0 && source.match(DEFINE_CALL)) {
    unreadable.push(`${dir.name}/define.ts registers a tag this check cannot read`);
  }

  tags.push(...found);
}

if (unreadable.length > 0) {
  console.error(
    `check:storybook — cannot build the expectation set:\n  ${unreadable.join('\n  ')}\n` +
      'Register each element with a literal tag, or extend this check to read that form.',
  );
  process.exit(1);
}

if (tags.length === 0) {
  console.error('check:storybook — no define.ts registered a tag; the check would prove nothing');
  process.exit(1);
}

const assetsDir = join(OUTPUT, 'assets');
let bundle;

try {
  bundle = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
    .join('\n');
} catch {
  console.error(`check:storybook — no build to inspect at ${assetsDir}; run build-storybook first`);
  process.exit(1);
}

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
