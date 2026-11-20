import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './roots.mjs';

/* `fixed` is what makes the two shipped packages carry one version, and it is the only
 * thing enforcing it. A typo in the group does not fail anything: changesets accepts the
 * config, the misspelled name simply never joins the lockstep, and the drift surfaces at
 * publish time as a peer range the consumer cannot resolve — the failure the group exists
 * to prevent. Nothing else in the tree compares the two lists, so this does. */

const shippedPackages = () =>
  readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      JSON.parse(readFileSync(join(root, 'packages', entry.name, 'package.json'), 'utf8')),
    )
    .filter((manifest) => !manifest.private)
    .map((manifest) => manifest.name)
    .sort();

const fixedGroup = () =>
  JSON.parse(readFileSync(join(root, '.changeset', 'config.json'), 'utf8'))
    .fixed.flat()
    .sort();

test('the fixed group names exactly the packages that ship', () => {
  const shipped = shippedPackages();

  assert.ok(shipped.length > 0, 'no package ships, so the group has nothing to lock');
  assert.deepEqual(fixedGroup(), shipped);
});
