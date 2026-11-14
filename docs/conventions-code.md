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
