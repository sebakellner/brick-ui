# Contributing

How to get the repository running and how to send a change. Everything about the
internals lives in [`docs/`](docs/README.md); the [README](README.md) covers usage.

## Where everything lives

| You want                                 | Go to                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| how a value travels from JSON to a pixel | [docs/architecture.md](docs/architecture.md)                           |
| the rules the token layers obey          | [docs/conventions-tokens.md](docs/conventions-tokens.md)               |
| the accessibility bar                    | [docs/conventions-accessibility.md](docs/conventions-accessibility.md) |
| how to test, and what makes a test real  | [docs/conventions-testing.md](docs/conventions-testing.md)             |
| TypeScript and tooling gotchas           | [docs/conventions-code.md](docs/conventions-code.md)                   |
| add a token                              | [docs/add-a-token.md](docs/add-a-token.md)                             |
| add a component                          | [docs/add-a-component.md](docs/add-a-component.md)                     |
| why the kit is arranged this way         | [docs/adr/](docs/adr/)                                                 |
| instructions for coding agents           | [AGENTS.md](AGENTS.md)                                                 |

## How a field is built

A field is up to four layers, and only the last one is specific to it:

| Layer     | Where                                                             | What it owns                                                                                                |
| --------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| behaviour | `src/components/shared/form-control/form-control.mixin.ts`        | form association, the value in `FormData`, validity, reset, restore, and the disabling a `fieldset` imposes |
| styles    | `src/components/shared/form-control/form-control.styles.ts`       | label, control wrapper, message and the collapsed error region, in logical properties                       |
| messages  | `src/components/shared/form-control/field-messages.controller.ts` | the description and error regions, their ids, and the `aria-describedby` a field announces                  |
| the field | `src/components/bk-*/bk-*.ts`                                     | the native control, its attributes, its render                                                              |

A second field composes the first two — `class BkTextarea extends FormControlMixin(LitElement)` with `static styles = [formControlStyles, css\`…\`]`— and overrides`formControlElement` to return the native control inside its shadow root. Nothing about form participation is copied:

Component modules carry **no side effects**. Registration lives in a `define.ts` beside the component, guarded so a second copy of the package cannot throw, and the package entry point exports without registering. `src/playground.ts` is the only module that registers for the dev server.

## Setup

Node 22+, pnpm, and Chrome for the test runner.

```bash
pnpm install
```

## Commands

| Command                | Use                                                                  |
| ---------------------- | -------------------------------------------------------------------- |
| `pnpm dev`             | the playground                                                       |
| `pnpm storybook`       | component stories and the docs pages                                 |
| `pnpm test`            | the suite, in real Chrome                                            |
| `pnpm test:watch`      | the suite, watching                                                  |
| `pnpm typecheck`       | `tsc --noEmit`                                                       |
| `pnpm build:tokens`    | regenerate the CSS and `tokens.generated.ts`; commit the result      |
| `pnpm check:tokens`    | every name a component reads exists, and every semantic role is read |
| `pnpm format`          | rewrite the files Prettier owns                                      |
| `pnpm format:check`    | fail if any of them is not formatted                                 |
| `pnpm build`           | the bundle                                                           |
| `pnpm build-storybook` | the static site                                                      |

Storybook starts in the light theme whatever the operating system says, and the
**Theme** toolbar switches it to `dark` or `system`. The preview canvas paints
itself with the same roles the components read, so a theme switch moves the page
and the controls together. A story captured without a `data-theme` follows
`prefers-color-scheme` instead — that is the `system` option, and it is the only
state in which the operating system decides what you see.

The initial theme is written twice on purpose: `initialGlobals` in
`.storybook/preview.ts` governs every render, and the script in
`.storybook/preview-head.html` lands before the first paint. Change one, change
the other.

## Sending a change

- Branch from `main`. It is protected: a PR is required, and both CI jobs are
  required, admins included.
- Conventional Commits, in English, like the history.
- Keep the tests and the docs in the same commit as the behaviour they describe.
  A commit that changes behavior without its test is not reviewable.
- Name any limitation you are shipping with in the PR description. One written
  down is a limitation someone can fix; one kept quiet is a bug report six months
  late.
- Before pushing: `pnpm test`, `pnpm typecheck`, `pnpm check:tokens`,
  `pnpm format:check`. If you touched `tokens/`, also run `pnpm build:tokens`
  and commit the output.

## CI gates

`ci.yml` runs on every PR and on `main`:

| Job               | Checks                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test`            | Prettier's `format:check`, tokens match the JSON (`git status --porcelain`, so untracked output counts), `check:tokens`, `typecheck`, the suite in real Chrome |
| `storybook build` | regenerates the tokens and builds the site                                                                                                                     |

`storybook-pages.yml` publishes from `main` only, gated by the suite.

## Scope

What the kit deliberately does not do — no published package, no visual
regression, one browser — is recorded with its revisit condition in
[docs/architecture.md](docs/architecture.md#boundaries). A change that would cross
one of those lines is a decision, not an implementation detail: it needs an ADR.
