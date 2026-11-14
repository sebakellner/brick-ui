# Brick

[![ci](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml)

A component library built with [Lit](https://lit.dev) and TypeScript: web
components shipped as plain custom elements, with a token-driven theming
contract.

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
<bk-checkbox label="Accept the terms"></bk-checkbox>

<script type="module" src="/src/index.ts"></script>
```

The theme is required: components carry no fallback values, so a page without
`theme.css` renders visibly unstyled.

Requirements: Node 22+, pnpm, and Chrome for the test runner.

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

| Document                                                               | Answers                                                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [docs/README.md](docs/README.md)                                       | the index: every document, its type, and when to update what                       |
| [docs/architecture.md](docs/architecture.md)                           | how a value travels from a JSON file to a pixel, and what is out of scope          |
| [docs/conventions-tokens.md](docs/conventions-tokens.md)               | the token rules, each with the thing that enforces it                              |
| [docs/conventions-accessibility.md](docs/conventions-accessibility.md) | the bar a component clears before it ships                                         |
| [docs/conventions-testing.md](docs/conventions-testing.md)             | how to write a test that proves something                                          |
| [docs/conventions-code.md](docs/conventions-code.md)                   | TypeScript, stylesheets and tooling                                                |
| [docs/add-a-component.md](docs/add-a-component.md)                     | the next element, without re-deciding anything                                     |
| [docs/add-a-token.md](docs/add-a-token.md)                             | a new design value, without breaking the build                                     |
| [docs/adr/](docs/adr/)                                                 | why the kit is arranged this way, and what was rejected                            |
| `src/components/*/README.md`                                           | each component's own API: properties, events, parts, override hooks, limitations   |
| [Storybook](https://sebakellner.github.io/brick-ui/)                   | live examples of every state, plus a docs page per component built from its README |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                     | setup, commands, CI gates, how to send a change                                    |
| [AGENTS.md](AGENTS.md)                                                 | the same map, written for coding agents                                            |

## License

[MIT](LICENSE)
