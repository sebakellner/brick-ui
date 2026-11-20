# Architecture

What the kit is made of, and how a value travels from a JSON file to a pixel. The
rules live in the conventions; the reasoning lives in the [ADRs](adr/).

## The contract in one screen

```
packages/styles/tokens/*.json ──build:tokens──> packages/styles/src/tokens/*.css
                                                        │
                                                        └──> packages/styles/src/theme.css
                                                                       │
                             components read it as var(--brikka-*) and carry no fallback
```

One direction, no exceptions. The token source is not edited at the other end of
the arrow, and the generated CSS is never edited by hand.

## Layers

| Layer     | Lives in                                                                              | Answers                                            | Example                            |
| --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| Primitive | `packages/styles/tokens/base/color.json` → `palette.*`                                | what colors exist                                  | `--brikka-palette-blue-600`        |
| Semantic  | `packages/styles/tokens/role/light.json` → `bg.*`, `text.*`, `border.*`, `focus-ring` | roles read directly by a component                 | `--brikka-text-danger`             |
| Control   | `packages/styles/tokens/component/control.json` → `<component>.*`                     | what one control paints, when no role can carry it | `--brikka-button-disabled-opacity` |

The semantic and control layers are **peers, not a stack**: control tokens alias
the palette, and every semantic role is read by a component directly. Nothing points
at a control token. See R2 in
[conventions-tokens.md](conventions-tokens.md).

## Invariants

| Invariant                                                                  | Enforced by                              | Decision                                                |
| -------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| The token CSS is generated from `tokens/*.json`, never hand-written        | `build:tokens` and the diff check in CI  | [0001](adr/0001-generate-token-css-from-json.md)        |
| The theme is required; components carry no fallback values                 | the computed-style tests                 | [0002](adr/0002-require-the-theme.md)                   |
| References survive as `var()`, so a subtree is re-themed without a rebuild | review, and the override tests           | [0003](adr/0003-keep-aliases-as-var.md)                 |
| Every design value in a component reads a token                            | review, and `check:tokens` for the names | [0004](adr/0004-forbid-style-literals-in-components.md) |
| Every semantic role is read by a component                                 | `check:tokens`                           | R1 in [conventions-tokens.md](conventions-tokens.md)    |

## Slotted text

A component cannot see the text of the nodes slotted into it: `textContent` does
not include assigned nodes, and `slotchange` fires when the _set_ of assigned
nodes changes — never when the text of an assigned node is edited. Every message
in this kit is an atom ([0009](adr/0009-nest-the-field-parts-inside-the-control.md),
[0010](adr/0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md))
rather than a `help-text` property, so something has to observe them:
`SlottedTextController` in
`packages/web-components/src/components/shared/form-control/slotted-text.controller.ts`. One
`MutationObserver` per host, re-targeted when the assignment changes, and two
entry points — a slot of the host's own shadow root, and a set of nodes a
container hands over for the atoms that live in its light DOM. Presence means
text, so an empty atom is not content. It is written here rather than taken from
`@lit-labs/observers`: the wiring is a few lines, and the kit does not add a
dependency for wiring it can own.

## Boundaries

What this system deliberately does not do. Recorded so a well-meant change does
not have to reopen the question.

| Not in scope                           | Why                                                                                                                                                                                  | Revisit when                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| A published package                    | consumed from this repository; there is no outside consumer                                                                                                                          | one appears                                                     |
| Visual regression testing              | the suite asserts computed styles, not pixels                                                                                                                                        | a layout bug escapes it                                         |
| A second browser in the suite          | [0005](adr/0005-test-in-chrome-only.md)                                                                                                                                              | a shadow-DOM or `::part` defect is reported from another engine |
| A different license                    | MIT, in `LICENSE`                                                                                                                                                                    | never, unless relicensing                                       |
| Typed token names inside component CSS | `TokenName` and `HookName` are generated in `packages/styles/src/tokens.generated.ts`, but the `css` template keeps plain names — see [conventions-code.md](conventions-code.md), C4 | the typing stops costing readability                            |

## Where things live

```
packages/styles/tokens/base/            primitives: palette, space, radius, typography, structure
packages/styles/tokens/role/light.json  semantic roles, one file per theme
packages/styles/tokens/component/       what one component paints, one file per component
packages/styles/src/tokens/             generated: the custom properties a page paints with
packages/styles/src/tokens.css          every generated layer, and no decision about the page
packages/styles/src/theme.css           tokens.css plus `color-scheme` — what a page loads
packages/web-components/src/components/shared/form-control/  the contract every field composes
packages/web-components/src/components/brikka-*/  element, stories, docs page, test/, README
packages/web-components/src/index.ts     the classes, registering nothing
packages/web-components/src/register.ts  the one module that registers them all
packages/test-utils/src/                 token resolver, contrast, pointer, form, a11y, theme
packages/web-components/test/integration/  suites that compose several widgets of the package
scripts/                                 the four checks
```

One folder per component, holding everything about it including its docs. A
component is never split across the tree.
