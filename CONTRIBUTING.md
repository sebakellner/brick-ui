# Contributing

How the kit is put together and how to add the next component without
re-deciding any of it. Read this before writing a component; the README covers
usage.

## The contract in one screen

```
tokens/*.json  ──build:tokens──>  src/styles/tokens/*.css  ──>  theme.css
                                                                   │
                                    components read it with var(--bk-*) and no fallback
```

1. **Tokens are generated, never hand-written.** `tokens/*.json` is the source;
   the CSS under `src/styles/tokens/` is output and committed. CI fails when they
   diverge, including untracked output.
2. **Aliases stay aliases.** The build uses `outputReferences`, so
   `{palette.orange-700}` becomes `var(--bk-palette-orange-700)` and never a
   resolved literal. Runtime theming keeps working; a values-only pipeline would
   have flattened it.
3. **The theme is required.** Components carry no fallback values. Defaults live
   once, in the generated CSS.
4. **Components carry no style literals.** Every color, length and duration comes
   from a token, and every token name is checked: `pnpm build:tokens` also emits
   `src/styles/tokens.generated.ts` with a `tokens` map, a `hooks` map and their
   unions, so `v(tokens.buttnBg)` fails `tsc` instead of rendering nothing.
   (`px` appears only in story scaffolding.)
5. **No CSS comments.** Token files and component styles stay declarative; the
   explanation lives here.

## Token layers

| Layer | Lives in | Answers | Example |
| --- | --- | --- | --- |
| Primitive | `tokens/color.json` → `palette.*` | what colors exist | `--bk-palette-orange-700` |
| Semantic | `palette` siblings: `color.*`, `focus-ring` | shared roles | `--bk-color-danger` |
| Control | `tokens/control.json` → `<component>.*` | what one control paints | `--bk-button-secondary-bg` |

Rules:

- Reference **downwards only**: control → palette, semantic → palette, `rounded` →
  `space`. Nothing references a control token.
- Prefer a control token for anything only one component paints. A semantic
  role is for a value shared across controls or a global affordance (focus ring,
  danger); when in doubt, check which components read it before adding one.
- A control token needs a component; if the component stops reading it, delete it.
- The palette is a reference ramp, not a usage list: unused entries stay.

### Naming

The token name is its JSON path joined with `-`, prefixed by `--bk-`
(`platform.prefix`). `button.secondary.bg-hover` becomes
`--bk-button-secondary-bg-hover`. So the path you write is the public name.

## Adding a component: checklist

1. **Tokens.** Add `tokens/<component>.json` with a top-level group named after
   the component, wired to palette entries. Reuse semantic roles only when the
   role is genuinely shared.
2. **Platform filter.** Add the group to `style-dictionary.config.mjs`. The
   filters are explicit lists: a group that is not listed is generated into no
   file at all, silently. Either add the name to an existing platform or add a
   new one with `cssFile('<group>.css', only('<group>'))`.
3. **Generate.** `pnpm build:tokens` and commit the CSS.
4. **Element.** `src/components/bk-<name>/bk-<name>.ts`, Lit + `delegatesFocus`,
   styles read tokens with no fallback, `part` attributes for escape hatches.
5. **Variants, if any.** Reflected attribute, plus the mapping pattern:

   ```css
   :host {
     --bk-x-variant-bg: var(--bk-x-primary-bg);
   }

   :host([variant='secondary']) {
     --bk-x-variant-bg: var(--bk-x-secondary-bg);
   }

   button /* the inner native element */ {
     background: var(--bk-x-bg, var(--bk-x-variant-bg));
   }

   /* written in the component as: */
   background: var(${v(tokens.xBg)}, var(${v(hooks.xVariantBg)}));
   ```

   The public hook is read first and the variant default lives in a different
   variable. That is what makes an override inherited from an ancestor win; if
   the variant wrote `--bk-x-bg` itself, the inherited override would lose.
