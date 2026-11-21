# 0011. The browser the suite runs is the one the lockfile pins

Date: 2026-11-17

## Status

accepted; supersedes in part [0005](0005-test-in-chrome-only.md) and
[0009](0009-the-runner-launches-chrome-with-a-pointer.md)

## Context

0005 chose one engine and 0009 claimed a pointer at the launch layer. Both named the
launcher only in passing: 0005 recorded "the launcher's default", 0009 recorded
`chromeLauncher`. `@web/test-runner-chrome` drives whatever Chrome it finds — the one on
the developer's machine locally, the one the CI runner image happens to carry otherwise.

That is not one engine. It is one engine name and one version per machine, and on
2026-11-16 the difference reached the gate: PR #77 failed with

```
Failed to launch local browser installed at /usr/bin/google-chrome-stable …
mismatch between the version of puppeteer and Chrome
```

followed by twenty WebSocket timeouts. A re-run on another runner passed with no change
to the branch. The failure had nothing to do with the diff; the image had moved
`google-chrome-stable` past the version the pinned `puppeteer-core` speaks.

The half-fix was tried and rejected: setting `PUPPETEER_EXECUTABLE_PATH` to an
`npx`-installed build, about forty lines of setup, moved the divergence rather than
closing it. CI then ran one pinned build and developers still ran whatever they had, so
a green gate said nothing about the browser the change was written against.

The primary sources settle it. Seven libraries in this space — Shoelace, `@material/web`,
Spectrum Web Components, Lit, Vaadin, Open WC and FAST — launch their suites through
Playwright rather than `@web/test-runner-chrome`. Six of the seven provision the browser in
CI with `npx playwright install --with-deps`. Playwright ties its browser revision to its
own version, so a version pinned in the lockfile pins the browser for everybody.

## Decision

`web-test-runner.config.mjs` launches through `@web/test-runner-playwright`, and
`playwright` is a dev dependency pinned to an exact version — no range — so the lockfile
resolves one Playwright and therefore one Chromium revision, locally and in CI:

```js
browsers: [
  playwrightLauncher({
    product: 'chromium',
    launchOptions: { args: ['--blink-settings=primaryHoverType=2'] },
  }),
],
```

The pointer flag 0009 introduced travels through `launchOptions.args` unchanged, and
`npx playwright install chromium` installs the build that flag was verified against.

### Alternatives considered

| Alternative                                                         | Why it was rejected                                                                                                                                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep `@web/test-runner-chrome` and the system Chrome                | The image decides the version, so the gate is a function of the runner's update schedule. That is the #77 failure, and its cause was never in the repository.                                 |
| `PUPPETEER_EXECUTABLE_PATH` pointed at an `npx`-installed build     | Fixes CI only. The path is set where the environment sets it, so developers stay on their own Chrome and the two diverge again the first time the two builds disagree.                        |
| `browser-actions/setup-chrome`                                      | Pins the image's Chrome for the length of a job. It still does not pin the repository's browser, so local and CI resolve independently and the lockfile records nothing about either.         |
| Run the suite in Playwright's headless shell and skip `--with-deps` | The shell accepts the pointer flag, but the Linux system libraries it needs are not on a bare runner image. Skipping the dependency step trades a version divergence for a missing-`.so` one. |

## Consequences

Easier:

- One browser per pinned version, on every machine. A suite that passes locally exercises
  the build the gate will use, which is what made the failure of #77 a re-run rather than
  a fix.
- The 0009 pointer claim is verified by `src/test/browser.test.ts` against a browser the
  repository chose, not one it borrowed.

Harder:

- CI gains a Linux step: `npx playwright install --with-deps chromium`. The
  `--with-deps` half is what installs the system libraries; Modern Web's setup notes are
  explicit that plain `install` expects them to be present already.
- Every machine downloads a browser once — roughly 190 MB for Chromium plus the headless
  shell — and again whenever `playwright` is bumped. A Playwright bump is now a change
  that moves the engine, so it is reviewed like one.
- 0005's "default launcher" clause and 0009's `chromeLauncher` snippet are superseded.
  What stands in both: one engine, Chrome's rendering of a computed value, and the
  pointer claimed at the launch layer.

Accepted debt: the Chromium revision appears nowhere in the repository except as a
version number in `package.json`, so reading which browser the suite runs means reading
the Playwright release notes for that version. The `npx playwright install` step in CI is
the only place the two are visibly tied together.
