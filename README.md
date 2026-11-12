# Brick

A small set of web components built with [Lit](https://lit.dev) and TypeScript,
shipped as plain custom elements with a documented theming contract.

Two components are in scope: `bk-button` and `bk-input`. Everything else is
deliberately out of it.

## Quick start

```bash
pnpm install
pnpm dev          # playground
pnpm storybook    # stories
pnpm test         # Web Test Runner, real Chrome
pnpm typecheck    # tsc --noEmit
```

Node 22+, pnpm and a local Chrome install.

## Structure

```
src/
├── components/         one folder per component: element, stories, test
├── styles/theme.css    theming entry point: imports the token files only
├── styles/tokens/      one file per group: space, rounded, color, control,
│                       typography, base
└── index.ts            public entry point
```

Load `src/styles/theme.css` once in the host page. Components never import it:
each reads its custom properties with a hard-coded fallback, so the tokens are
optional at runtime and overridable at any level.

## Design tokens

The token files are declarations only — no comments, no logic. What needs
explaining lives here.

| File | Declares | Rule |
| --- | --- | --- |
| `space.css` | `--bk-space-base`, `--bk-space-1…4` | 4px base; every step is a multiple |
| `rounded.css` | `--bk-radius-sm/md/lg` | aliases into the space scale |
| `color.css` | `--bk-palette-*`, `--bk-color-*`, `--bk-focus-ring` | palette first, then semantic roles |
| `control.css` | `--bk-button-{variant}-*`, `--bk-input-*` | control roles, aliased to the palette |
| `typography.css` | `--bk-font-sans`, `--bk-font-size-sm/md`, `--bk-line-height-md` | `rem` sizes, so browser font settings apply |
| `base.css` | `--bk-border-width`, `--bk-control-height`, `--bk-transition` | structural values, outside the groups above |

### Three layers of color

`--bk-palette-*` → `--bk-color-*` → `--bk-button-{variant}-*` / `--bk-input-*`.

Primitives are raw values, referenced only by the two layers above them.
Semantic roles are the few roles still shared across components: muted text,
muted surface, strong border, danger and the focus ring. Control roles are what
a form control paints; a component never holds a literal color, so re-theming a
variant is a token edit.

### Three kinds of custom property

- **Declared tokens** are the defaults in the table above.
- **Component internals** are `--bk-button-variant-*`: a component sets them on
  `:host` from its control tokens (`--bk-button-secondary-bg`, …) so a public
  hook can win first. Not part of the contract, don't override them.
- **Override hooks** are read by a component and declared nowhere, so they always
  win over a default and keep a hard-coded fallback for a page without the theme:
  `--bk-button-bg`, `-bg-hover`, `-fg`, `-border`, `-border-hover`,
  `--bk-button-radius`, `--bk-input-radius`.

A hook can be set on any ancestor, not only on the element itself:

```css
.checkout {
  --bk-button-bg: var(--bk-palette-sky-600);
  --bk-button-bg-hover: var(--bk-palette-sky-700);
}
```

That reaches all three variants: the component reads the hook before the variant
default, and the variant default is a different variable, set on the component
host.

### Rules that keep the scale honest

- Space is the only rhythm: `--bk-space-2` is `calc(var(--bk-space-base) * 2)`.
  Do not add a step off the 4px grid; a one-off padding is how a scale dies.
- Radius has no scale of its own: it aliases space (`-sm` = space 1, `-md` = 2,
  `-lg` = 4). A corner that needs its own pixel value is a design decision, not a
  token.
- A new token goes in its group file and is wired to the layer above it
  (`rounded` → `space`, a control role → a palette entry). If it needs a comment
  inside the CSS to be understood, it belongs in this section.

## Contracts

- The theme is opt-in: with no stylesheet loaded, every component still renders
  because each `var()` carries the resolved value as its fallback.
- Overrides beat defaults, and that is why hooks are never declared in the token
  layer: a declared value would be a default fighting the override.
- `::part(button)`, `part="input"`, `part="label"` and `part="message"` are the
  escape hatches for whatever the tokens do not cover. `bk-input` emits a
  `bk-change` event with `{ value }`.
- Accessibility belongs to the component, not to the theme: focus rings come from
  `--bk-focus-ring`, the label/input link and `aria-describedby` are wired in
  `bk-input`, and `error` sets `aria-invalid`.

## Known gaps

- No test asserts a computed style, so a miswired control token or a wrong
  variant color is invisible to the suite.
- `bk-input` marks its message region with `data-state="helper"`, but only the
  `error` state has a rule.
