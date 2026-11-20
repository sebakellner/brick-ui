import { readdir, readFile } from 'node:fs/promises';
import { paths, requireRoots } from './roots.mjs';

/* ADR 0020 §5 promises that a README and the manifest cannot contradict each other, and until
 * now nothing executed it: `check-manifest.mjs` validates the manifest against a hand-written
 * canary list and never opens a README. This closes the other half, in both directions — a name
 * the README documents and the code does not have, and a name the code declares that no table
 * carries — plus the shape D2 asks for: the fixed sections in order, the fixed header per table,
 * and every element with a table of its own.
 *
 * The table is classified by its own header, not by the section it sits in, because an atom is
 * documented inside its family's README under its own `### \`tag>\`` and those tables live in
 * component-specific sections. */
requireRoots('components', 'manifest');

const manifest = JSON.parse(await readFile(paths.manifest, 'utf8'));
const declarations = manifest.modules
  .flatMap((module) => module.declarations ?? [])
  .filter((declaration) => declaration.tagName);
const byTag = new Map(declarations.map((declaration) => [declaration.tagName, declaration]));

const slotName = (slot) => (slot.name && slot.name.length ? slot.name : '(default)');

/* A property declared with `attribute: false` is still a property the README documents, and the
 * manifest keeps it out of `attributes`: `bk-radio-group-item`'s `tabStop` is written by the group
 * and never by an attribute. Public instance fields are the properties a consumer sees; `static`
 * members, the `private`/`protected` ones and the ones a mixin contributes are not — the shared
 * form API has its own `Member` table, which this check leaves alone. */
const publicFields = (declaration) =>
  (declaration.members ?? [])
    .filter(
      (member) =>
        member.kind === 'field' &&
        !member.static &&
        !member.inheritedFrom &&
        member.privacy !== 'private' &&
        member.privacy !== 'protected',
    )
    .map((member) => member.name);

const SURFACES = {
  attributes: {
    header: ['Property', 'Attribute', 'Type', 'Default', 'Notes'],
    columns: [
      {
        column: 'Property',
        declared: (d) =>
          [...(d.attributes ?? []).map((a) => a.fieldName), ...publicFields(d)].filter(Boolean),
      },
      { column: 'Attribute', declared: (d) => (d.attributes ?? []).map((a) => a.name) },
    ],
  },
  slots: { header: ['Slot', 'Content', 'Notes'], names: (d) => (d.slots ?? []).map(slotName) },
  parts: { header: ['Part', 'Element'], names: (d) => (d.cssParts ?? []).map((part) => part.name) },
  events: {
    header: ['Event', 'Detail', 'Notes'],
    names: (d) => (d.events ?? []).map((event) => event.name),
  },
};

const SECTIONS = [
  'Usage',
  'Attributes and properties',
  'Slots',
  'Events',
  'Parts',
  'Tokens and hooks',
  'Accessibility',
  'Limitations',
];

const problems = [];
const problem = (message) => problems.push(message);

/* `_(default)_`, `` `value` ``, `**bold**` and the em dash a table uses for "not applicable" are
 * markup, not names. */
