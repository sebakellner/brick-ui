# 0022. Elevation exists as tokens before a component paints it

Date: 2026-11-20

## Status

accepted, in the change that adds the elevation tokens. It supersedes **in part**
[R8](../conventions-tokens.md) — the rule that no shadow token exists until something paints a
shadow — and depends on
[0021](0021-a-text-style-is-a-composite-token.md), whose serializer rule is what makes the
reversal possible. It supersedes no ADR.

## Context

R8 forbade a shadow token for two reasons, and only one of them still holds.

The premise that expired: "a shadow is a composite value which this token pipeline cannot
express as references to the layer below". That was true when no transform could touch a value.
ADR 0021 established the opposite distinction — a serializer formats a structured value into
platform syntax and is allowed, a rewriter changes the value and is not — so `shadow/css/shorthand`
can compose offset, blur, spread and colour exactly as `typography/css/shorthand` composes a
font. The pipeline expresses shadows now; R8 was written before that sentence could be true.

The premise that holds: `check:tokens` cannot verify a shadow. The checker derives a role's
expected CSS property from the first segment of its name (`bg` → background, `text` → color,
`border` → border-*), so an `elevation` family falls through unchecked. A shadow is a value
nothing verifies, and that is worth writing down rather than fixing by adding a family to the
checker's table — the thing to verify about a shadow is not the property it is read under.

What changed is who the graph is for. [0017](0017-ship-the-token-graph-as-a-design-system.md)
made it a design system a host paints with, and a host that paints a card has nowhere to look
for depth. This is the same argument the status vocabulary used in
[0019](0019-give-the-graph-a-status-vocabulary.md): the tokens are shipped for the export, not
only for this repository's components.

## Decision

Three tokens: `elevation.color`, and two shadow composites, `elevation.resting` and
`elevation.floating`, both referencing the colour so a host retints every shadow with one value.

The colour carries alpha and is authored as `rgb(28 25 23 / 0.12)` — a literal, not a palette
step, because `color/css` is banned and a palette step has no alpha to give. A shadow that
opened a second hop through a palette entry would also break R2.

Two levels, not five, and named for height rather than for the thing that casts them. The pair is
Primer's `resting` / `floating`: both words describe how high a surface sits, and they leave
`overlay` free for the scrim, which is what that word names in most systems and what this graph
will need next. Numeric levels (`elevation.1`, `elevation.2`, as Material, Polaris and Radix
number theirs) scale without a rename but say nothing about height; with two levels, words earn
their place. `raised` was the first choice and it reads as a property of a control rather than
of a surface.
A component kit needs "on the page" and "above the page"; a third level
is a decision to make with the component that would paint it.

R8 is rewritten rather than deleted: elevation is allowed, and the part that says a shadow is
the one unchecked value in the graph stands, now with ADR 0021's serializer rule to explain why
the pipeline can carry it anyway.

### Alternatives considered

| Alternative                                                                       | Why it was rejected                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep R8 until a component paints depth                                            | The graph is exported; a host painting its own card is the consumer, and it cannot ask this repository for a token it does not ship. 0019 decided the same question the same way.                                       |
| Tokenise elevation as a level plus a colour, as Material does                     | It needs a component to turn "level 2" into a shadow, which is the one thing the token is supposed to save it from.                                                                                                     |
| Define the shadow colour as a role (`border-*`, `bg-*`) to satisfy `check:tokens` | A role's name states the property it is painted under, and a shadow colour is under `box-shadow`: naming it `bg-overlay` would make R5's own rejection correct, and naming it anything else leaves it unchecked anyway. |
| Five levels                                                                       | Two are what the layer can justify. Names are irreversible, and three unused levels are the ten-roles mistake in a new costume.                                                                                         |

## Consequences

A host can paint depth, and `elevation.color` retints both levels at once. The unchecked value is
now a named debt instead of a rule.

One limit was found by the test rather than reasoned about: a custom property whose value
contains a `var()` is substituted on the element that declares it, so `elevation.color`
retints both levels **at the theme** and not on a subtree. Overriding the colour on a card does
nothing to a composite inherited from `:root`. That is the right shape for this knob — a shadow
tint is a theme decision, not a per-component one — but it is a surprise worth writing down,
because the obvious attempt (override it on the element that paints the shadow) fails silently.

The cost is that a shadow is the first token in the graph that nothing verifies: a wrong spread
ships silently, and the suite cannot see it without a component that paints it. The second cost
is that two levels may not survive contact with a real dialog — a `sunken` or a `dragged` level
is likely, and adding one later is additive, which is why the scale starts where it can grow.

The mistake this invites is painting `elevation.floating` on anything that moves, because it looks
stronger than `resting`. Depth that is used for emphasis stops communicating height.
