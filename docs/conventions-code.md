# Code Conventions

Rules for the TypeScript, the stylesheets and the tooling. Token rules are in
[conventions-tokens.md](conventions-tokens.md); testing is in
[conventions-testing.md](conventions-testing.md).

| #   | Rule                                                     | Enforced by      |
| --- | -------------------------------------------------------- | ---------------- |
| C1  | Imports of local modules carry `.js`                     | `pnpm typecheck` |
| C2  | No comments in CSS                                       | review           |
| C3  | `strict`, `noUnusedLocals`, `noUnusedParameters` stay on | `pnpm typecheck` |
| C4  | Token names in component styles stay plain CSS strings   | review           |
| C5  | A disabled control has no hover and exactly one dim      | review           |

## C1. Imports of local modules carry `.js`

**Rule.** A `.ts` file imports its siblings with the `.js` extension:
`import './bk-input.js'`.

**Why.** `verbatimModuleSyntax` plus bundler resolution means the import specifier
is emitted verbatim, so it has to name the runtime file. The editor resolves it
either way, which is what makes this fail in `tsc` and nowhere else.

**Do**

```ts
import { BkInput } from './bk-input.js';
```

**Don't**

```ts
import { BkInput } from './bk-input';
```

**Enforced by.** `pnpm typecheck`.

## C2. No comments in CSS

**Rule.** Token files and component styles carry no comments. The explanation
lives in this directory.

**Why.** The generated token CSS cannot carry comments at all — Style Dictionary
is configured with `showFileHeader: false` — so a comment in a component
stylesheet would be the only prose in the layer. A component's explanation has two
better homes already: its `README.md` and its Storybook page.

**Do** — put the reason in the component `README.md` or in an ADR.

**Don't**

```css
/* the accent is blue-600 so the label stays readable */
background: var(--bk-bg-accent);
```

**Enforced by.** Review. There is no mechanical check, and the risk when this is
broken is small.

## C3. The strict flags stay on

**Rule.** `strict`, `noUnusedLocals` and `noUnusedParameters` are on and are not
relaxed per file or per directory.

**Why.** `noUnusedLocals` and `noUnusedParameters` are what make an unused fixture
binding a build error rather than a lint whisper. That matters in tests, where a
binding left behind by an edit is the usual sign the test no longer tests what it
claims.

**Enforced by.** `pnpm typecheck`.

## C4. Token names stay plain CSS strings

**Rule.** Component styles read tokens as literal `var(--bk-…)` text, not as typed
expressions.

**Why.** Lit types the `css` tag to accept only `CSSResultGroup` or numbers as
interpolations, so a token name cannot be passed as a typed value without wrapping
it in `unsafeCSS`. Doing that turned every read into noise, in exchange for a
guarantee that `pnpm check:tokens` already provides: an unknown name fails CI.
Typed names exist and are exported (`TokenName`, `HookName` in
`src/styles/tokens.generated.ts`) for code that wants them; the stylesheets do not.

**Do**

```css
background: var(--bk-bg-accent);
```

**Don't**

```ts
background: css`
  background: ${unsafeCSS(tokens.buttonPrimaryBg)};
`;
```

**Enforced by.** Review — and `check:tokens` covers the failure this would
otherwise catch.

## C5. A disabled control has no hover and exactly one dim

**Rule.** A disabled control is drawn with `opacity: var(--bk-opacity-disabled)`
and has no hover state: every hover rule is guarded by the disabled condition, so
pointing at an unavailable control changes nothing. The dim is written once, at
the container that owns the state — the control's own row, never the row and the
label inside it. A message region (`bk-field-description`, `bk-field-error`, the
`message` part) is never dimmed. A component hook may default to the primitive,
but never repeats its value.

The dim keys off the fact `disabled`, not off the painted state. `data-state`
carries one value and `invalid` wins it, so a control that owns a dim writes
`data-disabled` beside `data-state` and dims on that; the muted role is no longer
what paints an unavailable thing.

**Why.** WCAG exempts inactive components from its contrast minimums (1.4.3,
1.4.11), so a dim is an honest "unavailable" rather than a contrast failure. But
the dim does not inherit safely: opacity on the row and opacity on the label
inside it compose, and two 0.5s draw the text at 0.25. Two names for one value
drift the same way — the first retune leaves one of them behind.

**Do** — one dim, on the element that owns the state, plus a guarded hover:

```css
.control:disabled {
  cursor: not-allowed;
  opacity: var(--bk-opacity-disabled);
}

.control:hover:not(:disabled):not([aria-invalid='true']) {
  border-color: var(--bk-border-strong);
}
```

**Don't** — dim the row and the label inside it, or paint the disabled state with
the muted roles:

```css
.field[data-state='disabled'] {
  color: var(--bk-text-muted);
  background: var(--bk-bg-surface-muted);
}

.field[data-state='disabled'] .label {
  opacity: 0.5;
}
```

**Enforced by.** Review. The tests assert the computed opacity against the token,
and that hovering a disabled control leaves its border and background where they
were.
