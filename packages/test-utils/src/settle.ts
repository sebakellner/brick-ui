/* A render, then a flush for what observes it, then the render that flush caused.
 * A `slotchange`, a `MutationObserver` repair or a controller reading assigned nodes
 * lands after the update, so a suite that samples earlier asserts a half-built tree and
 * reports a failure that names nothing.
 *
 * Every suite here used to carry its own copy of this, some once and some twice — the
 * duplication is what made "how many rounds does this need?" a per-file accident.
 *
 * One round, because that is what the suites ask for: removing the flush breaks no test
 * today, so a heavier helper would be a claim nothing proves. A suite that genuinely
 * needs a second flush composes one — `bk-radio-group` settles its items, and that is
 * the rule, not the mechanic. */

export const settle = async (el: { updateComplete: Promise<unknown> }): Promise<void> => {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
};
