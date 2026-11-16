import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/test/integration';

const suitesIn = (directory) => {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  return entries.flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? suitesIn(path) : path.endsWith('.test.ts') ? [path] : [];
  });
};

const families = (file) => {
  const specifiers = [...readFileSync(file, 'utf8').matchAll(/['"]([^'"]*define\.js)['"]/g)].map(
    ([, specifier]) => specifier,
  );

  return new Set(
    specifiers.flatMap((specifier) => {
      const [family] = specifier.split('/').reverse().slice(1, 2);
      return family && family !== '.' ? [family] : [];
    }),
  );
};

const suites = suitesIn(root);
const problems = suites
  .map((file) => ({ file, imported: families(file) }))
  .filter(({ imported }) => imported.size < 2);

for (const { file, imported } of problems) {
  console.error(
    `${file}: an integration suite composes at least two components, this one imports ${imported.size}`,
  );
}

if (problems.length > 0) process.exit(1);

console.log(`integration suites ok: ${suites.length}`);