const name = (cell) =>
  cell
    .replace(/[`*_]/g, '')
    .replace(/^\((default)\)$/i, '(default)')
    .trim();
const isNothing = (value) => value.length === 0 || value === '—' || value === '-';

const cells = (line) =>
  line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const classify = (header) => {
  const first = header[0];
  if (first === 'Property' || first === 'Attribute') return 'attributes';
  if (first === 'Slot') return 'slots';
  if (first === 'Part') return 'parts';
  if (first === 'Event') return 'events';
  return null;
};

const parse = (text) => {
  const lines = text.split('\n');
  const headings = [];
  const tables = [];

  lines.forEach((line, index) => {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) headings.push({ level: heading[1].length, text: heading[2].trim(), index });
  });

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith('|')) continue;
    if (!/^\|[\s:|-]+\|$/.test(lines[index + 1] ?? '')) continue;
    const rows = [];
    let next = index + 2;
    while (next < lines.length && lines[next].startsWith('|')) {
      rows.push({ cells: cells(lines[next]), line: next + 1 });
      next += 1;
    }
    tables.push({ header: cells(lines[index]).map(name), rows, line: index + 1, index });
    index = next - 1;
  }

  return { headings, tables };
};

const tagIn = (text) => {
  const bare = name(text);
  return byTag.has(bare) ? bare : null;
};

const readmes = (
  await readdir(new URL('../src/components', import.meta.url), { withFileTypes: true })
)
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('bk-'))
  .map((entry) => `src/components/${entry.name}/README.md`)
  .sort();

const documented = new Map();

for (const path of readmes) {
  const text = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const ownTag = path.split('/').at(-2);
  /* A README under a directory the manifest does not declare documents an element with no source
   * behind it. It used to be skipped, which let a whole component document anything it liked. */
  const unknownTag = !byTag.has(ownTag);
  if (unknownTag) problem(`${ownTag}: ${path} documents an element the manifest does not declare`);
  const { headings, tables } = parse(text);

  /* D8: a component README explains itself. An ADR is cited from `docs/` and from other ADRs,
   * where a maintainer is already reading reasoning; a consumer cannot act on "see ADR 0012",
   * and this file is also the Storybook page, which cannot follow the link anywhere useful. */
  text.split('\n').forEach((line, index) => {
    const adr = /docs\/adr\/(\d{4})-[a-z0-9-]+\.md/.exec(line);
    if (adr) {
      problem(
        `${ownTag}: ${path}:${index + 1} links ADR ${adr[1]}; the README states the reason itself (D8)`,
      );
    }
  });

  for (const heading of headings) {
    if (heading.level !== 3) continue;
    if (!/^`?bk-[a-z-]+`?$/.test(heading.text)) continue;
    if (!byTag.has(name(heading.text)))
      problem(`${name(heading.text)}: documented under ${path}, not in the manifest`);
  }

  let highest = -1;
  let custom = null;
  for (const heading of headings.filter((entry) => entry.level === 2)) {
    const position = SECTIONS.indexOf(heading.text);
    if (position === -1) {
      custom ??= heading.text;
      continue;
    }
    if (custom !== null) {
      problem(`${ownTag}: section "## ${heading.text}" belongs before "## ${custom}"`);
    }
    if (position < highest) {
      problem(`${ownTag}: section "## ${heading.text}" is out of order`);
    }
    highest = Math.max(highest, position);
  }

  const observed = new Map();
  const seen = (tag, surface) => {
    if (!observed.has(tag)) observed.set(tag, new Map());
    const surfaces = observed.get(tag);
    if (!surfaces.has(surface)) surfaces.set(surface, new Map());
    return surfaces.get(surface);
  };

  for (const table of tables) {
    const surface = classify(table.header);
    if (surface === null) continue;

    const above = headings.filter((heading) => heading.index < table.index);
    /* The `###` that names an atom lives inside its family's section: a table under `## Parts`
     * belongs to the family even when an atom was documented three sections above. */
    const section = above.filter((heading) => heading.level === 2).at(-1);
    const named = above
      .filter((heading) => section === undefined || heading.index > section.index)
      .reverse()
      .find((heading) => tagIn(heading.text) !== null);
    const tag = named ? tagIn(named.text) : ownTag;

    const expected = SURFACES[surface].header;
    if (table.header.join(' | ') !== expected.join(' | ')) {
      problem(
        `${tag}: the ${surface} table at ${path}:${table.line} has header "${table.header.join(' | ')}", expected "${expected.join(' | ')}"`,
      );
      continue;
    }

    const surfaceNames = seen(tag, surface);
    for (const row of table.rows) {
      if (surface === 'attributes') {
        const [property, attribute] = row.cells;
        if (!isNothing(name(property)))
          surfaceNames.set(`Property:${name(property)}`, name(property));
        if (!isNothing(name(attribute)))
          surfaceNames.set(`Attribute:${name(attribute)}`, name(attribute));
        continue;
      }
      const first = name(row.cells[0]);
      if (!isNothing(first)) surfaceNames.set(first, first);
    }
  }

  for (const [tag, surfaces] of observed) {
    if (!documented.has(tag)) documented.set(tag, new Set());
    for (const surface of surfaces.keys()) documented.get(tag).add(surface);
  }

  for (const [tag, surfaces] of observed) {
    const declaration = byTag.get(tag);
    if (!declaration) {
      if (!unknownTag) problem(`${tag}: documented under ${path}, not in the manifest`);
      continue;
    }

    for (const [surface, config] of Object.entries(SURFACES)) {
      const documentedNames = surfaces.get(surface) ?? new Map();

      if (config.columns) {
        for (const { column, declared } of config.columns) {
          const wanted = new Set(declared(declaration));
          const had = new Set(
            [...documentedNames]
              .filter(([key]) => key.startsWith(`${column}:`))
              .map(([, value]) => value),
          );
          for (const wantedName of wanted) {
            if (!had.has(wantedName))
              problem(`${tag}: ${surface} is missing ${wantedName} from the ${column} column`);
          }
          for (const hadName of had) {
            if (!wanted.has(hadName))
              problem(
                `${tag}: ${surface} documents ${hadName} in the ${column} column, which the manifest does not have`,
              );
          }
        }
        continue;
      }

      const wanted = new Set(config.names(declaration));
      for (const wantedName of wanted) {
        if (!documentedNames.has(wantedName))
          problem(`${tag}: ${surface} is missing ${wantedName}`);
      }
      for (const hadName of documentedNames.keys()) {
        if (!wanted.has(hadName))
          problem(`${tag}: ${surface} documents ${hadName}, which the manifest does not have`);
      }
    }
  }
}

for (const declaration of declarations) {
  const { tagName } = declaration;
  const surfaces = (declaration.attributes ?? []).length + (declaration.slots ?? []).length;
  const declared =
    surfaces + (declaration.cssParts ?? []).length + (declaration.events ?? []).length > 0;
  if (declared && !documented.has(tagName)) {
    problem(`${tagName}: no README attributes a table to this element`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`readmes ok: ${readmes.length} files, ${documented.size} elements documented`);
