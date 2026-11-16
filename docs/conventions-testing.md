# Testing Conventions

The suite runs in real Chrome through Web Test Runner. `web-test-runner.config.mjs`
picks up `src/**/*.test.ts`: a component's rule suites live in its `test/` folder, an assembly of two
or more widgets that the test composes lives under `src/test/integration/`, and the
`sendMouse` plugin is what the hover and focus tests need. One engine is a decision, not
an accident: see [ADR 0005](adr/0005-test-in-chrome-only.md).

The fifteen numbered rules follow, each with what enforces it. The **three levels** after
them are the frame the rules sit in: where a suite lives and what it is allowed to assert.
They are not numbered because they are judged as a whole — a misplaced suite is caught by
reading a diff, not by one assertion going red — while a rule is something a single test
can name.

| #   | Rule                                                                 | Enforced by                                |
| --- | -------------------------------------------------------------------- | ------------------------------------------ |
| T1  | The runner page loads the theme, once                                | the suite — an unstyled read fails         |
| T2  | Assert computed styles, not markup                                   | review                                     |
| T3  | Drive hover and focus with real input                                | review                                     |
| T4  | The test page has no transition to wait for                          | review; the suite runtime shows it         |
| T5  | Every fix is provable by mutation                                    | review                                     |
| T6  | Never put a DOM element on the tested side of a failure              | the suite — a violation is a hang          |
| T7  | The runner claims a pointer, and the suite proves it                 | `browser.test.ts` + the enabled sibling    |
| T8  | One suite per component, a part only when it has behaviour           | the suites, visible in the inventory       |
| T9  | Use the testing library's own vocabulary, never an alias             | review                                     |
| T10 | A rule earns its path, and the case that refuses it                  | review                                     |
| T11 | A defect is pinned before the fix, and the title names it            | review — the red before the green          |
| T12 | Coverage is not a number, and that is a decision                     | review; no coverage tooling is installed   |
| T13 | A suite does not mock, wait on a duration, or depend on order        | review                                     |
| T14 | A suite is named after its element, and a case says what should hold | review                                     |
| T15 | Accessibility is asserted by rule and by audit                       | `a11y.test.ts`, then every component suite |

## The three levels, and who decides the composition

The line between a unit test and an integration test is not "how many elements it
imports" — almost every suite here imports an atom's `define.js`, because the atoms are
the kit's vocabulary. The line is **who decides the composition**:

| Level           | Subject                                                                                                                                                                          | Who composes    | Where                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| **unit**        | one component and **the parts it fixes** — a control with its atoms, a group with its boxes, the field with its own atoms — plus the platform around it (`<form>`, `<fieldset>`) | the component   | `src/components/bk-x/test/bk-x.test.ts`, `describe` per concern |
| **integration** | an assembly of **two or more widgets that depend on each other**, chosen by the test                                                                                             | the test        | `src/test/integration/<assembly>/<rule>.test.ts`                |
| **e2e** (later) | **the package on a real page**: the entry registers nothing, each `define.js` registers its tags, `theme.css` applies, and the bundle Vite produces loads                        | the application | `e2e/` with Playwright, once the kit is consumed by an app      |

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
- **No mocks at any level** (T13). E2E included: a real page, a real package.

**What e2e adds, and what it will never repeat.** The package is the subject: the entry
registers nothing, each `define.js` registers its tags, a page that links `theme.css` gets the
theme, and the bundle the build produces loads. Google's size vocabulary is the same line —
a Large test validates "the interaction of several distinct parts of the system" — and FAST
runs its Playwright suite as a separate step after the unit suite, not as a bigger one. What
it must not do is re-assert a component's rules: a computed style that a unit test already
pins is not more true from a Playwright page.

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
of sixteen files. ADR 0002 still decides that the theme is required; the loader it
mentions (`before(loadTheme)`) is gone, and
[0015](adr/0015-the-page-loads-the-theme-the-suite-does-not.md) supersedes that part of
it. Fetching the same stylesheet from each suite was sixteen chances
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

**Accessibility is a concern, not a part.** The audit and the A-rule cases live inside the
component's suite, under a `describe('accessibility')`, and not in a
`bk-<name>.a11y.test.ts`. It was considered as an exception on 2026-11-16 and rejected: the
whole suite runs in 5.2 s with the audit inside it, a failing case already prints the
component's name, and a second file per component repeats verbatim the argument this rule
exists to refuse for `.form` and `.error` files. A hang is the one thing that would reopen
it — a hang in a shared file costs that file's whole signal, and axe has not produced one.

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

## T10. A rule earns its path, and the case that refuses it

**Rule.** A rule the component documents is asserted on the path the consumer expects and on
the case the rule itself names — the boundary, the empty state, or the refusal. A rule that
names a refusal is not proved by the run where nothing is refused: `aria-disabled` is not
proved by a click that lands, and an empty region is not proved by a reference that resolves.
Two cases, not twenty: the matrix of every combination is a different project.

**Why.** A suite of happy paths asserts what nobody doubted. The refusals are where this kit
has actually broken — a slotted error atom that rendered while the field said valid, a
disabled checkbox whose check was illegible at 1.09:1, an `aria-describedby` naming an empty
region. Each was the case its own rule named and the suite did not run. Spectrum asks for
"error handling and edge cases" and its review checklist for exercising "unhappy paths and
error or empty states in good faith"; Shoelace asks for "all features advertised in the
component's description".

**Do** — the refusing case, named as such:

```ts
it('should ignore activation while aria-disabled', () => {});
it('should reference no description while the region is empty', () => {});
```

**Don't** — a suite whose every title describes the success path, with the refusal left to
whoever remembers.

**Enforced by.** Review, against the rules each `README.md` documents.

