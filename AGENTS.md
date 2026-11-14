# AGENTS.md

Instructions for AI coding agents working in this repository. Applies to the
whole repo; there are no nested AGENTS.md files.

## What this repo is

Brick — a component library built with Lit and TypeScript: web components shipped
as plain custom elements, with a token-driven theming contract. Nothing is
published; the package is private and consumed from this repository.

```
tokens/base/           primitives, theme-invariant
tokens/role/light.json semantic roles, one file per theme
tokens/component/      what one component paints
src/components/bk-*/   element, stories, docs page, test, README
src/styles/tokens/     generated CSS — never edit by hand
src/styles/theme.css   the theming entry point, imports the generated files
src/test/helpers/      loadTheme and the contrast assertions
scripts/               check-token-usage.mjs
docs/                  conventions and decision records
```

## Read before you change code

[docs/README.md](docs/README.md) is the index: every document, its type, and the
"when to update what" table. Start there. The two you will need most:

- [docs/conventions-tokens.md](docs/conventions-tokens.md) — the token rules,
  each with the thing that enforces it.
- [CONTRIBUTING.md](CONTRIBUTING.md) — component conventions, the accessibility
  bar, the testing recipe and the CI gates.

An ADR in [docs/adr/](docs/adr/) holds the reasoning. Read the one whose subject
you are about to change, and never edit an accepted ADR — supersede it.

## Never

- Edit `src/styles/tokens/*.css` or `src/styles/tokens.generated.ts`. They are
  output of `pnpm build:tokens`, and CI fails when they are stale or untracked.
- Write a style literal in a component. Colors, lengths, weights and durations
  read `var(--bk-…)`. A literal is allowed only when it is a reset (`0`,
  `100%`) or the geometry a technique requires — [ADR 0004](docs/adr/0004-forbid-style-literals-in-components.md).
- Give a token read a fallback value. The only legal fallback is the default
  half of the hook pattern, `var(--bk-button-bg, var(--bk-button-variant-bg))`,
  and its default must be a variable, never a literal —
  [ADR 0002](docs/adr/0002-require-the-theme.md).
- Write a CSS comment. Token files and component styles stay declarative.
- Point a token reference at a control token, or make a chain longer than one
  hop. `control → palette`, `semantic → palette`, `radius → space` —
  [docs/conventions-tokens.md](docs/conventions-tokens.md), R2.
- Add a semantic role that no component reads directly. `pnpm check:tokens`
  fails on it — R1.
- Import `'./x'` from a `.ts` file. The imports carry `.js`
  (`verbatimModuleSyntax`).
- Use `disabled` on an inner widget. A button or a checkbox is blocked with
  `aria-disabled` and cancels its own activation, so it stays focusable and
  discoverable; a text field keeps the native `disabled` attribute —
  [ADR 0008](docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md).

## Commands

| Command | Use |
| --- | --- |
| `pnpm test` | the suite, in real Chrome |
| `pnpm test:watch` | the suite, watching |
| `pnpm typecheck` | `tsc --noEmit`, with `strict`, `noUnusedLocals`, `noUnusedParameters` |
| `pnpm build:tokens` | regenerate the CSS and `tokens.generated.ts`; commit the result |
| `pnpm check:tokens` | every `--bk-*` name a component reads exists, and every semantic role is read |
| `pnpm dev` | the playground |
| `pnpm storybook` | component stories |

## Change workflow

1. Write the test first and watch it fail. A change with no failing test has no
   proof it does anything.
2. Assert **computed styles**, not markup. Markup assertions pass through
   specificity bugs; `getComputedStyle` does not.
3. Hover and focus must go through real input — `sendMouse` from
   `@web/test-runner-commands`. A class swap cannot reproduce a specificity loss.
4. Wait past the `--bk-transition` duration (120ms) before asserting a
   transitioned property, or you sample an interpolated color.
5. Prove every fix by mutation: break the code, watch the test go red, restore
   it. If it stays green the test is decorative.
6. Run `pnpm test`, `pnpm typecheck` and `pnpm check:tokens` before committing.
   If you touched `tokens/`, run `pnpm build:tokens` and commit the output.

## Definition of done

- [ ] The new test fails without the change and passes with it.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm check:tokens` all green.
- [ ] Token output regenerated and committed, if `tokens/` changed.
- [ ] The component's `README.md` updated if its public surface changed:
      attributes, properties, events, `part`s or override hooks.
- [ ] Docs updated per the "when to update what" table in
      [docs/README.md](docs/README.md).
- [ ] Commits are Conventional Commits, in English, like the rest of the history.

No history, no rationale, no opinions in this file. If a line starts with
"because", it belongs in an ADR.
