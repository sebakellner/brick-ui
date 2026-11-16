# Testing Conventions

The suite runs in real Chrome through Web Test Runner. `web-test-runner.config.mjs`
picks up `src/**/*.test.ts`: a component's rule suites live in its `test/` folder, an assembly of two
or more widgets that the test composes lives under `src/test/integration/`, and the
`sendMouse` plugin is what the hover and focus tests need. One engine is a decision, not
an accident: see [ADR 0005](adr/0005-test-in-chrome-only.md).

The eight numbered rules follow, each with what enforces it. The **three levels** after
them are the frame the rules sit in: where a suite lives and what it is allowed to assert.
They are not numbered because they are judged as a whole — a misplaced suite is caught by
reading a diff, not by one assertion going red — while a rule is something a single test
can name.

| #   | Rule                                                        | Enforced by                             |
| --- | ----------------------------------------------------------- | --------------------------------------- |
| T1  | The runner page loads the theme, once                       | the suite — an unstyled read fails      |
| T2  | Assert computed styles, not markup                          | review                                  |
| T3  | Drive hover and focus with real input                       | review                                  |
| T4  | The test page has no transition to wait for                 | review; the suite runtime shows it      |
| T5  | Every fix is provable by mutation                           | review                                  |
| T6  | Never put a DOM element on the tested side of a failure     | the suite — a violation is a hang       |
| T7  | The runner claims a pointer, and the suite proves it        | `browser.test.ts` + the enabled sibling |
| T8  | Two suites per component, a part only when it has behaviour | the suites, visible in the inventory    |
| T9  | Use the testing library's own vocabulary, never an alias    | review                                  |

## The three levels, and who decides the composition

The line between a unit test and an integration test is not "how many elements it
imports" — almost every suite here imports an atom's `define.js`, because the atoms are
the kit's vocabulary. The line is **who decides the composition**:

| Level           | Subject                                                                                                                                                                          | Who composes    | Where                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| **unit**        | one component and **the parts it fixes** — a control with its atoms, a group with its boxes, the field with its own atoms — plus the platform around it (`<form>`, `<fieldset>`) | the component   | `src/components/bk-x/test/bk-x.test.ts` (and its `register` suite beside it), `describe` per concern |
| **integration** | an assembly of **two or more widgets that depend on each other**, chosen by the test                                                                                             | the test        | `src/test/integration/<assembly>/<rule>.test.ts`                                                     |
| **e2e** (later) | **the package on a real page**: entry, registration, `theme.css`, bundler                                                                                                        | the application | `e2e/` with Playwright, once the kit is consumed by an app                                           |

**Where exactly the line falls: the level names whose contract the test writes down, not
how many elements sit in the fixture.** That is the test of every doubtful case, and it
is the one that answers why a `<form>` does not make a suite integration:

- The `form participation` block of `bk-checkbox.test.ts` is **unit**. The rule — "a form can
  submit, reset and disable me" — is the control's own contract with the platform, and the
  `<form>` is a given rather than a composition of the kit. When it fails, the diagnosis is
  one component: its `formResetCallback`, its `setValidity`, its `submittedValue`. That
  diagnosis is what the level is for.
- Label, description and error association are the **control's** contract, so a control with
  its atoms is **unit**. `<label for>`, which region `aria-describedby` names and in what
  order, the live region that stays in the tree while it is empty, the atom a consumer adds
  after connect: each is a rule about one control, and a failure is diagnosed in its suite.
  Shoelace tests `label` and `help-text` in `input.test.ts`, Material Web's helper text
  landed as component unit tests, and Spectrum keeps its declarative field spec inside the
  component's folder. Nobody tests "a control with a label atom" as integration.
- `bk-checkbox.test.ts` is **unit** although it imports two defines, because its atoms are
  part of its own documented contract.
- A screen with an input, a checkbox and a select is **integration**, because the test
  decides that those three belong together and nobody else does.

The crossing-a-boundary reading of "integration" (a `<form>` is a boundary) would make
almost every suite integration, and with it the word stops telling a reader what a failure
means.

**The level is the location, and no suffix is invented for it.** A unit suite lives with
its component, in one file broken into `describe` blocks per concern (`form
participation`, `error channel`, `label state`) instead of `.form` and `.error` files —
one file per subject is what Shoelace and Material Web do, and a concern is a paragraph
of a suite, not a module. Integration gets its own directory, the way Spectrum keeps its
accessibility specs apart from its unit tests and the runner itself separates kinds. Nothing
lives there today: the directory is for an assembly the test composes, and the form suite —
several controls on one form — is the first one that earns it. A folder whose rule is "two or
more widgets" does not exist before that suite does.

Three rules make the levels useful instead of decorative:

- **A level asserts only what the level below cannot.** Integration never re-asserts a
  control's computed-style rules; it asserts what changes _because_ two widgets are
  together: the order in which validity is reported, the payload, a reset crossing
  widgets, focus moving to the next control.
- **Share the mechanics, not the rules.** Mounting a field with its atoms, typing a
  value, submitting and settling are the same four lines in every suite, so they belong
  in `src/test/helpers/`. The rules stay with the component that owns them: a shared rule
  suite reports a failure without saying which component drifted, and it grows options and
  conditionals the moment two controls differ — the input keeps the native `disabled` and
  the checkbox does not, the checkbox submits only while checked. Shoelace's
  `runFormControlBaseTests` and Material's `createFormTests` exist because their controls
  are uniform; ours already disagree, so the criterion for adopting one here is a
  **third** control with the same shape, not two.
- **No mocks at any level** (T2). E2E included: a real page, a real package.

