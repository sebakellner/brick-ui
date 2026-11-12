/**
 * Four checks over the `--bk-*` names that live inside CSS strings, where no
 * other tooling can see them.
 *
 * 1. Every name a component reads must exist: either as a declared token
 *    (generated CSS) or as a hook (a name the component reads or sets that the
 *    token source does not declare). A typo here renders nothing at runtime and
 *    no other check catches it, because the name lives inside a CSS string. This
 *    one covers tests and stories too: a typo in either is still a typo.
 *
 * 2. Every semantic role must be read by a component. A role that nothing reads
 *    is a public contract with no behaviour: it costs a breaking change to
 *    delete later. Ten of them were removed by hand in d9dfacd, and this check
 *    is that cleanup made repeatable. See docs/conventions-tokens.md (R1).
 *
 * 3. A role is read under the property it belongs to (R5): `--bk-bg-*` in a
 *    background, `--bk-text-*` in a `color`, `--bk-border-*` in a border,
 *    `--bk-focus-ring` in an outline. Indirection through a custom property is
 *    not checked — that is the hook pattern, and the value lands elsewhere.
 *
 * 4. A component never reads a colour primitive (R6): `--bk-palette-*` is the
 *    raw ramp, and reaching for it bypasses the theme. Spacing, radius, type and
 *    the structural values have no role layer, so reading those directly is not
 *    a violation — they do not change between themes.
 *
 * R5 and R6 are claims about what a *component* paints, so they skip the test and
 * story files. R1 does not.
 *
 * See docs/conventions-tokens.md for the rules and docs/adr/0006 for why.
 */
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
const PRIMITIVE = '--bk-palette-';

// Which CSS properties may read which role family. A family missing here is not
// checked, so adding a role family means adding its properties.
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

// Comments are blanked rather than deleted: the scan is line-addressed, and
// removing a block comment outright would shift every line after it.
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

// The palette is the primitive layer; everything else declared in color.css is
// a semantic role the components are supposed to read.
const semantic = names(read(COLOR_CSS)).filter((name) => !name.startsWith(PRIMITIVE));
if (semantic.length === 0) {
  console.error(
    `no semantic roles found in ${COLOR_CSS}. The color platform in ` +
      'style-dictionary.config.mjs probably changed; this check is not running.',
  );
  process.exit(1);
}
const roles = new Set(semantic);

/**
 * R5: the property a role is read under has to belong to its family.
 *
 * Declarations are split on `;` so that two on one line are attributed to their
 * own property, and a rule boundary clears the context so a selector is never
 * mistaken for a property.
 */
const misplacedRoles = (file, source) => {
  const found = [];
  let property;

  source.split('\n').forEach((line, i) => {
    if (RULE_BOUNDARY.test(line)) property = undefined;

    for (const segment of line.split(';')) {
      const declaration = segment.match(DECLARATION);
      if (declaration) property = declaration[1];

      // A role assigned to a custom property is the hook indirection: the value is
      // read somewhere else, and that is where the property matters.
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

  // R5 and R6 are about what a component paints; a test or a story is not one.
  if (SUPPORT_FILE.test(file)) continue;

  for (const [, name] of source.matchAll(REFERENCES)) {
    if (name.startsWith(PRIMITIVE)) {
      problems.push(`${file}: colour primitive read by a component, use a role (R6): ${name}`);
    }
  }

  problems.push(...misplacedRoles(file, source));
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
