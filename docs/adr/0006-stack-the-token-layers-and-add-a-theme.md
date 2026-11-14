# 0006. Stack the token layers and give the kit two themes

Date: 2026-11-12

## Status

accepted

## Context

The five decisions already recorded built a kit with one theme. [0001](0001-generate-token-css-from-json.md)
generates the token CSS from JSON, [0002](0002-require-the-theme.md) made the
theme mandatory, [0003](0003-keep-aliases-as-var.md) kept aliases as `var()`, and
[0004](0004-forbid-style-literals-in-components.md) forbade literals in
components. The result works, and 0003 recorded its own limit: with the semantic
and control layers as peers, there is no single place to re-theme, and a second
theme is not supportable.

A second theme is now a requirement, and it is what breaks the arrangement. Four
things stop working, and all four were verified in the code:

- **Sixteen control tokens alias the palette.** `--bk-button-primary-bg` points at
  `--bk-palette-blue-600`, so each one needs a definition per theme. Sixteen
  tokens times two themes is thirty-two declarations, and every new component
  multiplies the count.
- **One role serves two jobs.** `--bk-color-danger` is both `border-color` in the
  error state and `color` in the error message. A dark theme generally needs
  different steps for a red border and red text.
- **Disabled is a global opacity.** `--bk-button-disabled-opacity: 0.55` reads the
  same over a light and a dark surface, where it does not produce the same result.
- **The palette cannot express a dark theme at all.** It has red only at 700, sky
  only at 600, blue only from 600, and neutral only up to 900: no step light enough
  for dark-mode danger text, no focus ring that clears 3:1 on a dark surface.

## Decision

**Three tiers**, generated from `tokens/`:

- `base/` — primitives. Theme-invariant, no tier word in the name.
- `role/` — the semantic layer, one file per theme, identical names.
- `component/` — the component tier, one member today. A token earns a place here
  only when no role can express the value.

**The theme is the role file.** `role/light.json` and `role/dark.json` declare the
same thirteen names against different palette steps. Components do not know which
theme is active.

**Thirteen roles**, named `<family>-<role>` with four families — `bg`, `text`,
`border`, `focus`:

| Role               | Light         | Dark          |
| ------------------ | ------------- | ------------- |
| `bg-surface`       | `white`       | `neutral-900` |
| `bg-surface-muted` | `neutral-100` | `neutral-800` |
| `bg-surface-hover` | `neutral-200` | `neutral-700` |
| `bg-accent`        | `blue-600`    | `blue-600`    |
| `bg-accent-hover`  | `blue-700`    | `blue-700`    |
| `text-default`     | `neutral-900` | `neutral-100` |
| `text-muted`       | `neutral-600` | `neutral-400` |
| `text-on-accent`   | `white`       | `white`       |
| `text-danger`      | `red-700`     | `red-400`     |
| `border-default`   | `neutral-500` | `neutral-500` |
| `border-strong`    | `neutral-600` | `neutral-400` |
| `border-danger`    | `red-700`     | `red-400`     |
| `focus-ring`       | `sky-600`     | `sky-400`     |

The dark column is not a guess: it is the column the contrast assertions rewrote.
Four values were proposed here first and failed when the suite ran in both themes —
`bg-accent` at `blue-500` put white text at 3.7:1 instead of 4.5:1, and
`border-default` at `neutral-700` put the input border at 1.7:1 instead of 3:1
against its own surface. A light accent on a dark page is the tempting move and the
wrong one: it buys atmosphere with legibility, and the assertion is what says so.

**Naming grammar.** Primitives carry no tier word and the three vocabularies are
disjoint by vocabulary rather than by prefix: primitives are hues and ramps
(`blue-600`, `space-3`, `font-size-md`), roles are concepts (`bg-accent`,
`text-muted`), component tokens are component-prefixed (`button.disabled-opacity`).
The property-family prefix on roles is what makes them checkable: `--bk-bg-*` in a
`background`, `--bk-text-*` in a `color`, `--bk-border-*` in a `border-*` color.

No external convention governs this. The design token format defines the file and
the rules for a valid token name — a JSON string, character restrictions — and
prescribes no way to choose one. The names are ours to choose, which is why they
are a contract and not a preference.

**The palette grows to seven families of nine steps** — `blue`, `green`, `yellow`,
`orange`, `red`, `sky`, `neutral`, 100 through 900 — plus `white`. A ramp is a
reference scale, not a usage list: steps without a consumer stay.

