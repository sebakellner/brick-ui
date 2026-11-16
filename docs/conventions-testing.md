# Testing Conventions

The suite runs in real Chrome through Web Test Runner. `web-test-runner.config.mjs`
picks up `src/**/*.test.ts`, keeps tests next to the element, and registers the
`sendMouse` plugin that the hover and focus tests need. One engine is a decision,
not an accident: see [ADR 0005](adr/0005-test-in-chrome-only.md).

| #   | Rule                                         | Enforced by                        |
| --- | -------------------------------------------- | ---------------------------------- |
| T1  | Load the theme in every test file            | the suite — an unstyled read fails |
| T2  | Assert computed styles, not markup           | review                             |
| T3  | Drive hover and focus with real input        | review                             |
| T4  | Wait past the transition before asserting it | review                             |
| T5  | Every fix is provable by mutation            | review                             |

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

## T6. Never put a DOM element on the tested side of a failed assertion

**Rule.** When the expected value is not an element, compare a derived primitive —
`Boolean(el)`, `el?.id ?? null`, `el?.textContent ?? ''` — never the element
itself. An assertion may hold two DOM nodes only when both sides are nodes.

**Why.** The failure message inspects both values. With a live element on one side
and a primitive on the other, the browser thread never finishes: the assertion
does not throw, the per-test timeout does not fire, and the runner kills the whole
file at `testsFinishTimeout` reporting `0 passed, 0 failed`. Such a test cannot
fail — it can only pass or hang, which is worse than a decorative test, because a
hang reads as infrastructure trouble and hides the regression behind it.

**Do**

```ts
expect(Boolean(innerRequired(el)), 'an optional field marks nothing').to.equal(false);
```

**Don't**

```ts
expect(innerRequired(el), 'an optional field marks nothing').to.equal(null);
```

Measured in this repository, one probe each: `expect(el).to.equal(null)`,
`expect(el, 'a message').to.equal(null)`, `expect(el).to.be.null` and
`expect(el).to.equal('x')` all hang the file; `expect(el).to.equal(otherEl)`,
`expect({ a: 1 }).to.equal(null)` and `expect(el === null).to.equal(true)` all
report. The rule costs one `Boolean()` and buys back the ability to see a
regression.

**Enforced by.** The suite — a violation here is a hang, so this is the one rule
that has to be read rather than observed.

## T7. The runner claims a pointer, and the suite proves it

**Rule.** `web-test-runner.config.mjs` launches Chrome with
`--blink-settings=primaryHoverType=2`, and `src/test/browser.test.ts` asserts that
`matchMedia('(hover: hover)')` is true. A hover test that skips is a hover test that
proves nothing, so the environment is a test like any other.

**Why.** Headless Chrome has no pointer device and reports `(hover: none)`, so every
`@media (hover: hover)` rule stays out of the cascade — tests asserting "nothing
changed on hover" pass without ever hovering. It happened here: three suites went
green that way and only the button's own positive control caught it. `2` is hover
(`1` is none); emulating the feature through `emulateMedia` is not possible, which is
why the flag is at the launch layer.

**Two caveats, both learned from other projects the hard way.** Any viewport
emulation — `setViewport` — rewrites the pointer and hover types and silently undoes
the flag, so a test that resizes the viewport must not expect hover afterwards. And
the flag is Blink-only: on an engine with no pointer the hover tests still declare
`this.skip()` rather than assert anything.

**Enforced by.** `src/test/browser.test.ts`, plus the enabled-sibling control inside
each hover test: the assertion cannot pass unless a hovered sibling really changed.

## T8. Every component ships the same two suites, and a part only when it has behaviour

**Rule.** A component ships `bk-<name>.test.ts` for its rules and
`bk-<name>.register.test.ts` for the packaging contract — the package entry registers
**none** of its tags, and its `define.js` registers **all** of them, which for a
component with atoms is the whole list. A part gets a suite of its own when it has
behaviour (the radio item's activation and tab stop, the select atoms' reflection); a
part that only paints is covered where it is used (`bk-field-label` and its siblings
inside `bk-field.test.ts`). A third file is added **by concern** — `.form`,
`.field`, `.error` — and only when that concern has rules of its own and the main
file has grown past a few hundred lines; the suffix names the concern, never a mood.

**Why.** The register suite existed in four components of seven and the atom coverage
in one of three, which is how a convention stops being one: each addition was locally
reasonable and the set stopped matching. Its rule is not about the component at all —
it is the packaging contract, and an atom whose tag nobody defined would stay inert —
so it is the same test everywhere, and having it everywhere is what makes its absence
visible. Reflection on a data atom is the same kind of fact: the select's mirror
watches attributes, so a property an atom does not reflect is invisible to it, and
that is worth pinning at the atom instead of inferring it from the parent.

**Do** — the shape, identical in all seven:

```ts
const TAGS = ['bk-x', 'bk-x-atom'] as const;

it('should register none of its tags when the package entry is imported', () => {
  for (const tag of TAGS) expect(customElements.get(tag), tag).to.equal(undefined);
});

it('should register all of them when its define module is imported', async () => {
  await import('./define.js');
  for (const tag of TAGS) expect(customElements.get(tag) === undefined, tag).to.equal(false);
});
```

**Don't** — a register suite that imports `define.js` statically: module evaluation
runs before the first test, so "the entry does not register it" becomes untestable
and the suite proves half of what it claims.

**Enforced by.** The suites themselves; a missing one is visible in the inventory,
which is how this rule was found.

## Commands

| Command           | Use                |
| ----------------- | ------------------ |
| `pnpm test`       | one run, in Chrome |
| `pnpm test:watch` | the same, watching |

`browserLogs: true` puts the browser console in the output, which is how a Lit
warning or a CSS parse error becomes visible instead of silent.
