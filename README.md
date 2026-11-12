# Brick

[![ci](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml)

A small set of web components built with [Lit](https://lit.dev) and TypeScript,
shipped as plain custom elements with a documented theming contract.

`bk-button` and `bk-input` are in scope. Everything else is deliberately out of
it: a kit of two components that each behave predictably is worth more than ten
that half work.

[Live Storybook](https://sebakellner.github.io/brick-ui/) · [Architecture notes](#design-decisions)

> **Status: 0.1.0, not published.** The package is `private` and has no `exports`
> or `types` entry yet, so there is nothing to install from npm. Use it from the
> repository as described below. See [Distribution](#distribution).

## Quick start

```bash
pnpm install
pnpm dev          # playground
pnpm storybook    # component stories
pnpm test         # Web Test Runner, real Chrome
pnpm typecheck    # tsc --noEmit
```

Node 22+, pnpm, and a local Chrome for the test runner.

Load the theme once, then use the elements:

```html
<link rel="stylesheet" href="/src/styles/theme.css" />

<bk-button>Save changes</bk-button>
<bk-button variant="secondary">Cancel</bk-button>

<bk-input label="Email" helper="We never share it." placeholder="you@brick.dev"></bk-input>

<script type="module" src="/src/index.ts"></script>
```

The theme is optional. Every component reads its custom properties with a
hard-coded fallback, so a page without `theme.css` still renders — it just
renders with the kit's built-in values instead of yours.

## Components

### `bk-button`

| Property | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | reflected |
| `disabled` | `disabled` | `boolean` | `false` | reflected, blocks clicks |

Default slot: the label. `part="button"` exposes the inner native `<button>`.
Focus is delegated to it, so setting focus on the host is enough.

```html
<bk-button variant="ghost" disabled>Learn more</bk-button>
```

### `bk-input`

| Property | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `''` | bound with `for`/`id`; omitted when empty |
| `helper` | `helper` | `string` | `''` | shown when there is no `error` |
| `error` | `error` | `string` | `''` | wins over `helper`; sets `aria-invalid="true"` |
| `value` | `value` | `string` | `''` | |
| `name` | `name` | `string` | `''` | |
| `type` | `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'` | `'text'` | |
| `placeholder` | `placeholder` | `string` | `''` | |
| `disabled` | `disabled` | `boolean` | `false` | reflected |
| `required` | `required` | `boolean` | `false` | reflected |

**Event** — `bk-change`, `detail: { value: string }`, `bubbles: true`,
`composed: true`, so it crosses the shadow boundary like a native `change`.

**Parts** — `label`, `input`, `message`.

The message region always exists so screen readers announce `error` when it
appears, and collapses with `:empty` when there is nothing to say.
`aria-describedby` points at it only while it has content.

## Theming

`src/styles/theme.css` is the entry point. Components never import it: each reads
its custom properties with a hard-coded fallback, so tokens are optional at
runtime and overridable at any level.

### Three layers of color

```
--bk-palette-*          raw palette, referenced only by the layers below
  └── --bk-color-*      shared roles: muted text, muted surface, strong border,
      │                 danger, focus ring
      └── --bk-button-{variant}-* / --bk-input-*   what a control actually paints
```

A component never holds a literal color, so re-theming a variant is a token
edit, not a component change.

### Two rules that keep the scales honest

- **Space is the only rhythm.** `--bk-space-base` is 4px and every step derives
  from it (`--bk-space-2` is `calc(var(--bk-space-base) * 2)`). Do not add a step
  off the grid; a one-off padding is how a scale stops meaning anything.
- **Radius has no scale of its own.** It aliases space: `-sm` = space 1, `-md` =
  space 2, `-lg` = space 4. A corner that needs 14px is a design decision, not a
  token.

### Overriding

Public hooks are read by a component and declared nowhere, so they always win
over a variant default, even when inherited from an ancestor:

```css
.checkout {
  --bk-button-bg: var(--bk-palette-sky-600);
  --bk-button-bg-hover: var(--bk-palette-sky-600);
  --bk-input-radius: var(--bk-radius-sm);
}
```

Available hooks: `--bk-button-bg`, `--bk-button-bg-hover`, `--bk-button-fg`,
`--bk-button-border`, `--bk-button-border-hover`, `--bk-button-radius`,
`--bk-input-radius`. Component internals (`--bk-button-variant-*`) are not part
of the contract — don't override them.

### Token reference

| File | Declares | Rule |
| --- | --- | --- |
| `space.css` | `--bk-space-base`, `--bk-space-1…4` | 4px base, every step a multiple |
| `rounded.css` | `--bk-radius-sm/md/lg` | aliases into the space scale |
| `color.css` | `--bk-palette-*`, `--bk-color-*`, `--bk-focus-ring` | palette, then semantic roles |
| `control.css` | `--bk-button-{variant}-*`, `--bk-input-*` | control roles, aliased to the palette |
| `typography.css` | `--bk-font-sans`, `--bk-font-size-sm/md`, `--bk-line-height-md` | `rem` sizes respect browser font settings |
| `base.css` | `--bk-border-width`, `--bk-control-height`, `--bk-transition` | structural values outside the groups above |

The token files are declarations only — no comments, no logic. If a value needs
a comment to be understood inside the CSS, that explanation belongs in this
section instead. A new token goes in its group file and is wired to the layer
above it.

## Accessibility

- Focus rings come from `--bk-focus-ring` and use `:focus-visible`, so pointer
  users don't see them.
- `bk-input` wires a real `<label>` with `for`/`id` and a live message region;
  `error` sets `aria-invalid` and is announced through `aria-describedby`.
- Both components delegate focus to the inner native control, so keyboard and
  screen-reader behaviour is the platform's, not a reimplementation.

## Project layout

```
src/
├── components/         one folder per component: element, stories, test
├── styles/theme.css    theming entry point: imports the token files only
├── styles/tokens/      one file per group (see the token reference)
└── index.ts            public entry point
```

## Testing

`pnpm test` runs Web Test Runner against real Chrome. The suite covers behaviour
(accessibility wiring, events, disabled propagation) and computed styles: each
control token, the variant mapping, override precedence, and the invalid border
that has to survive a hover. Hover is dispatched through
`@web/test-runner-commands`, not simulated by class swaps, so a specificity
regression fails the build instead of shipping.

Mutations that must fail the suite: inverting the hook/variant precedence, going
back to `font-family: inherit` on the button, or letting `input:hover` win over
`input[aria-invalid='true']`.

## CI and delivery

- `ci.yml` runs `typecheck`, the suite and a Storybook build on every pull
  request and on `main`.
- `storybook-pages.yml` publishes the Storybook to GitHub Pages, from `main`
  only, gated by the suite.
- `main` is protected: pull request required, both jobs required, admins
  included, force-push and deletion blocked.

## Design decisions

- **No runtime dependencies besides Lit.** No style-in-JS, no CSS framework, no
  theme provider. The contract is custom properties, which any host can set.
- **Fallbacks instead of an import.** A component that requires the theme is a
  component you cannot drop into an existing page.
- **Attributes for variants, tokens for colors.** `variant` is a reflected
  attribute because it is behaviour; the colors it picks are tokens because they
  are design.
- **Tests assert computed styles, not markup.** Markup assertions let a
  specificity bug through, which is exactly the class of defect this kit had.

## Distribution

Not published, by design so far. To make it consumable the package still needs:

- `exports` and `types` entries, plus a build step that emits JS and `.d.ts`.
- A `LICENSE` file. The repository is public but has no license, so reuse rights
  are reserved by default.
- A `files` allowlist so `src/` tests and stories don't ship.

Until then, consume it by copying `src/` or by depending on the repository.

## Known limitations

- `bk-input` marks its message region with `data-state="helper"`, but only
  `error` has a style rule; the helper text inherits the neutral message color.
- No visual regression coverage: computed styles are asserted, geometry is not.
- Chrome is the only browser the suite runs in today.
