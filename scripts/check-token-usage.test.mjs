import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* The gates are the only thing that reads the published token names, and nothing checked
 * them until a rename left a read on the old prefix passing `check:tokens` untouched: the
 * check looks for `--brikka-*`, so a `--bk-*` beside it is not a name it can see.
 *
 * Each case builds a fixture tree, because `roots.mjs` resolves every path from one root and
 * `BRIKKA_ROOT` is the documented way to point the checks at it. A fixture also keeps the
 * suite honest about the two scopes the rule covers: a component, and a Storybook file. */

const gate = join(dirname(fileURLToPath(import.meta.url)), 'check-token-usage.mjs');
const ROLE = '--brikka-bg-accent';
const STALE = '--bk-text-default';

const PARAMETERS = 'export const parameters = {};\n';

/* The smallest tree that satisfies `requireRoots` and the check's own preconditions: a
 * declared name, a semantic role, a hooks source, a component and a Storybook directory. */
const build = ({ component = '', storybook = PARAMETERS } = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'brikka-gate-'));

  const write = (path, contents) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };

  write(`packages/tokens/src/tokens/hooks.css`, `:root {\n  ${ROLE}: #0066ff;\n}\n`);
  write(
    'packages/tokens/src/tokens/color.css',
    `:where(:root) {\n  --brikka-palette-blue-600: #0066ff;\n  ${ROLE}: var(--brikka-palette-blue-600);\n}\n`,
  );
  write(
    'packages/tokens/style-dictionary.config.mjs',
    `export default { hooks: { accent: '${ROLE}' } };\n`,
  );
  write('packages/web-components/src/components/probe/probe.ts', component);
  write('storybook/web-components/.storybook/preview.ts', storybook);

  return root;
};

const check = (root) =>
  spawnSync(process.execPath, [gate], {
    env: { ...process.env, BRIKKA_ROOT: root },
    encoding: 'utf8',
  });

const on = (fixture, body) => {
  const root = build(fixture);
  try {
    return body(check(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const consuming = (extra = '') => `
export const styles = css\`
  :host {
    background: var(${ROLE});
    ${extra}
  }
\`;
`;

test('refuses a component that reads the token prefix this kit no longer publishes', () => {
  on({ component: consuming(`color: var(${STALE});`) }, (result) => {
    assert.equal(result.status, 1, 'the check must fail on a stale prefix');
    assert.match(result.stderr, /stale token prefix/);
    assert.match(result.stderr, new RegExp(STALE));
    assert.match(result.stderr, /probe\.ts/);
  });
});

test('refuses a Storybook file that reads the token prefix this kit no longer publishes', () => {
  on({ component: consuming(), storybook: `:root {\n  color: var(${STALE});\n}\n` }, (result) => {
    assert.equal(result.status, 1, 'the check must fail on a stale prefix');
    assert.match(result.stderr, /stale token prefix/);
    assert.match(result.stderr, new RegExp(STALE));
  });
});

test('accepts a tree that reads the published prefix and nothing else', () => {
  on({ component: consuming() }, (result) => {
    assert.equal(result.status, 0, `expected a clean tree, got: ${result.stderr}`);
    assert.equal(result.stderr, '');
  });
});
