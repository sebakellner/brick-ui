# Architecture

What the kit is made of, and how a value travels from a JSON file to a pixel. The
rules live in the conventions; the reasoning lives in the [ADRs](adr/).

## The contract in one screen

```
tokens/*.json  ──build:tokens──>  src/styles/tokens/*.css  ──>  src/styles/theme.css
                                                                       │
                             components read it as var(--bk-*) and carry no fallback
```

One direction, no exceptions. The token source is not edited at the other end of
the arrow, and the generated CSS is never edited by hand.

## Layers

| Layer | Lives in | Answers | Example |
| --- | --- | --- | --- |
| Primitive | `tokens/base/color.json` → `palette.*` | what colors exist | `--bk-palette-blue-600` |
| Semantic | `tokens/role/light.json` → `color.*`, `focus-ring` | roles read directly by a component | `--bk-color-danger` |
| Control | `tokens/component/control.json` → `<component>.*` | what one control paints | `--bk-button-secondary-bg` |

The semantic and control layers are **peers, not a stack**: control tokens alias
the palette, and the five semantic roles are read by components directly. Nothing
points at a control token. See R2 in
[conventions-tokens.md](conventions-tokens.md).

## Invariants

| Invariant | Enforced by | Decision |
| --- | --- | --- |
| The token CSS is generated from `tokens/*.json`, never hand-written | `build:tokens` and the diff check in CI | [0001](adr/0001-generate-token-css-from-json.md) |
| The theme is required; components carry no fallback values | the computed-style tests | [0002](adr/0002-require-the-theme.md) |
| References survive as `var()`, so a subtree is re-themed without a rebuild | review, and the override tests | [0003](adr/0003-keep-aliases-as-var.md) |
| Every design value in a component reads a token | review, and `check:tokens` for the names | [0004](adr/0004-forbid-style-literals-in-components.md) |
| Every semantic role is read by a component | `check:tokens` | R1 in [conventions-tokens.md](conventions-tokens.md) |

## Boundaries

What this system deliberately does not do. Recorded so a well-meant change does
not have to reopen the question.

| Not in scope | Why | Revisit when |
| --- | --- | --- |
| A published package | consumed from this repository; there is no outside consumer | one appears |
| Visual regression testing | the suite asserts computed styles, not pixels | a layout bug escapes it |
| A second browser in the suite | [0005](adr/0005-test-in-chrome-only.md) | a shadow-DOM or `::part` defect is reported from another engine |
| A different license | MIT, in `LICENSE` | never, unless relicensing |
| Typed token names inside component CSS | `TokenName` and `HookName` are generated in `src/styles/tokens.generated.ts`, but the `css` template keeps plain names — see [conventions-code.md](conventions-code.md), C4 | the typing stops costing readability |

## Where things live

```
tokens/base/           primitives: palette, space, radius, typography, structure
tokens/role/light.json semantic roles, one file per theme
tokens/component/      what one component paints, one file per component
src/components/bk-*/   element, stories, Storybook docs page, test, README
src/styles/theme.css   imports the generated token files; the consumer entry point
src/index.ts           public entry point
src/test/helpers/      loadTheme, contrast assertions
scripts/               check-token-usage.mjs
```

One folder per component, holding everything about it including its docs. A
component is never split across the tree.
