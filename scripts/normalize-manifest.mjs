import { readFile, writeFile } from 'node:fs/promises';

/* The analyzer orders modules by whatever the filesystem returned, so two runs of the same
 * source produced two different files. Sorting is what makes the committed manifest and the
 * staleness gate in CI mean anything. */
const path = new URL('../src/custom-elements.json', import.meta.url);
const manifest = JSON.parse(await readFile(path, 'utf8'));

const byPath = (a, b) => {
  const left = a.path ?? '';
  const right = b.path ?? '';
  return left < right ? -1 : left > right ? 1 : 0;
};

manifest.modules.sort(byPath);

await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
