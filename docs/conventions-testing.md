# Testing Conventions

The suite runs in real Chrome through Web Test Runner. `web-test-runner.config.mjs`
picks up `src/**/*.test.ts`, keeps tests next to the element, and registers the
`sendMouse` plugin that the hover and focus tests need. One engine is a decision,
not an accident: see [ADR 0005](adr/0005-test-in-chrome-only.md).

| # | Rule | Enforced by |
| --- | --- | --- |
| T1 | Load the theme in every test file | the suite — an unstyled read fails |
| T2 | Assert computed styles, not markup | review |
| T3 | Drive hover and focus with real input | review |
| T4 | Wait past the transition before asserting it | review |
| T5 | Every fix is provable by mutation | review |

## T1. Load the theme in every test file

**Rule.** Every test file starts with `before(loadTheme)` from
`src/test/helpers/theme.ts`.

**Why.** Components carry no fallback values ([ADR 0002](adr/0002-require-the-theme.md)),
so a test without the theme asserts against nothing. Loading the real stylesheet
also means the suite exercises the same configuration a consumer uses, instead of
a second setup that could drift from it.

**Do**

```ts
import { loadTheme } from '../../test/helpers/theme.js';

describe('bk-x', () => {
  before(loadTheme);
```

**Enforced by.** The suite: a missing token read fails the assertion.

## T2. Assert computed styles, not markup

**Rule.** Anything a token drives is asserted through `getComputedStyle`, on the
inner native element.

**Why.** A markup assertion passes through specificity bugs untouched: the
attribute is right, the class is right, and the cascade still resolved to the
wrong color. A computed value is the only thing that proves what the browser
painted.

**Do**

```ts
const el = await fixture<BkX>(html`<bk-x label="Email"></bk-x>`);
expect(getComputedStyle(inner(el)).borderTopColor).to.equal('rgb(185, 28, 28)');
```

**Don't** — assert that the host has `data-state="error"` and call it covered.

**Enforced by.** Review. The mock-vs-browser tradeoff is why there is no jsdom.

## T3. Drive hover and focus with real input

**Rule.** States the browser only enters through real input are dispatched
through `@web/test-runner-commands` (`sendMouse`), never simulated by adding a
class.

**Why.** A class swap tests the class. The bug this catches is a specificity loss
in a pseudo-class rule, and a simulated state cannot reproduce it.

**Do**

```ts
await sendMouse({ type: 'move', position: [x, y] });
```

**Enforced by.** Review.

## T4. Wait past the transition before asserting it

**Rule.** A transitioned property is asserted after more than `--bk-transition`
(120ms), not immediately.

**Why.** Sampling mid-transition returns an interpolated color, so the test asserts
a value that exists for a few frames and fails intermittently on a slower machine.

**Enforced by.** Review.

## T5. Every fix is provable by mutation

**Rule.** Break the code, watch the test go red, restore it. A fix whose test stays
green has no proof it does anything.

**Why.** A test written after the fix tends to encode what the code does rather
than what the rule requires, and passes vacuously. The mutation is the only cheap
way to tell the two apart.

**Enforced by.** Review — and it is the reason the suite is trusted at all.

## Commands

| Command | Use |
| --- | --- |
| `pnpm test` | one run, in Chrome |
| `pnpm test:watch` | the same, watching |

`browserLogs: true` puts the browser console in the output, which is how a Lit
warning or a CSS parse error becomes visible instead of silent.