## T11. A defect is pinned before the fix, and the title names it

**Rule.** A defect gets its test on the unfixed code and that test is seen red; the title says
what the state does now, not what the fix did; the test lands in the same commit as the fix.
No issue link is required in the title — this repository has no such convention, and the test
name is what a later search finds.

**Why.** "No bug is considered properly fixed without an automated regression test"
(Fowler); "write a failing test that reproduces the bug" and watch it fail (Baloise); "all PRs
that change behavior or fix bugs should have new or updated tests" (Lit). T5 already demands
the mutation that proves a test is load-bearing; a defect is the one case where the red is
given to you before the fix exists, so skipping it gives up the cheapest evidence in the
repository.

**Do** — `it('should keep the check legible on a disabled checked box')`, the state and its
cost.

**Don't** — `it('should fix #42')`, a number only the tracker can resolve.

**Enforced by.** Review; the red before the green is the evidence, and the commit records it.

## T12. Coverage is not a number, and that is a decision

**Rule.** No coverage threshold, no coverage report in CI, no percentage quoted in a pull
request. A suite is judged by whether each rule a component documents has a case, not by how
much of a file it executes.

**Why.** Google's testing chapter names the failure mode: engineers treat the number "like a
ceiling … changes begin landing with no more than 80% coverage", and recommends measuring
coverage from small tests only. Fowler: "test coverage is of little use as a numeric statement
of how good your tests are". Shoelace's maintainer: "I don't care about the number of tests or
even coverage — I care about sensibility". The counter-example is real and named honestly:
Spectrum Web Components keeps 99% with an auto-ratchet, and also runs visual regression and a
Playwright accessibility suite. This repository has neither, so a threshold here would be a
target for a number no one reads, guarding rules the audit in T15 already reaches.

**Do** — ask which documented rule has no case, and add that case.

**Don't** — install `c8`/`istanbul` and a `thresholds` block to feel the same.

**Enforced by.** Review, plus the absence of any coverage dependency in `package.json`.

## T13. A suite does not mock, wait on a duration, or depend on order

**Rule.** No `stub`, `spy`, `mock` or fake object, at any level, and no network: the test uses
the real element and the real page. A test that must settle awaits `updateComplete`,
`nextFrame()`, or a browser command; a zero-delay flush is a settle, but a chosen duration is
not a wait (T4), and `setTimeout(…, 250)` with an assertion after it is a flaky test with a
number in it. No suite depends on the order in which files run; the pointer is the one global,
and it is reset in `afterEach`.

**Why.** A mock asserts the mock: it answers whether the test agrees with itself, while the
question is what Chrome paints. The transition lesson in T4 is the same one — a duration is an
assumption about a machine — and the pointer leak is the same leak in another costume: three
suites once read `:hover` left by the previous one.

**Do** — `await el.updateComplete;` / `await nextFrame();` / `await sendKeys({ press: 'Tab' })`.

**Don't** — `sinon.stub(el, 'focus')`, `await new Promise((r) => setTimeout(r, 250))`.

**Enforced by.** Review; grep finds no mocking library in `package.json`.

## T14. A suite is named after its element, and a case says what should hold

**Rule.** The outer `describe` carries the tag (`bk-checkbox`, `bk-radio-group-item`), a
concern is a nested `describe` named for the concern (`accessibility`, `form participation`,
`.styles`), and every `it` begins with `should`, names the state it puts the element in and
the effect it expects. When the theme matters, the theme is in the title — `(light)`,
`(dark)` — because a pair runs twice and the second name is how a reader finds the one that
failed.

**Why.** The title is the entire output of a failing run: `expected 'none' to equal 'solid'`
says nothing until you know which case produced it. Material Web's suite reads
`describe('<md-filled-button>')` → `it('should not execute pre-bound click listeners when
soft-disabled')`; Primer's reads `describe('Button')`; Shoelace asks contributors to "group
multiple tests for one feature into describe blocks".

**Do** — `it('should keep the box boundary at 3:1 against its own surface (dark)')`.

**Don't** — `it('works')`, `it('test 3')`, `it('can be disabled and also focused')`.

**Enforced by.** Review; the suites follow it today.

## T15. Accessibility is asserted by rule and by audit

**Rule.** A component suite carries both halves. The rules are cases like any other, from
[conventions-accessibility.md](conventions-accessibility.md): the association, the reference
that disappears with its content, the disabled state, the live region that stays, and every
contrast pair A2 owes. The audit is one more case per theme: `await expectNoViolations(el)`
from `src/test/helpers/a11y.ts`, running `wcag2a`, `wcag2aa` and `best-practice`. Neither half
replaces the other — the audit cannot tell "renders nothing" from "clean", and no case can
see the wiring nobody thought to name.

**Why.** The audit caught what no single case owned: a label that resolves to nothing, an ARIA
attribute pointing at no node. The pairs caught what the audit cannot see: the canvas it grades
against is the painted page, and an unpainted page made it report 1.09:1 on a pair the kit
paints at 8:1 — six findings, none of them a defect. Both lessons are now environment: the
runner page paints `body` with `--bk-bg-surface`, and the gate's own suite proves it can fail.

**Do** — the two halves, in the same suite, under `describe('accessibility')`.

**Don't** — a green audit read as proof that the component rendered, or a contrast rule
skipped because axe runs.

**Enforced by.** `src/test/helpers/a11y.test.ts` proves the gate fails on a violation and
passes an empty fixture; the component suites run it in both themes.

## Commands

| Command           | Use                |
| ----------------- | ------------------ |
| `pnpm test`       | one run, in Chrome |
| `pnpm test:watch` | the same, watching |

`browserLogs: true` puts the browser console in the output, which is how a Lit
warning or a CSS parse error becomes visible instead of silent.