The placement rule worth stating — a suite under `src/test/integration/` composes at
least two components, or the folder becomes a dumping ground — is enforced by **review,
not by a script**. It is a _positive_ rule, which lint cannot express even with ESLint
installed (`no-restricted-imports` forbids, it does not count), and a gate whose failure
costs nothing a consumer can feel teaches people to route around gates. A mislabeled
suite reaches nobody; an undefined token reaches a consumer in runtime, which is why
`check:tokens` earns its place and this did not.

## T1. The runner page loads the theme, once

**Rule.** `web-test-runner.config.mjs` serves every suite from one page: it links
`/src/styles/theme.css` and zeroes `--bk-transition`. A suite never loads the stylesheet
itself; when it needs the other theme it calls `setTheme('dark')` and nothing else.

**Why.** Components carry no fallback values ([ADR 0002](adr/0002-require-the-theme.md)), so
a suite without the theme asserts against nothing — but that is a property of the page, not
of twenty-two files. ADR 0002 still decides that the theme is required; only the loader it
mentions (`before(loadTheme)`) is gone, and an accepted record is superseded, never edited. Fetching the same stylesheet from each of them was twenty-two chances
to forget, and the copy that forgot failed with an unrelated-looking assertion.

**Do** — switch the theme when the test is about the theme, and nothing otherwise:

```ts
setTheme('dark');
```

**Don't** — inject a `<link>` from a test, or assert before the page has its stylesheet.

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
const el = await fixture<BkX>(html`<bk-x><bk-field-label>Email</bk-field-label></bk-x>`);
expect(getComputedStyle(inner(el)).borderTopColor).to.equal(
  await colorOf('var(--bk-border-danger)'),
);
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

## T4. The test page has no transition to wait for

**Rule.** The runner page zeroes the kit's duration token (`--bk-transition: 0s`), so a
transitioned property reaches its final value immediately and no test waits for it. A test
that is _about_ a transition sets the token back to its real value and awaits
`element.getAnimations()` — never a timer.

**Why.** Sampling mid-transition returns an interpolated colour, which is what the old
rule guarded against with a fixed 250 ms sleep; the sleep was the symptom, not the fix. It
cost ten seconds across the suite, and it hid a real leak: with the pointer left where the
previous test parked it, the next fixture inherited `:hover`, and only a delayed sample
made that look stable.

**Do** — assert the final value directly, and reset what the test moved:

```ts
expect(getComputedStyle(box).borderTopColor).to.equal(await colorOf('var(--bk-border-strong)'));
```

**Don't** — `await new Promise((resolve) => setTimeout(resolve, 250))`, and do not leave the
pointer over a fixture: `afterEach(resetMouse)` is what keeps one test's hover out of the
next one's colours.

**Enforced by.** Review; the suite's runtime is the visible effect.

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

## T8. One suite per component, a suite per part that has behaviour, and the packaging contract declared

**Rule.** A component ships `test/bk-<name>.test.ts` for its rules and nothing else. A part
gets a suite of its own when it has behaviour — the radio item's activation, the select atoms'
reflection, the field atoms' painting — and a part that only paints is covered where it is
used. **The packaging contract is not a test**: `package.json` declares
`"sideEffects": ["**/define.js"]`, `src/index.ts` imports no `define.js`, and
`CONTRIBUTING.md` states both. A concern is a `describe`, never a file: only a change of
level changes a file's home.

**Why.** Two claims were being tested that do not need it. "`define.js` registers its tags" is
proven by every suite that imports it and uses the element: an unregistered tag mounts an
unknown element and the assertions fail on a shadow root that is not there. "The entry
registers nothing" is a property of the **package**, not of a component — and no library tests
it: Shoelace imports its built bundle in every test, Spectrum and Material import the
component module, and all three make the claim with `sideEffects` and review. Seven suites and
fourteen assertions for one package-level fact was the wrong shape, and they sat in a
component's folder while testing the package.

**Do** — the component's own suite, and a part's when the part does something:

```
src/components/bk-field/
  bk-field.ts  bk-field-label.ts  define.ts  …
  test/
    bk-field.test.ts  bk-field-label.test.ts
```

**Don't** — a `*.register.test.ts` beside a component. When a new component lands, its file is
the suite; there is no list to extend and no second file to remember.

**Enforced by.** The suites themselves; `sideEffects` for a bundler; review for the entry.

## T9. Use the testing library's own vocabulary, never an alias

**Rule.** Cases are declared with `it(…)` and grouped with `describe(…)` — what
`@web/test-runner`'s mocha interface defines. The suite does not build aliases for them:
no `test`, no `spec`, no wrapper that exists to read better.

**Why.** An alias is API the library does not have, so every reader has to discover it, and
every tool that parses the suite — a reporter, an editor, a grep for a failing name — sees a
name that is ours instead of the one it knows. The gain was a sentence that reads better, and
the cost was a layer nobody asked for. The same instinct, kept honest, is what makes the rest
of this document worth following: use what the platform and the libraries give, and only
build where they have nothing.

**Do**

```ts
describe('bk-input', () => {
  it('should name the field from the label slot', () => {});
});
```

**Don't** — `const test = it;` and then a suite that calls `test(…)`.

**Enforced by.** Review; the suite imports no such name.

## Commands

| Command           | Use                |
| ----------------- | ------------------ |
| `pnpm test`       | one run, in Chrome |
| `pnpm test:watch` | the same, watching |

`browserLogs: true` puts the browser console in the output, which is how a Lit
warning or a CSS parse error becomes visible instead of silent.
