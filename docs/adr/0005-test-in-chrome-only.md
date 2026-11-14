# 0005. Test in Chrome only

Date: 2026-11-12

## Status

accepted

## Context

The suite runs in a real browser. `web-test-runner.config.mjs` declares files,
esbuild, the `sendMouse` command plugin and `browserLogs`, and no browser list —
so the default launcher runs Chrome: the one on the developer's machine locally,
the one already present on the CI runner image otherwise.

That choice matters more here than it would in an application, because
everything the kit promises is a platform feature: shadow DOM with
`delegatesFocus`, `::part` as the styling escape hatch, `ElementInternals` for
form association, custom properties resolved at computed-value time, and
`:focus-visible` for the ring. Those are precisely the areas where engines have
historically diverged, and they are the whole product.

The suite also asserts computed values rather than markup — colors, weights,
borders, transitions. A computed value is the most engine-specific artifact
available: the serialization of a color, the resolved font, the rounding of a
length, the choice whether a transitioning property is sampled mid-flight. Every
green assertion is a statement about Chrome.

What pushed the decision was that the alternative buys insurance against a
hypothetical. The kit is private, unpublished and consumed from the repository;
no outside consumer's browser matrix is being guessed at. Paying three times the
CI cost to protect a consumer we do not have is speculation with a measurable
price.

## Decision

One engine: Chrome, through the launcher's default, with no `browsers` entry in
the config.

Form state, ARIA wiring, focus behavior and computed styles are all asserted in
that engine. Nothing in the suite is parameterized by browser, and there is no
second configuration to keep in sync.

The blind spot is named rather than hidden: a shadow-DOM, `::part`,
`:focus-visible` or `ElementInternals` divergence in another engine would not
fail this suite, and no test would tell us. That sentence belongs in
`CONTRIBUTING.md` next to the decision, so it is read before it is rediscovered.

### Alternatives considered

| Alternative                                                               | Why it was rejected                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run Chromium, WebKit and Firefox through Playwright from the first commit | Three browser downloads in CI, roughly three times the suite duration, and a different launcher plugin — to catch a defect class that has not been observed once, on two components. The cost starts on day one; the benefit is contingent on a bug that may never arrive. |
| Keep Chrome in the PR gate and add a nightly cross-engine job             | The most plausible next step, and the shape a published kit should have. Rejected for now because a nightly failure with no release and no consumer is a notification nobody acts on. It becomes worth its cost the moment there is an outside consumer.                   |
| Skip the browser and run the suite in jsdom                               | The suite exists to assert computed styles, real `:focus-visible`, real hover through `sendMouse`, and real form association. jsdom implements none of them, so the tests would assert the mock instead of the kit.                                                        |

## Consequences

Easier:

- The suite finishes in about two seconds locally, and the same in CI. One
  engine means one serialization, one font resolution and one rounding rule, so
  the assertions are deterministic.
- `sendMouse`, `:focus-visible` and `delegatesFocus` behave for real; no behavior
  is stubbed to make a test pass.
- The PR gate is one job, and it cannot fail in the way a cross-engine matrix
  fails — by timing out on one of three browsers.

Harder:

- Every computed-style assertion silently encodes Chrome. An assertion that a
  color equals `rgb(185, 28, 28)` is a claim about Chrome's serialization of
  that color, and a test that would need rewriting for WebKit looks identical to
  one that would not.
- Chrome-green is weakest exactly where the kit is strongest: `delegatesFocus`,
  `::part` and `ElementInternals` are the features a second engine would test,
  and they are the ones with no coverage outside Chrome.
- `browserLogs: true` puts console noise in the test output. A second engine
  would multiply it, which is part of why the matrix is not free.

Accepted debt: a real blind spot that no test describes. Revisit when a
shadow-DOM, `::part` or `:focus-visible` defect is reported from a non-Chrome
engine — the trigger recorded in `CONTRIBUTING.md` — or when the package is
published and a consumer's browser matrix stops being hypothetical.
