import { readFile } from 'node:fs/promises';

/* The gate generates the manifest twice and compares, which proves stability. This proves
 * content: the analyzer parses decorators and JSDoc tags that fail silently — a misspelled
 * `@slot` simply does not appear — so the names below are the canaries. */
const manifest = JSON.parse(
  await readFile(new URL('../src/custom-elements.json', import.meta.url), 'utf8'),
);
const declarations = manifest.modules.flatMap((module) => module.declarations ?? []);
const byTag = new Map(declarations.filter((d) => d.tagName).map((d) => [d.tagName, d]));
const slotName = (slot) => (slot.name && slot.name.length ? slot.name : '(default)');

const problems = [];
const expect = (tag, surface, names) => {
  const declaration = byTag.get(tag);
  if (!declaration) return problems.push(`${tag}: not in the manifest`);
  const had =
    surface === 'attributes'
      ? declaration.attributes.map((a) => a.name)
      : surface === 'slots'
        ? declaration.slots.map(slotName)
        : surface === 'cssParts'
          ? declaration.cssParts.map((p) => p.name)
          : declaration.events.map((e) => e.name);
  for (const name of names) {
    if (!had.includes(name)) problems.push(`${tag}: ${surface} is missing ${name}`);
  }
};

expect('bk-input', 'attributes', ['error', 'required', 'disabled', 'value', 'name']);
expect('bk-input', 'slots', ['label', 'description', 'error']);
expect('bk-input', 'cssParts', ['label', 'input', 'message', 'error']);
expect('bk-input', 'events', ['bk-change']);
expect('bk-checkbox', 'attributes', ['checked', 'indeterminate', 'disabled']);
expect('bk-checkbox', 'cssParts', ['box', 'input']);
expect('bk-native-select', 'slots', ['label', 'description', 'error']);
expect('bk-checkbox-group', 'slots', ['label', 'description', 'error']);
expect('bk-radio-group', 'slots', ['label', 'description', 'error']);
expect('bk-button', 'cssParts', ['button']);
expect('bk-button', 'slots', ['(default)']);
expect('bk-field', 'slots', ['label', 'description', 'error']);

if (byTag.size < 13) problems.push(`only ${byTag.size} elements declared, expected 13`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`manifest ok: ${byTag.size} elements, ${declarations.length} declarations`);
