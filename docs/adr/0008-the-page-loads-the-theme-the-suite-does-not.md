# 0008. The page loads the theme, the suite does not

Date: 2026-11-16

## Status

accepted; supersedes in part [0002](0002-require-the-theme.md)

## Context

0002 decided that no token read carries a literal fallback, so a page that skips the
theme renders visibly unstyled. That decision stands and nothing here touches it.

It also recorded one supporting decision, and that one has moved: _"Tests load the
real stylesheet through `before(loadTheme)` from `src/test/helpers/theme.ts`, so the
suite runs the same configuration a consumer runs."_ The loader is gone.
`web-test-runner.config.mjs` serves every suite from a single page that links
`/src/styles/theme.css`, and `src/test/helpers/theme.ts` only sets `data-theme` now.

An accepted record is never edited, so the stale clause could not be corrected in
place — and it had already cost a reader: it names a helper that no longer loads
anything, next to a document that says the loader is gone. A record whose support
points at dead code is the failure this ADR exists to stop.

## Decision

**The test page owns the environment; a suite owns its subject.** The page links the
theme once, zeroes `--brikka-transition`, and paints `body` with `--brikka-bg-surface`; a suite
never loads a stylesheet, never sets a page background and never starts a runner
config of its own. When a test is about the other theme it calls `setTheme('dark')`
and nothing else.

The theme being required is still 0002's decision, unchanged: nothing here adds a
fallback, and a page without the theme still renders unstyled on purpose.

## Consequences

- **The canvas is part of the decision, not a detail.** The page paints `body` with
  `--brikka-bg-surface` because axe-core grades text against the canvas the page paints.
  An unpainted canvas is white to axe even when the browser reports a dark colour
  scheme, and it reported 1.09:1 on a pair the kit paints at 8:1 — six findings in one
  run, none of them a defect. Anything else that grades against the page inherits this.
- **The failure mode is one place.** A suite that forgets the theme fails with an
  unrelated-looking assertion, which is why the page is asserted to serve it
  (`docs/conventions/testing.md` T1) rather than remembered.
- **0002's supporting clause is superseded**; its main decision, and the hook pattern
  it describes, are untouched.
