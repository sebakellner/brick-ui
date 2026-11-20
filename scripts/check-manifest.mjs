import { readFile } from 'node:fs/promises';
import { paths, requireRoots } from './roots.mjs';

/* The gate generates the manifest twice and compares, which proves stability. This proves
 * content: the analyzer parses decorators and JSDoc tags that fail silently — a misspelled
 * `@slot` simply does not appear — so the names below are the canaries. */
requireRoots('manifest');

const manifest = JSON.parse(await readFile(paths.manifest, 'utf8'));
const declarations = manifest.modules.flatMap((module) => module.declarations ?? []);
const byTag = new Map(declarations.filter((d) => d.tagName).map((d) => [d.tagName, d]));
const slotName = (slot) => (slot.name && slot.name.length ? slot.name : '(default)');

const problems = [];
const surfaces = {
  attributes: (declaration) => (declaration.attributes ?? []).map((a) => a.name),
  slots: (declaration) => (declaration.slots ?? []).map(slotName),
  cssParts: (declaration) => (declaration.cssParts ?? []).map((p) => p.name),
  events: (declaration) => (declaration.events ?? []).map((e) => e.name),
};

const expect = (tag, surface, names) => {
  const declaration = byTag.get(tag);
  if (!declaration) return problems.push(`${tag}: not in the manifest`);
  const read = surfaces[surface];
  if (!read) return problems.push(`${tag}: unknown surface "${surface}"`);
  const had = read(declaration);
  for (const name of names) {
    if (!had.includes(name)) problems.push(`${tag}: ${surface} is missing ${name}`);
  }
};

expect('brikka-input', 'attributes', ['error', 'required', 'disabled', 'value', 'name']);
expect('brikka-input', 'slots', ['label', 'description', 'error']);
expect('brikka-input', 'cssParts', ['label', 'input', 'message', 'error']);
expect('brikka-input', 'events', ['brikka-change']);
expect('brikka-checkbox', 'attributes', ['checked', 'indeterminate', 'disabled']);
expect('brikka-checkbox', 'cssParts', ['box', 'input']);
expect('brikka-native-select', 'slots', ['label', 'description', 'error']);
expect('brikka-checkbox-group', 'slots', ['label', 'description', 'error']);
expect('brikka-radio-group', 'slots', ['label', 'description', 'error']);
expect('brikka-button', 'cssParts', ['button']);
expect('brikka-button', 'slots', ['(default)']);
expect('brikka-field', 'slots', ['label', 'description', 'error']);

if (byTag.size < 13) problems.push(`only ${byTag.size} elements declared, expected at least 13`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`manifest ok: ${byTag.size} elements, ${declarations.length} declarations`);
