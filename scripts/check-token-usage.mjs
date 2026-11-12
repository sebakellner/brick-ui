/**
 * Every `--bk-*` name a component reads must exist: either as a declared token
 * (generated CSS) or as a hook (a name the component reads or sets that the
 * token source does not declare). A typo here renders nothing at runtime and
 * no other check catches it, because the name lives inside a CSS string.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOKENS_CSS_DIR = 'src/styles/tokens';
const COMPONENTS_DIR = 'src/components';
const HOOKS_SOURCE = 'style-dictionary.config.mjs';

const read = (path) => readFileSync(path, 'utf8');
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const declared = new Set();
for (const file of walk(TOKENS_CSS_DIR)) {
  for (const [, name] of read(file).matchAll(/^\s*(--bk-[a-z0-9-]+):/gm)) declared.add(name);
}

const hooks = new Set();
for (const [, name] of read(HOOKS_SOURCE).matchAll(/'(--bk-[a-z0-9-]+)'/g)) hooks.add(name);

const problems = [];
for (const file of walk(COMPONENTS_DIR).filter((path) => path.endsWith('.ts'))) {
  const source = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, name] of source.matchAll(/(--bk-[a-z0-9-]+)/g)) {
    if (declared.has(name) || hooks.has(name)) continue;
    problems.push(`${file}: unknown token ${name}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} unknown name(s). Declared tokens: ${declared.size}, hooks: ${hooks.size}.`,
  );
  process.exit(1);
}

console.log(`token names ok: ${declared.size} declared, ${hooks.size} hooks`);