6. **Accessibility in the component.** Real `<label>`/`for`, `aria-describedby`
   only while the described region has content, `aria-invalid` on error,
   `:focus-visible` for rings. Never rely on a host page to wire it.
7. **Tests.** `bk-<name>.test.ts` next to the element; `before(loadTheme)` from
   `src/test/helpers/theme.ts`; assert behaviour and computed styles.
8. **Stories.** `bk-<name>.stories.ts` with one story per variant and per state.
9. **Docs.** Add the element to the README components table, and name any
   limitation you are shipping with in the PR description.

## Testing recipe

```ts
before(loadTheme);                                   // the theme is required

const el = await fixture<BkX>(html`<bk-x label="Email"></bk-x>`);
expect(getComputedStyle(inner(el)).borderTopColor).to.equal('rgb(185, 28, 28)');
```

- Assert **computed styles**, not markup, for anything a token drives. Markup
  assertions pass through specificity bugs.
- For states the browser only enters with real input (hover, focus), dispatch it
  through `@web/test-runner-commands` (`sendMouse`); the plugin is registered in
  `web-test-runner.config.mjs`. A class swap cannot reproduce a specificity loss.
- Wait past the `--bk-transition` duration (120ms) before asserting a transitioned
  property, or you sample an interpolated color.
- Every fix should be provable by mutation: break the code, watch the test go red,
  restore it. If it stays green, the test is decorative.

## CI gates

`ci.yml` runs on every PR and on `main`:

| Job | Checks |
| --- | --- |
| `test` | tokens match the JSON (`git status --porcelain`, so untracked output counts), `typecheck`, the suite in real Chrome |
| `storybook build` | regenerates the tokens and builds the site |

`storybook-pages.yml` publishes from `main` only, gated by the suite. `main` is
protected: PR required, both jobs required, admins included.

## Scope decisions

Recorded so they are not reopened by accident:

| Decision | Value | Revisit when |
| --- | --- | --- |
| License | MIT (`LICENSE`) | never, unless relicensing |
| Browsers in the suite | Chrome only | a shadow-DOM or `:has()` bug escapes |
| Packaging | not published; consumed from the repo | the kit gets an outside consumer |
| Token names | typed through `tokens.generated.ts` | — |
| Visual regression | not covered; computed styles only | a layout bug escapes the suite |

## Harness gotchas

- **TS imports carry `.js`** (`verbatimModuleSyntax` + bundler resolution): import
  `'./bk-x.js'` from a `.ts` file.
- **`strict`, `noUnusedLocals`, `noUnusedParameters`** are on; unused fixture
  bindings fail `typecheck`, not just lint.
- Style Dictionary `css/variables` emits a header comment by default —
  `showFileHeader: false` keeps the token files comment-free.
- The `base` platform's filter is a name list; a new structural token (like
  `--bk-focus-ring-offset`) is silently dropped until its group is added.
- Lit types `css` as accepting only `CSSResultGroup | number` interpolations, so
  a token name goes through `v()` (`src/styles/tokens.ts`) — a bare string fails
  `tsc` even though it works at runtime.

## Why the load-bearing decisions are what they are

- **Generated tokens.** The alternative was hand-written CSS plus a script that
  validates it. A generator makes a broken reference a build error instead of a
  review catch, and leaves room for a second platform (TypeScript values, a dark
  theme) without rewriting the token layer.
- **Aliases as `var()`.** Resolving them at build time would kill per-subtree
  theming; a host could no longer re-theme `.checkout` without a rebuild.
- **Theme required.** Components used to carry ~50 hard-coded fallbacks. Nothing
  ever exercised them — the playground and Storybook both load the theme — while
  they duplicated the source of truth. Change a palette entry, rebuild, and the
  fallback kept painting the old color with no error. A visibly unstyled
  component gets fixed; a subtly off-brand one ships.
- **No inline literals.** The focus ring was the last holdout — a 2px outline
  written inline next to a tokenized color. It now reads
  `--bk-focus-ring-width` and `--bk-focus-ring-offset`.
