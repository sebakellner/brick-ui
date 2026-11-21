# Code Conventions

Rules for the TypeScript, the stylesheets and the tooling. Token rules are in
[tokens.md](tokens.md); testing is in
[testing.md](testing.md).

| #   | Rule                                                                         | Enforced by      |
| --- | ---------------------------------------------------------------------------- | ---------------- |
| C1  | Imports of local modules carry `.js`                                         | `pnpm typecheck` |
| C2  | No comments in CSS                                                           | review           |
| C3  | `strict`, `noUnusedLocals`, `noUnusedParameters` stay on                     | `pnpm typecheck` |
| C4  | Token names in component styles stay plain CSS strings                       | review           |
| C5  | A disabled control keeps its muted text, loses its hover and carries one dim | review           |

## C1. Imports of local modules carry `.js`

**Rule.** A `.ts` file imports its siblings with the `.js` extension:
`import './brikka-input.js'`.

**Why.** `verbatimModuleSyntax` plus bundler resolution means the import specifier
is emitted verbatim, so it has to name the runtime file. The editor resolves it
either way, which is what makes this fail in `tsc` and nowhere else.

**Do**

```ts
import { BrikkaInput } from './brikka-input.js';
```

**Don't**

```ts
import { BrikkaInput } from './brikka-input';
```

**Enforced by.** `pnpm typecheck`.

## C2. No comments in CSS

**Rule.** Token files and component styles carry no comments. The explanation
lives in [system.md](../architecture/system.md).

**Why.** The generated token CSS cannot carry comments at all — Style Dictionary
is configured with `showFileHeader: false` — so a comment in a component
stylesheet would be the only prose in the layer. A component's explanation has two
better homes already: its `README.md` and its Storybook page.

**Do** — put the reason in the component `README.md` or in an ADR.

**Don't**

```css
/* the accent is blue-600 so the label stays readable */
background: var(--brikka-bg-accent);
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

**Rule.** Component styles read tokens as literal `var(--brikka-…)` text, not as typed
expressions.

**Why.** Lit types the `css` tag to accept only `CSSResultGroup` or numbers as
interpolations, so a token name cannot be passed as a typed value without wrapping
it in `unsafeCSS`. Doing that turned every read into noise, in exchange for a
guarantee that `pnpm check:tokens` already provides: an unknown name fails CI.
Typed names exist and are exported (`TokenName`, `HookName` in
`packages/tokens/src/tokens.generated.ts`) for code that wants them; the stylesheets do not.

**Do**

```css
background: var(--brikka-bg-accent);
```

**Don't**

```ts
background: css`
  background: ${unsafeCSS(tokens.buttonPrimaryBg)};
`;
```

**Enforced by.** Review — and `check:tokens` covers the failure this would
otherwise catch.

## C5. A disabled control keeps its muted text, loses its hover and carries one dim

**Rule.** A disabled control is drawn with `opacity: var(--brikka-opacity-disabled)`
and has no hover state: every hover rule is guarded by the disabled condition, so
pointing at an unavailable control changes nothing. Its value text reads
`--brikka-text-muted`, the role the placeholder already reads, so a filled field does
not read as an empty one. The surface is **not** repainted: a disabled field keeps
`--brikka-bg-surface`.

The dim speaks for the availability, the muted text role speaks for the content,
and neither repaints the surface. An atom hosted by a disabled control still
carries `data-state="disabled"` — it reports the state, it does not paint it; the
container that owns the row is the one that dims, and a consumer can style the atom
on that state if they want a louder signal. The dim is written once, at the container that
owns the state — the control's own row, never the row and the label inside it. A
message region (`brikka-field-description`, `brikka-field-error`, the `message` part) is
never dimmed. A component hook may default to the primitive, but never repeats
its value.

The dim keys off the fact `disabled`, not off the painted state. `data-state`
carries one value and `invalid` wins it, so a control that owns a dim writes
`data-disabled` beside `data-state` and dims on that; the muted role paints the
value text, never the whole unavailable control.

**Why.** WCAG exempts inactive components from its contrast minimums (1.4.3,
1.4.11), so a dim is an honest "unavailable" rather than a contrast failure. But
the dim does not inherit safely: opacity on the row and opacity on the label
inside it compose, and two 0.5s draw the text at 0.25. Two names for one value
drift the same way — the first retune leaves one of them behind. The muted
surface, by contrast, is the empty field's surface: painting it under a disabled
value makes a filled field look unfilled, which is why the text carries the
signal instead.

**Do** — muted text, one dim, on the element that owns the state, plus a guarded
hover:

```css
.control:disabled {
  cursor: not-allowed;
  color: var(--brikka-text-muted);
  opacity: var(--brikka-opacity-disabled);
}

.control:hover:not(:disabled):not([aria-invalid='true']) {
  border-color: var(--brikka-border-strong);
}
```

**Don't** — dim the row and the label inside it, or repaint the surface of the
disabled control with the muted one:

```css
.field[data-state='disabled'] {
  background: var(--brikka-bg-surface-muted);
}

.field[data-state='disabled'] .label {
  opacity: 0.5;
}
```

**Enforced by.** Review. The tests assert the computed opacity against the token,
the value's colour against the muted role, the background against the surface
role, and that hovering a disabled control leaves its border and background where
they were — with a hovered enabled sibling as the positive control, so the
assertion cannot pass in a browser that never applies the hover rule.

## C6. A comment records a constraint the code cannot show

**Rule.** A comment earns its place only if deleting it would let a future reader
reintroduce a bug: a platform limit, an ordering requirement, a trap whose mutation
would stay green, or a reading that differs from the obvious one. Nothing else.
What the code does belongs in its names; why the kit is shaped a certain way belongs
in an ADR or in `docs/architecture/system.md`; CSS carries no comments at all
([C2](#c2-no-comments-in-css)). One line is the budget; a header that needs more
than about five is not a comment, it is a decision record that lives in the wrong
file.

**Why.** A comment that restates the code decays silently — nobody notices it stops
being true. A comment that argues a decision forks it: the ADR says one thing and
the file says a slightly different one, and the next reader keeps whichever they met
first. The header this rule was written after had thirty lines retelling
`docs/architecture/system.md`, and the code it described fitted in four.

**Do** — the constraint, in a line or two, pointing at the record:

```ts
/* Read unflattened: flattening answers with the slot's fallback, which is the
 * field's own message. Why the kit needs an observer: architecture/system.md. */
```

**Don't** — a doc block that retells a decision, or a paragraph the ADR already
owns.

**Enforced by.** Review, with one question as the measure: if the comment were
deleted, would a test still catch the mistake? If a test would, the comment is
explaining; if it would not, the comment is load-bearing and stays.
