import { readFile } from 'node:fs/promises';

/* The suite runs inside an image whose tag repeats the Playwright version by hand, and nothing
 * connects the two: the lockfile moves and the tag does not, and the tests run a browser the
 * repository does not pin. This is the same check the token CSS and the manifest get — a fact
 * stated twice has to be compared. */
const lockfile = await readFile(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8');
const pinned = lockfile.match(/^ {2}playwright@(\d+\.\d+\.\d+):/m)?.[1];

if (!pinned) {
  console.error('no playwright resolution found in pnpm-lock.yaml');
  process.exit(1);
}

const workflows = ['ci.yml', 'storybook-pages.yml'];
const problems = [];
let images = 0;

let inCi = 0;

for (const file of workflows) {
  const text = (
    await readFile(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8')
  ).replace(/^[^\n]*#.*$/gm, '');
  for (const [, tag] of text.matchAll(/image:\s*(mcr\.microsoft\.com\/playwright:\S+)/g)) {
    images += 1;
    if (file === 'ci.yml') inCi = 1;
    if (!new RegExp(`:v${pinned}(-[a-z0-9]+)?$`).test(tag)) {
      problems.push(`${file}: the image is ${tag}, but the lockfile pins playwright ${pinned}`);
    }
  }
}

if (images === 0) problems.push('no workflow runs the suite inside the Playwright image');
if (!inCi) problems.push('ci.yml does not run the suite inside the Playwright image');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`browser image ok: playwright ${pinned} in ${workflows.join(', ')}`);
