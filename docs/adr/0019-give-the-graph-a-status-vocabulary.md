# 0019. Give the graph a status vocabulary, and measure the pair each role forms

Date: 2026-11-20

## Status

accepted, in the change that adds the nine roles. It extends
[0012](0012-the-token-graph-is-the-public-contract.md) and
[0017](0017-ship-the-token-graph-as-a-design-system.md), and it moves the anchor count fixed by
[0018](0018-let-a-preset-define-primitives-not-roles.md) from sixteen to thirty-one.

## Context

The palette carries seven families. The nineteen roles reference four of them —
`neutral`, `blue`, `red`, `sky` — plus `white`. `green`, `yellow` and `orange` are authored in
full, nine steps each, and **twenty-seven steps have no reference at all**. They were put there
for the status vocabulary that was never added: a design system with no way to say "this
worked", "check this" or "for your information" is not only incomplete, it is the reason those
primitives exist.

The gap is semantic, not chromatic. Everything needed to paint a status surface is already in
the graph; what is missing is nine names, a `$type`, a `$description`, and a value in each
theme. R1 of [docs/conventions-tokens.md](../conventions-tokens.md) makes all three mandatory
for a role.

The trap is the value mapping. "Warning is yellow" is the easy half; picking steps that a
reader can actually read is the other half, and it is not the mapping most systems copy. Two
measured results decided this record:

- **The obvious dark pairing fails.** `blue-400` on `blue-900` is **4.07:1** and `sky-400` on
  `sky-900` is **4.42:1** — both under the 4.5 body-text threshold. The `-300` step passes:
  `blue-300` on `blue-900` is 5.74, `sky-300` on `sky-900` is 5.67.
- **A pale yellow border is not a boundary.** `yellow-500` on `white` is **1.92:1** and on
  `yellow-100` **1.76:1**. A warning surface cannot rely on a 500-step border to be seen.

All ratios below are computed from the palette's own hex values with the WCAG relative
luminance formula, against the two surfaces a status actually sits on: its own tint, and the
page surface (`neutral-100` in light, `neutral-900` in dark).

## Decision

Nine roles, three per status, each `$type: color` with a `$description` and a value in both
themes: `success`, `warning` and `info`, each with `bg`, `text` and `border`.

| Family  | Theme | `bg`         | `text`       | `border`     | text on its tint | text on the page surface |
| ------- | ----- | ------------ | ------------ | ------------ | ---------------- | ------------------------ |
| success | light | `green-100`  | `green-800`  | `green-600`  | 6.49             | 6.54                     |
| success | dark  | `green-900`  | `green-400`  | `green-700`  | 5.23             | 10.04                    |
| warning | light | `yellow-100` | `yellow-800` | `yellow-700` | 6.38             | 6.28                     |
| warning | dark  | `yellow-900` | `yellow-300` | `yellow-700` | 6.58             | 13.27                    |
| info    | light | `blue-100`   | `blue-800`   | `blue-600`   | 7.15             | 6.14                     |
| info    | dark  | `blue-900`   | `blue-300`   | `blue-700`   | 5.74             | 9.70                     |

Three consequences are part of the decision rather than left to the implementer:

- **`info` is the `blue` family, not `sky`.** `sky` is the focus family — `focus-ring` is
  `sky-600` — and a status surface that shares its hue with the focus ring makes "this is
  focused" and "this is informational" the same signal. Sharing the accent hue instead is the
  smaller loss: an info surface and a primary action are both "noteworthy".
- **`border` is decoration, not a boundary.** `green-600` reaches 3.30:1 on white,
  `yellow-700` 4.58:1 on its tint, `blue-600` 5.17:1 — but `blue-700` on `neutral-900` is
  **2.61:1**. A status border does not carry the state, the text and the tint do; it is chosen
  for coherence with the family, and it is not held to the 3:1 component-boundary rule.
- **The anchors grow from sixteen to thirty-one.** The status families add fifteen new steps:
  `green-100/400/600/700/800/900`, `yellow-100/300/700/800/900` and `blue-100/300/800/900` — and
  `blue-600` and `blue-700`, which `info.border` consumes and the roles already referenced, so they
  are not new but they are still required. Measured on the committed tree, the role layer
  references thirty-one palette steps in total, and a preset supplies all of them. That is the
  preset contract of [0018](0018-let-a-preset-define-primitives-not-roles.md)
  growing, and it is recorded there rather than discovered by the first preset author.

The roles are additive. No declaration that exists today changes value, so the gate for this
change is the narrow one: the diff of `packages/tokens/src` is additions only. The byte-identity
gate stays reserved for changes that move an existing scale.

The ratios above are measured now and hand-verified. They become a check when the preset
validation of 0018 lands, because that is the gate a host's preset runs; a check nobody can run
against their own graph would not have prevented the dark pairing this record rejects.

### Alternatives considered

| Alternative                                                  | Why it was rejected                                                                                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One role per family (`status.warning` as a single colour)    | A status is always a pair: a surface and the text that must be read on it. One colour forces every consumer to invent the second half, and the pairing is exactly what is measurable and what this record measures. |
| Reuse `danger`'s mapping for the other families              | `danger` was tuned as text and border on a neutral surface, not as a tint with contrasting text. Copying it produces the `-500` border that measures 1.92:1.                                                        |
| Derive status colours from the brand accent                  | Status carries meaning, not identity: a system whose errors are violet still has to say "error" unambiguously. 0018 keeps the status families in the host's hands for the same reason.                              |
| Ship the roles without `$description` and fill them in later | R1 makes the description the condition for shipping a role at all, and the twenty-seven dead steps are the cost of the version of this that skipped the vocabulary.                                                 |
| Wait for the first component that paints a status            | The graph is exported as a design system (0017); a host painting its own banner has nowhere to look. The primitives for these families have been waiting since before the export existed.                           |

## Consequences

The graph gains a complete status vocabulary and loses twenty-seven dead palette steps to about
twelve live ones. A host, and any future `bk-banner` or `bk-badge`, has pairs that were measured
instead of assumed, and the measurement — not the family name — is what the review can check.

The debts are three. Yellow is the fragile family: its light text passes at 6.28 on a page
surface, but the 700 step it borders with passes at 4.58, and nothing here leaves room for a
lighter warning tint. The dark tints use the 900 steps, which are heavy as large background
areas — a full-page dark warning banner is legible and unpleasant, and that is a design
decision to make with a component, not a token. And the vocabulary is irreversible in practice:
these nine names are published surface from the moment they ship, so a renamed status is a
breaking change with a changeset.

The mistake this arrangement most invites is painting a status _text_ on a surface this record
did not measure — `success.text` on `bg.surface-muted`, say — and assuming the tint ratios
carry over. The second is treating a status border as the thing that makes the state visible on
a pale surface, which is how the 1.92:1 border gets shipped.
