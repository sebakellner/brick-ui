# Brick

[![ci](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml)

A small set of web components built with [Lit](https://lit.dev) and TypeScript,
shipped as plain custom elements with a documented theming contract.

Two components are in scope: `bk-button` and `bk-input`.

[Live Storybook](https://sebakellner.github.io/brick-ui/) · [Design decisions](docs/design-decisions.md)

> **Status: 0.1.0, not published.** The package is `private` and has no `exports`,
> `types` or `LICENSE` yet. Use it from the repository.

## Quick start

```bash
pnpm install
pnpm build:tokens   # regenerate src/styles/tokens/*.css from tokens/*.json
pnpm dev            # playground
pnpm storybook      # component stories
pnpm test           # Web Test Runner, real Chrome
pnpm typecheck      # tsc --noEmit
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

**The theme is required.** Components read tokens with no inline fallbacks, so a
page that skips `theme.css` renders unstyled — visibly, not subtly.

## Components

| Element | Properties | Event |
| --- | --- | --- |
| `bk-button` | `variant` (`primary`, `secondary`, `ghost`), `disabled` | — |
| `bk-input` | `label`, `helper`, `error`, `value`, `name`, `type`, `placeholder`, `disabled`, `required` | `bk-change` with `{ value }` |

Both delegate focus to the inner native control and expose `part`s for anything
the tokens do not cover: `button` for the button, `label`, `input` and `message`
for the field. `bk-input` wires a real `<label>`, `aria-describedby` and
`aria-invalid`; `error` wins over `helper`.

## Theming

`src/styles/theme.css` is the entry point; the tokens come from `tokens/*.json`
through Style Dictionary, in six groups: space, rounded, color, control,
typography and base. Override a semantic or control token anywhere in the tree:

```css
.checkout {
  --bk-button-bg: var(--bk-palette-sky-600);
  --bk-input-radius: var(--bk-radius-sm);
}
```

`--bk-button-bg`, `--bk-button-bg-hover`, `--bk-button-fg`, `--bk-button-border`,
`--bk-button-border-hover`, `--bk-button-radius` and `--bk-input-radius` are the
override hooks. The rest are defaults.

## Project layout

```
tokens/                 token source: one JSON file per group
src/
├── components/         one folder per component: element, stories, test
├── styles/theme.css    theming entry point: imports the generated token files
├── styles/tokens/      generated CSS — do not edit by hand
├── test-helpers/       shared test setup (loads the theme)
└── index.ts            public entry point
docs/                   design rationale and known gaps
```

## Contributing

Pull requests only — `main` is protected, and both CI jobs (`test` and
`storybook build`) are required. `pnpm build:tokens` output is committed; CI
fails when the generated CSS does not match `tokens/*.json`.
