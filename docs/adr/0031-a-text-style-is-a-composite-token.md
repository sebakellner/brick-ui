# 0031. A text style is a composite token, and a composite is serialized, not rewritten

Date: 2026-11-20

## Status

accepted, in the change that adds the type scale and the six text styles. It extends
[0027](0027-ship-the-token-graph-as-a-design-system.md) and **interprets** the rule S1 left in
`packages/tokens/style-dictionary.config.mjs` — that no transform rewrites an authored value —
rather than reversing it. It supersedes no record.

## Context

The type layer is five tokens: `font-sans`, `font-size-sm`, `font-size-md`,
`font-weight-medium` and `line-height-md`. Every one of them is read by components — measured:
18, 14, 7, 17 and 14 references — so the scale can only grow outward, never rename or move a
value.

Those five are primitives. What a component actually needs is the combination: a heading is
`semibold` at `1.125rem` with `line-height.tight`; a label is `medium` at `0.8125rem`. Today that
combination is written inside each component, which means the decision "what a heading is" is
duplicated in every file that paints one, and no review can see it.

DTCG has six composite types, and the flow needs three of them eventually: `typography` now,
`transition` and `shadow` later. Each one needs a transform back in the pipeline, which looks
like a violation of the rule S1 established when it took `transformGroup: 'css'` apart: no
transform rewrites an authored value, and `color/css` rewriting
`rgb(37 99 235 / 0.18)` into `#2563eb` is the reason.

The distinction that decides it was checked against the tool, not assumed. A **serializer**
formats a structured value into the syntax a platform reads: `typography/css/shorthand` maps a
record with `fontFamily`, `fontSize`, `fontWeight` and `lineHeight` onto the `font` shorthand.
A **rewriter** changes what the value means: `color/css` changes a colour space and drops alpha,
`size/rem` rescales a length. The first preserves the authored decision; the second replaces it.

The same read of the tool fixed one limit in advance: the serializer's accepted properties are
`fontStyle`, `fontVariant`, `fontWeight`, `fontWidth`, `fontSize`, `lineHeight` and `fontFamily`,
and any other key produces an unknown-property warning
(`packages/tokens/node_modules` → `style-dictionary/lib/common/transforms.js`,
`typographyCssShorthand`). `letterSpacing` is not in that list and not in the CSS `font`
shorthand, so a composite cannot carry it.

## Decision

**The scale grows, and six text styles become composite tokens.**

| Group            | Values                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| `font-size`      | `xs .75rem`, `sm .8125rem`, `md .9375rem`, `lg 1.125rem`, `xl 1.375rem`, `2xl 1.75rem` |
| `font-weight`    | `regular 400`, `medium 500`, `semibold 600`, `bold 700`                                |
| `line-height`    | `tight 1.25`, `md 1.5`, `relaxed 1.75`                                                 |
| `letter-spacing` | `tight -0.01em`, `normal 0`                                                            |
| `font`           | `sans` (unchanged) and `mono`                                                          |

`heading-lg`, `heading-md`, `heading-sm`, `body-md`, `body-sm` and `label-md` are `$type:
typography` tokens carrying `fontFamily`, `fontSize`, `fontWeight` and `lineHeight` — and nothing
else, because the serializer would drop what it does not know.

Each one names the primitives it consumes, because the heading names do **not** mirror the size
names — a page title is the largest size the scale offers, not `lg`:

| Style        | Size  | Weight     | Line height |
| ------------ | ----- | ---------- | ----------- |
| `heading-lg` | `2xl` | `semibold` | `tight`     |
| `heading-md` | `xl`  | `semibold` | `tight`     |
| `heading-sm` | `lg`  | `semibold` | `tight`     |
| `body-md`    | `md`  | `regular`  | `md`        |
| `body-sm`    | `sm`  | `regular`  | `md`        |
| `label-md`   | `sm`  | `medium`   | `tight`     |

`bold` exists because `strong` and `b` already render it: it is the one weight the browser
applies without this repository deciding it, and a weight the kit paints but does not name
cannot be audited or changed. `light 300` and `black 900` are deliberately absent — the system
font stack does not guarantee them, and a synthesised light is thin text on a tinted surface.

They live in `tokens/base/typography.json` under a `typography` group, **not under `role`**: R1
governs what a page paints, and a text style is a named combination of primitives with no theme
of its own.

**The rule for every future composite is stated here once:** serializers return to `TRANSFORMS`,
rewriters stay out. `shape/css/shorthand`, `border/css/shorthand`, `transition/css/shorthand` and
`shadow/css/shorthand` are serializers under that test; `color/css` and `size/rem` are not.

Assignment is additive. No declaration that exists today changes value, so the gate is the
narrow one: the diff of `packages/tokens/src` is additions only.

### Alternatives considered

| Alternative                                                              | Why it was rejected                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives only, no composites                                           | The combination is the decision, and it would stay duplicated per component where no review sees it. A heading is not "some size"; it is the four values together.                                                                           |
| Put the text styles under `role`                                         | R1 would demand a description, a type and coverage in both themes for something that has no theme, and the role layer means "what a page paints" — a text style paints nothing.                                                              |
| Include `letterSpacing` in the composites                                | The serializer warns on unknown properties and drops them (checked in the source), so the composite would silently lose a property that someone wrote down. Better to keep it a separate primitive than to store a value that has no effect. |
| Emit composites as separate declarations instead of the `font` shorthand | It needs a custom format of our own to gain one property, and it gives up the property the shorthand has: setting a text style in one declaration.                                                                                           |

## Consequences

A component sets one declaration instead of four, and "what a heading is" becomes reviewable in
the graph. The scale finally has room above `0.9375rem`, which the kit had no way to express.

The costs are named. The `font` shorthand resets `font-style`, `font-variant` and `font-width`
along with what it sets, so a rule that assigns a composite and then a separate `font-size` gets
one of them silently; that is a consumption footgun the convention has to state, not a token
problem. `letter-spacing` sits outside every composite, so a heading's tracking is a second place
to look. And a composite is not themeable: a brand cannot restyle `heading-lg` without restyling
the primitives, which is deliberate — otherwise a text style becomes a role layer without the
role layer's discipline.

The mistake this most invites is adding a seventh property to a composite and expecting it to
survive; the serializer's warning list is the guard, and it warns rather than fails.