**A component reads a role for anything that changes with the theme, and a
primitive for anything that does not.** Colors have a role layer, so a component
reads `--bk-bg-*`, `--bk-text-*` or `--bk-border-*`, and reading a color
primitive — any `--bk-{hue}-{step}` — is a check failure rather than a review
rule. Spacing, radius, type and the structural values have no role layer, because
they do not change between themes: `--bk-space-3` is `--bk-space-3` in both, and a
component reads it directly.

**Theming by subtree.** `data-theme` on any element re-resolves the roles for
everything inside it, through `:where([data-theme='dark'])` so the selector
carries zero specificity and a consumer's own class always wins. `prefers-color-scheme`
is honoured for the document root and loses to an explicit `data-theme` through
`:not([data-theme])`. Each theme re-declares all thirteen roles rather than a
delta, which is what makes nesting work.

**No `inverse` role family.**

The sixteen control tokens of `button.*` and `input.*` are removed. Their names
are roles in disguise: four of them are `text-default`, two are `border-default`,
two are `bg-surface-hover`. `button.disabled-opacity` stays, because opacity is
not a color and no role can carry it.

### Alternatives considered

| Alternative                                                                                                     | Why it was rejected                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two tiers — palette directly to components, no role layer                                                       | No place to express "the same meaning, a different value per theme". Every control token would need a definition per theme, which is the problem being solved.                                                                                                                   |
| Keep the layers as peers and add a second palette per theme                                                     | Inverting a palette does not produce a dark theme: the accent does not invert, danger stays red, and inverted neutrals read as washed-out grey. The role layer is exactly the place where "invert this, keep that" is decided.                                                   |
| Numbered role names, as Carbon does (`ui01`, `text02`)                                                          | Carbon has 91 components and its numbering keeps the namespace finite. With two components, a descriptive name documents itself in the CSS and needs no lookup table.                                                                                                            |
| Keep `palette` as a prefix on primitives                                                                        | `palette` is a kind of color, not a tier — Material places it _inside_ the tier (`md.ref.palette`). Promoted to a tier it only exists for one of the five primitive families, and the asymmetry is what makes it read wrong.                                                     |
| An `inverse` role family, as Carbon has                                                                         | Needed when a component must render inverted regardless of context. Subtree theming already gives the component the right context through inheritance, including across the shadow boundary. If the case appears, it is a component variant, not a second set of thirteen roles. |
| Declare `info`, `success` and `warning` roles now                                                               | No component reads them. R1 would fail the build, and the ten roles removed in `d9dfacd` are the precedent. The ramps exist now; the roles arrive with the first alert, badge or toast that reads them.                                                                          |
| A curated spacing ramp in the role layer, aliasing the primitive steps — as Primer does with `xxs` through `xl` | A role over four steps that never differ between themes is a rename with a maintenance cost and no behavior. Carbon keeps a numeric ramp read directly; neither has per-component spacing roles. Revisit when a density mode makes one name need two values.                     |

## Consequences

Easier:

- A theme is one file with thirteen declarations. Adding a third theme is a third
  file and nothing else.
- Control tokens, if they ever come back, are theme-invariant: they alias a role
  and the role carries the theme.
- `--bk-bg-*` used in a `color`, or a primitive read from a component, are
  detectable by a check instead of by a reviewer noticing.
- The role table is the design document. Reading `role/light.json` next to
  `role/dark.json` is the whole theming spec.

Harder:

- Thirteen roles must be complete before either theme looks right. A missing role
  is now visible in two themes instead of one, which is better for finding it and
  worse for shipping the first theme.
- The second theme rots unless the suite runs twice. `contrastWithWhite` cannot
  answer "does this border clear 3:1" in the dark theme; the helper needs the
  actual background.
- Renaming token surfaces is a breaking change: sixteen public names disappear and
  five are renamed. Cheap while the package is private and unpublished, expensive
  after the first outside consumer.
- A role exists per theme but the _values_ are unvalidated. The dark column above
  is a proposal until the contrast assertions pass in both themes.

**No aliases.** The sixteen removed names and the four renames have no
compatibility layer. The mapping is recoverable from the commit that removed them
and from the deleted `tokens/component/control.json`; it is not reproduced here,
because a decision record states what was decided and a name-by-name table is
release-note material. Revisit when the package is published and a consumer needs
a deprecation window.

`--bk-color-danger` is the one removal that is a semantic split rather than a pure
rename: it served both a border and a piece of text, and those are now two roles
even though both resolve to `red-700` today.

Accepted debt: the component tier has one member and no rule yet for when a second
one is justified. Revisit when a component needs a value that is neither a color
role nor a primitive — the next `disabled-*` or a separator.

This decision supersedes the layer description in
[0003](0003-keep-aliases-as-var.md) — that aliases stay `var()` is unchanged; that
the semantic and control layers are peers is not. 0003 is annotated rather than
rewritten.
