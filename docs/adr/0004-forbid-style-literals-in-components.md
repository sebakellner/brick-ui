# 0004. Forbid style literals in components

Date: 2026-11-12

## Status

accepted

## Context

Once the token layers existed, a component could read them or ignore them. The
rule said every color, length and duration comes from a token; nothing enforced
it, and the rule as written was not what the code did.

The focus ring is the example that motivated the rule. It shipped as a `2px`
width and a `2px` offset written inline, directly next to a color that came from
a token:

```css
outline: 2px solid var(--bk-focus-ring);
```

A host could re-theme the ring's color and not its weight. The two halves of one
visual decision lived in different systems, and only one of them was greppable
as a token.

Two costs follow from any literal. It is invisible to a token change — rebuild
the tokens and it keeps its old value, silently, exactly the drift described in
[0002](0002-require-the-theme.md). And it is invisible in review: a `2px` sitting
among forty token reads looks like intent, and a `1.5px` in the next component
looks like the same intent.

## Decision

Every design value in a component's styles is read from a token as `var(--bk-…)`,
with no fallback value. Literals live only in `tokens/*.json`, where they are the
declared default.

The line, stated precisely, because "no literals" on its own is not maintainable:

> A literal is allowed only when changing it would not be a theming decision —
> a reset, a relative size, or the geometry a technique requires. Every value a
> host might reasonably want to change reads a token.

A value that needs to vary gets a `part` or a public hook, never an inline value.

The rule was bent by three declarations when this was recorded. Each was closed
with a token rather than an exception, in the same change:

| Declaration | Where | Why it was a literal | Token added |
| --- | --- | --- | --- |
| `font-weight: 500` | `bk-button.ts`, `bk-input.ts` | `tokens/typography.json` had no `font-weight` group, and the typography platform filtered only `font`, `font-size` and `line-height` | `--bk-font-weight-medium`, read by both components |
| `opacity: 0.55` | `bk-button.ts` | no `opacity` group existed | `--bk-button-disabled-opacity`, a button control token, because only the button paints it |

The literals that do comply are resets and techniques: the `0` in `padding: 0
var(--bk-space-4)`, `width: 100%`, and the `1px` box in the visually-hidden
`.message:empty` collapse that the accessibility bar requires. Tokenizing the
last one would expose a public name that a host could override and break the
pattern the rule protects.

The earlier documentation claimed `px` appeared only in story scaffolding. That
was never true; it is corrected here.

### Alternatives considered

| Alternative | Why it was rejected |
| --- | --- |
| Leave it to review without writing the rule | That was the status quo, and it failed: the inline `2px` outline survived next to a tokenized color for the whole life of the focus ring. A review rule with no vocabulary for "is this value design or technique?" is not a rule. |
| Add a check that scans component styles for literals | Feasible, and it would have to allowlist `0`, `100%`, the `1px` clip and the three un-tokenized values — an allowlist that grows until it names files, at which point it enforces nothing. The three exceptions belong in a token group, not in a guard. |
| Tokenize every literal, including the visually-hidden box | Adds a public name (`--bk-visually-hidden-size`) for a private technique. A host that themed it would silently break the accessibility pattern. |

## Consequences

Easier:

- Re-theming reaches everything that paints. No exception list to maintain, no
  value that quietly stays behind.
- A component's styles read as a list of roles, so a diff of that block is a diff
  of intent rather than of numbers.
- The geometry of a state is themable with its color, which is what the focus
  ring could not do before.

Harder:

- Some values have no token and the rule offers no escape: the answer is a token
  group or a broken rule. Finding three such values in two components suggests
  the next component will find its own.
- Enforcement is review-only. `pnpm check:tokens` validates the `--bk-*` names a
  component reads; it does not look at literals, so a new `2px` fails nothing.
- The rule needs a distinction the repo did not have before: *design value*
  versus *technique geometry*. Without it, every `1px` becomes an argument.

No debt recorded: the three design values read tokens, and three tests assert
that the components follow them. Revisit when a new literal appears that is
neither a reset nor a technique geometry — at that point the rule either gains a
token group or gets dropped, because a rule bent twice is not a rule.
