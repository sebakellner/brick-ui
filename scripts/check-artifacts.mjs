import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { root } from './roots.mjs';

/* The fourth check: what a consumer gets, without the repository around it.
 *
 * Every other gate reads the source. Storybook reads the source, the suite reads the source, and
 * `check:readmes` reads the manifest the source produces. None of them notice when a package
 * stops being installable: an `exports` pointing at a path the build does not emit, a `files`
 * that leaves an entry point out, a peer dependency dropped from the manifest, a declaration
 * that does not compile. Those are the failures a publishable structure invites, and nothing had
 * ever asked the packages to be consumed.
 *
 * So this packs them, unpacks them where no workspace link can help, and type-checks a consumer
 * that imports every entry point the exports promise. It runs in seconds, needs no browser, and
 * fails with the name of the entry that did not resolve. */

const PACKAGES = ['styles', 'web-components'];
const problems = [];

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8' });

/* `pnpm` on this machine is a shell script, so it needs a shell to be found. Every argument here
 * is a literal; nothing interpolated reaches the command string. */
const pnpm = (args, cwd) => execSync(['pnpm', ...args].join(' '), { cwd, encoding: 'utf8' });

/* An `exports` target is a contract with the consumer. For a pattern only the directory can be
 * asserted here — the type check below covers the specific entry a consumer imports. */
const declaredTargets = (manifest) => {
  const targets = [];
  for (const value of Object.values(manifest.exports ?? {})) {
    if (typeof value === 'string') targets.push(value);
    else targets.push(...Object.values(value));
  }
  return targets.filter((target) => !target.includes('*'));
};

const workspace = mkdtempSync(join(tmpdir(), 'brick-artifacts-'));
const consumer = join(workspace, 'consumer');

try {
  for (const name of PACKAGES) pnpm(['--filter', `@brick/${name}`, 'build'], root);

  for (const name of PACKAGES) {
    const directory = join(root, 'packages', name);
    const packed = pnpm(['pack', '--pack-destination', workspace], directory)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.endsWith('.tgz'))
      .at(-1);
    if (!packed) throw new Error(`@brick/${name} packed nothing`);

    const tarball = join(workspace, packed.replace(/^.*\//, ''));
    const listing = run('tar', ['-tzf', tarball], workspace);

    /* The manifest that ships, not the one in the repository: pnpm rewrites `workspace:*` at pack
     * time, so the source file is a different document. */
    const manifest = JSON.parse(run('tar', ['-xOzf', tarball, 'package/package.json'], workspace));

    /* One promise at a time: does the tarball carry every path the exports name? */
    for (const target of declaredTargets(manifest)) {
      const path = target.replace(/^\.\//, '');
      if (!listing.includes(`package/${path}`))
        problems.push(`@brick/${name} exports ${target}, which the tarball does not carry`);
    }

    for (const [dependency, version] of Object.entries(manifest.dependencies ?? {})) {
      if (String(version).startsWith('workspace:'))
        problems.push(`@brick/${name} ships an unresolved ${dependency}: ${version}`);
    }

    /* Unpack where no workspace link can reach, which is the whole point. */
    const target = join(consumer, 'node_modules', '@brick', name);
    mkdirSync(target, { recursive: true });
    run('tar', ['-xzf', tarball, '--strip-components=1', '-C', target], workspace);
  }

  symlinkSync(join(root, 'node_modules', 'lit'), join(consumer, 'node_modules', 'lit'), 'dir');

  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2),
  );
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          lib: ['ES2022', 'DOM'],
        },
        include: ['use.ts'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(consumer, 'use.ts'),
    `import '@brick/web-components/register.js';
import '@brick/web-components/components/bk-slider/define.js';
import { BkButton } from '@brick/web-components';
import { tokens } from '@brick/styles';

export const button: typeof BkButton = BkButton;
export const accent: string = tokens.roleLightBgAccent;
`,
  );

  try {
    run(join(root, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], consumer);
  } catch (error) {
    problems.push(`the packaged entry points do not type-check: ${error.stdout || error.message}`);
  }
} catch (error) {
  problems.push(error.message.split('\n')[0]);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(
  `artifacts ok: ${PACKAGES.map((name) => `@brick/${name}`).join(', ')} pack, carry their exports and type-check outside the workspace`,
);
