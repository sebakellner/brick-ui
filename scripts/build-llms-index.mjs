import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { paths, requireRoots } from './roots.mjs';

requireRoots('docs');

/* The index an agent reads, generated so it cannot lie.
 *
 * A hand-written index is stale in two weeks: a page is renamed, a paragraph is added, and the one
 * file whose entire job is to be accurate is the one nobody regenerates. This reads the frontmatter
 * of the publishable pages — the same frontmatter the site will render — and writes one line per
 * page. `--check` fails when the file on disk disagrees, which is what makes the rule enforceable
 * instead of aspirational. */

const DIRECTORIES = ['design-system', 'guides'];

const frontmatter = (source) => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) return undefined;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const field = /^([a-z-]+):\s*(.*)$/.exec(line.trim());
    if (field) fields[field[1]] = field[2].replace(/^["']|["']$/g, '');
  }
  return fields;
};

const pages = [];
for (const directory of DIRECTORIES) {
  const path = join(paths.docs, directory);
  let entries;
  try {
    entries = readdirSync(path);
  } catch {
    continue;
  }
  for (const entry of entries.filter((name) => name.endsWith('.md')).sort()) {
    const fields = frontmatter(readFileSync(join(path, entry), 'utf8'));
    if (!fields?.summary) {
      console.error(
        `${directory}/${entry}: a publishable page needs frontmatter with a summary; it is what the index carries`,
      );
      process.exit(1);
    }
    pages.push({ directory, file: entry, fields });
  }
}

const section = (title, entries) =>
  entries.length === 0
    ? []
    : [
        '',
        `## ${title}`,
        '',
        ...entries.map(
          ({ file, directory, fields }) =>
            `- [${fields.title ?? file}](${directory}/${file}): ${fields.summary}`,
        ),
      ];

const body = [
  '# Brikka design system',
  '',
  '> The token graph, the themes and the guides a host needs to paint with Brikka without',
  '> registering a single element. Every name here is public API.',
  ...section(
    'Design system',
    pages.filter((page) => page.directory === 'design-system'),
  ),
  ...section(
    'Guides',
    pages.filter((page) => page.directory === 'guides'),
  ),
  '',
].join('\n');

const target = join(paths.docs, 'llms.txt');

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    console.error(`${target} is missing; run pnpm build:llms`);
    process.exit(1);
  }
  if (current !== body) {
    console.error(`${target} is stale; run pnpm build:llms and commit the result`);
    process.exit(1);
  }
  console.log('llms.txt is fresh');
} else {
  writeFileSync(target, body);
  console.log(`${target}: ${pages.length} page(s)`);
}
