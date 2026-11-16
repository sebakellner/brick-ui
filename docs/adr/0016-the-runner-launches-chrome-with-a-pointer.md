# 0016. The runner launches Chrome with a pointer

Date: 2026-11-16

## Status

accepted; supersedes in part [0005](0005-test-in-chrome-only.md)

## Context

0005 chose one engine and recorded the launcher as _"the launcher's default, with no
`browsers` entry in the config"_. That was true then and is false now:
`web-test-runner.config.mjs` declares

```js
browsers: [chromeLauncher({ launchOptions: { args: ['--blink-settings=primaryHoverType=2'] } })],
```

Headless Chrome has no pointer device and reports `(hover: none)`, so every
`@media (hover: hover)` rule stays out of the cascade and a test asserting "nothing
changed on hover" passes without hovering anything. It happened here: three suites went
green that way, and only the button's own positive control caught it. A hover test that
cannot hover is T6's failure in another costume — an assertion that cannot fail.

`2` is hover and `1` is none. The feature cannot be emulated from inside a test:
`emulateMedia` does not cover the pointer type, and any viewport emulation rewrites it.

## Decision

One engine, Chrome, launched with the pointer type claimed at the launch layer. The claim
is not left as configuration people trust:

- `web-test-runner.config.mjs` passes the flag.
- `src/test/browser.test.ts` asserts `matchMedia('(hover: hover)')` is true, so the
  environment is a test like any other.
- Every hover test carries an **enabled sibling** that must change, so the assertion
  cannot pass on a page where hover reached nothing.

0005's decision that one engine is enough stands, and nothing here adds a second one.

## Alternatives considered

| Alternative                                          | Why it was rejected                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `emulateMedia` a hover capability                    | The media emulation API has no pointer type; the device capability is read at the launch layer and not overridable.             |
| Skip hover tests unless a pointer is present         | The suite already does that on an engine without one, and this is the only engine: skipping would delete the coverage entirely. |
| Test the hover rule by compiling the stylesheet text | It asserts the file, not the cascade, which is the failure T2 exists for: the rule is right and the paint is wrong.             |

## Consequences

- 0005's "no `browsers` entry" clause is superseded. Its engine decision, its rejection of
  jsdom, and its Chrome-only rounding rule are untouched.
- **The flag is one global, and two things rewrite it.** `setViewport` in a test silences
  the hover capability, so a test that resizes cannot expect hover; and the flag is
  Blink-only, which is why the skip branch still exists (`docs/conventions-testing.md` T7).
- The pointer state also leaks between suites — Chrome keeps the last hovered element — so
  a suite that moves it resets it in `afterEach`.
