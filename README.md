# Brick

[![ci](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml)

A small set of web components built with [Lit](https://lit.dev) and TypeScript,
shipped as plain custom elements with a token-driven theming contract.

Two components are in scope: `bk-button` and `bk-input`.

[Storybook](https://sebakellner.github.io/brick-ui/) · [Contributing](CONTRIBUTING.md)

> **Status: 0.1.0, not published.** The package is `private`; consume it from the
> repository.

## Install

```bash
pnpm install
```

Load the theme once, then use the elements:

```html
<link rel="stylesheet" href="/src/styles/theme.css" />

<bk-button>Save changes</bk-button>
<bk-button variant="secondary">Cancel</bk-button>

<bk-input label="Email" helper="We never share it." placeholder="you@brick.dev"></bk-input>

<script type="module" src="/src/index.ts"></script>
```

The theme is required: components carry no fallback values, so a page without
`theme.css` renders visibly unstyled.

Requirements: Node 22+, pnpm, and Chrome for the test runner.

## Components

| Element | Summary | Docs |
| --- | --- | --- |
| `bk-button` | `primary`, `secondary` and `ghost` variants, disabled state | [README](src/components/bk-button/README.md) · [Docs](https://sebakellner.github.io/brick-ui/?path=/docs/components-button--docs) |
| `bk-input` | Single-line field with label, helper, error and `bk-change` | [README](src/components/bk-input/README.md) · [Docs](https://sebakellner.github.io/brick-ui/?path=/docs/components-input--docs) |

Both delegate focus to the inner native control and expose `part`s for whatever
the tokens do not cover.

## Theming

`src/styles/theme.css` is the entry point. Tokens come from `tokens/*.json`
through Style Dictionary, in six groups: space, rounded, color, control,
typography and base. The accent is the blue ramp (`--bk-palette-blue-600`, with
`blue-700` on hover); the focus ring stays `sky-600`.

Override a token anywhere in the tree:

```css
.checkout {
  --bk-button-bg: var(--bk-palette-sky-600);
  --bk-input-radius: var(--bk-radius-sm);
}
```

Override hooks: `--bk-button-bg`, `--bk-button-bg-hover`, `--bk-button-fg`,
`--bk-button-border`, `--bk-button-border-hover`, `--bk-button-radius`,
`--bk-input-radius`. Everything else is a declared default.

## Structure

```
tokens/                 token source: one JSON file per group
src/
├── components/         one folder per component: element, stories, docs, test, README
├── styles/theme.css    theming entry point: imports the generated token files
├── styles/tokens/      generated CSS — do not edit by hand
├── test/helpers/       shared test setup (loads the theme)
└── index.ts            public entry point
CONTRIBUTING.md         conventions and checklist for the next component
```

## Development

```bash
pnpm dev            # playground
pnpm storybook      # component stories
pnpm build:tokens   # regenerate src/styles/tokens/*.css from tokens/*.json
pnpm check:tokens   # validate the names components use and the roles they read
pnpm test           # Web Test Runner, real Chrome
pnpm typecheck      # tsc --noEmit
```

## Documentation

| Where | What |
| --- | --- |
| This README | What the kit is, how to install and use it |
| `src/components/*/README.md` | Each component's API: properties, events, parts, hooks |
| [Storybook](https://sebakellner.github.io/brick-ui/) | Live examples of every variant and state, plus a docs page per component built from its README |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Token layering, conventions, checklist for a new component, releasing |

## License

[MIT](LICENSE)
