import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOKENS_CSS_DIR = 'src/styles/tokens';
const COLOR_CSS = join(TOKENS_CSS_DIR, 'color.css');
const COMPONENTS_DIR = 'src/components';
const HOOKS_SOURCE = 'style-dictionary.config.mjs';

const NAMES = /^\s*(--bk-[a-z0-9-]+):/gm;
const REFERENCES = /(--bk-[a-z0-9-]+)/g;
const DECLARATION = /^\s*(--[a-z0-9-]+|[a-z-]+)\s*:/;
const RULE_BOUNDARY = /[{}]/;
const SUPPORT_FILE = /\.(test|stories)\.ts$/;
const STORYBOOK_DIR = '.storybook';
const STORYBOOK_FILE = /\.(css|ts|html)$/;
const PRIMITIVE = '--bk-palette-';

const PROPERTIES = {
  bg: ['background', 'background-color'],
  text: ['color'],
  border: [
    'border',
    'border-color',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-block',
    'border-block-color',
    'border-inline',
    'border-inline-color',
  ],
  focus: ['outline', 'outline-color'],
};

const read = (path) => readFileSync(path, 'utf8');

const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');

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

const semantic = names(read(COLOR_CSS)).filter((name) => !name.startsWith(PRIMITIVE));
if (semantic.length === 0) {
  console.error(
    `no semantic roles found in ${COLOR_CSS}. The color platform in ` +
      'style-dictionary.config.mjs probably changed; this check is not running.',
  );
  process.exit(1);
}
const roles = new Set(semantic);

const misplacedRoles = (file, source) => {
  const found = [];
  let property;

  source.split('\n').forEach((line, i) => {
    if (RULE_BOUNDARY.test(line)) property = undefined;

    for (const segment of line.split(';')) {
      const declaration = segment.match(DECLARATION);
      if (declaration) property = declaration[1];

      if (property?.startsWith('--')) continue;

      for (const [, name] of segment.matchAll(REFERENCES)) {
        if (!roles.has(name)) continue;
        const family = name.slice('--bk-'.length).split('-')[0];
        const allowed = PROPERTIES[family];
        if (!allowed || !property || allowed.includes(property)) continue;
        found.push(`${file}:${i + 1}: ${name} read under ${property} (R5)`);
      }
    }
  });

  return found;
};

const componentFiles = walk(COMPONENTS_DIR).filter((path) => path.endsWith('.ts'));
const problems = [];

for (const file of componentFiles) {
  const source = stripComments(read(file));

  for (const [, name] of source.matchAll(REFERENCES)) {
    if (!declared.has(name) && !hooks.has(name)) {
      problems.push(`${file}: unknown token ${name}`);
    }
  }

  if (SUPPORT_FILE.test(file)) continue;

  for (const [, name] of source.matchAll(REFERENCES)) {
    if (name.startsWith(PRIMITIVE)) {
      problems.push(`${file}: colour primitive read by a component, use a role (R6): ${name}`);
    }
  }

  problems.push(...misplacedRoles(file, source));
}

const blankHtmlComments = (source) =>
  source.replace(/<!--[\s\S]*?-->/g, (block) => block.replace(/[^\n]/g, ' '));

for (const file of walk(STORYBOOK_DIR).filter((path) => STORYBOOK_FILE.test(path))) {
  const source = file.endsWith('.html')
    ? blankHtmlComments(read(file))
    : stripComments(read(file));

  for (const [, name] of source.matchAll(REFERENCES)) {
    if (!declared.has(name) && !hooks.has(name)) {
      problems.push(`${file}: unknown token ${name}`);
    }
  }
}

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
