# Brick

A small set of web components built with [Lit](https://lit.dev) and TypeScript,
shipped as plain custom elements with a documented theming contract.

Two components are in scope: `bk-button` and `bk-input`. Everything else is
deliberately out of it.

## Quick start

```bash
pnpm install
pnpm dev                 # playground at http://localhost:5173
pnpm storybook           # stories at http://localhost:6006
pnpm test                # Web Test Runner, real Chrome
pnpm typecheck           # tsc --noEmit
```

Requirements: Node 22+ (the test runner requires it), pnpm and a local Chrome install.

## Structure

```
src/
├── components/          one folder per component: element, stories, test
├── styles/theme.css     theming entry point, only @imports the token files
├── styles/tokens/       one file per token group: space, rounded, color,
│                        typography, base
└── index.ts             public entry point
```

Load `src/styles/theme.css` once in the host page (link or import). Components
never import it; each reads its custom properties with a hard-coded fallback, so
the tokens are optional at runtime and overridable at any level.

## Design tokens

The token files hold declarations only — no comments, no logic. What matters
about them is documented here instead.

### Groups

| File | Tokens | Rule |
| --- | --- | --- |
| `space.css` | `--bk-space-base`, `--bk-space-1…4` | 4px base; every step is a multiple of it |
| `rounded.css` | `--bk-radius-sm`, `-md`, `-lg` | aliases into the space scale, never raw pixels |
| `color.css` | `--bk-palette-*`, `--bk-color-*`, `--bk-focus-ring` | two layers: primitives, then semantic roles |
| `typography.css` | `--bk-font-sans`, `--bk-font-size-sm/md`, `--bk-line-height-md` | sizes in `rem` so browser font settings apply |
| `base.css` | `--bk-border-width`, `--bk-control-height`, `--bk-transition` | structural values outside the four groups |

### Space is the single rhythm

`--bk-space-base` is 4px and every step derives from it:
`--bk-space-2` is `calc(var(--bk-space-base) * 2)`. Change the base and the
whole spacing rhythm rescales. Do not add a step that is not a multiple of the
base; a one-off padding is how the scale stops meaning anything.

### Radius follows space, it does not have its own scale

`--bk-radius-sm` is `--bk-space-1`, `-md` is `--bk-space-2`, `-lg` is
`--bk-space-4`. A corner can therefore never drift off the 4px grid. This is
why `--bk-radius-lg` is 16px: before the split it was 14px, which had no place
on the scale. Nothing in the kit read it, so no rendering changed.

### Color has two layers

- **Primitives** (`--bk-palette-*`) are raw values — the palette as it exists,
named after color and step. Nothing but `color.css` should reference them.
- **Semantic** (`--bk-color-*`, `--bk-focus-ring`) are roles, and each one is an
alias to a primitive. Components and themes use only this layer.

Re-theme by overriding semantic tokens on `:root` or on any subtree:

```css
.acme {
  --bk-color-primary: var(--bk-palette-sky-600);
  --bk-focus-ring: var(--bk-palette-orange-700);
}
```

Touch a palette token only when the brand palette itself changes, and only in
`color.css`.

### Adding a token

Add it to the file of its group, wire it to the layer above it (`rounded` to
`space`, semantic to a primitive), and document any value that is not obvious
from its name in this section. If a value needs a comment to be understood
inside the CSS file, that is a documentation task, not a comment.

Contracts and technical decisions live in this README section.
