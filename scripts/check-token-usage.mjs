/**
 * Two checks over the `--bk-*` names that live inside CSS strings, where no
 * other tooling can see them.
 *
 * 1. Every name a component reads must exist: either as a declared token
 *    (generated CSS) or as a hook (a name the component reads or sets that the
 *    token source does not declare). A typo here renders nothing at runtime and
 *    no other check catches it, because the name lives inside a CSS string.
 *
 * 2. Every semantic role must be read by a component. A role that nothing reads
 *    is a public contract with no behaviour: it costs a breaking change to
 *    delete later. Ten of them were removed by hand in d9dfacd, and this check
 *    is that cleanup made repeatable. See docs/conventions-tokens.md (R1).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOKENS_CSS_DIR = 'src/styles/tokens';
const COLOR_CSS = join(TOKENS_CSS_DIR, 'color.css');
const COMPONENTS_DIR = 'src/components';
const HOOKS_SOURCE = 'style-dictionary.config.mjs';

const NAMES = /^\s*(--bk-[a-z0-9-]+):/gm;
const REFERENCES = /(--bk-[a-z0-9-]+)/g;
const SUPPORT_FILE = /\.(test|stories)\.ts$/;

const read = (path) => readFileSync(path, 'utf8');
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '');
const names = (css) => [...css.matchAll(NAMES)].map(([, name]) => name);
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const declared = new Set();
for (const file of walk(TOKENS_CSS_DIR)) {
  for (const name of names(read(file))) declared.add(name);
}

const hooks = new Set();
for (const [, name] of read(HOOKS_SOURCE).matchAll(/'(--bk-[a-z0-9-]+)'/g)) hooks.add(name);

// The palette is the primitive layer; everything else declared in color.css is
// a semantic role the components are supposed to read.
const semantic = names(read(COLOR_CSS)).filter((name) => !name.startsWith('--bk-palette-'));
if (semantic.length === 0) {
  console.error(
    `no semantic roles found in ${COLOR_CSS}. The color platform in ` +
      'style-dictionary.config.mjs probably changed; this check is not running.',
  );
  process.exit(1);
}

const componentFiles = walk(COMPONENTS_DIR).filter((path) => path.endsWith('.ts'));
const problems = [];

for (const file of componentFiles) {
  for (const [, name] of stripComments(read(file)).matchAll(REFERENCES)) {
    if (declared.has(name) || hooks.has(name)) continue;
    problems.push(`${file}: unknown token ${name}`);
  }
}

// A test or a story is not a consumer: R1 is about what a component paints.
const consumed = new Set();
for (const file of componentFiles.filter((path) => !SUPPORT_FILE.test(path))) {
  for (const [, name] of stripComments(read(file)).matchAll(REFERENCES)) consumed.add(name);
}

for (const name of semantic) {
  if (consumed.has(name)) continue;
  problems.push(`${COLOR_CSS}: semantic role with no consumer ${name}`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} problem(s). Declared tokens: ${declared.size}, hooks: ${hooks.size}, semantic roles: ${semantic.length}.`,
  );
  process.exit(1);
}

console.log(
  `token names ok: ${declared.size} declared, ${hooks.size} hooks, ${semantic.length} semantic roles consumed`,
);
