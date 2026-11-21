# 0018. Let a preset define primitives, and derive every role from them

Date: 2026-11-20

## Status

proposed. It becomes accepted with the change that lands the preset pipeline: the merge, the
parametric tokens and the validation a host can run. It extends
[0012](0012-the-token-graph-is-the-public-contract.md) and
[0017](0017-ship-the-token-graph-as-a-design-system.md) and supersedes no record. It depends
on R1 and R2 of [docs/conventions-tokens.md](../conventions-tokens.md) and reverses neither:

## Context

A host that loads `packages/tokens/src/theme.css` can paint its own markup, and 0017 makes
that the point of the graph. The next thing a host asks for is not a role but a _different
graph_: our ramp is neutral blue, theirs is not; our density is 40px controls, theirs is
denser; our type has two sizes, theirs has five. Today there is no supported answer. A host
can overwrite `--brikka-*` by hand and nothing checks it, and any brand we support has to be
authored inside this repository, in every file, by us.

The measurements that shape the decision come from the tree as it stands after the DTCG
migration:

- **103 custom properties.** 64 of them are the palette; the 19 roles reference only **16**
  palette steps — nine neutrals (`neutral-100` … `neutral-900`), `blue-600`, `blue-700`,
  `red-400`, `red-700`, `sky-400`, `sky-600` and `white`. A brand is therefore not "a palette
  of 64 colours"; it is sixteen colours and a handful of numbers.
- **Space is already parametric.** `space.base` is `4px` and the ramp is
  `calc(var(--brikka-space-base) * n)`, so one custom property rescales the spacing at
  runtime. `radius` follows, because it aliases `space.1`, `space.2` and `space.4`.
- **Five tokens are not.** `font-size` is `0.8125rem` and `0.9375rem`; `control-height` is
  `40px`; `focus-ring-width` is `2px`; `transition` is `120ms ease`; and `focus-halo` is the
  only colour in the graph that does not come from the palette at all — a literal
  `rgb(37 99 235 / 0.18)` in light and `rgb(96 165 250 / 0.24)` in dark. Change the ramp to
  violet and the focus halo stays blue.
- **The theme axis is singular and lives in the config.** One attribute and one media query:
  `LIGHT_ROLES`, `DARK_ROLES` and `DARK_ROLES_AUTO` in
  `packages/tokens/style-dictionary.config.mjs`.
- **The validation is repository-shaped.** `scripts/check-token-usage.mjs` reads the emitted
  CSS of this repository. Nothing a consumer runs can assert that a graph is complete.
- **The toolchain has no resolver.** Style Dictionary 5.8.0 ships no resolver module and
  ignores a per-platform `source`, so the dark theme is currently swapped by a per-platform
  preprocessor. A second axis multiplies what that mechanism has to do.

The alternative to deciding this now is deciding it later, against published names. ADR 0012
makes the name the API: a `brand` segment added to a token name after release is a breaking
change, and a role supplied by a preset is a different contract in every brand.

## Decision

A host customizes the graph by supplying **primitives**, never roles. The primitives are one
small, named set; everything semantic is derived from them by this repository.

The preset is DTCG, the same format and the same shape as `tokens/`, and the build merges it
over the default before transforming anything. Its contract is four things:

1. **16 colour anchors**, named for what they are on the ramp, not for what they paint — the
   count this record was written with, and thirty-one once
   [0019](0019-give-the-graph-a-status-vocabulary.md) adds the status families. A ramp step a
   role needs and a preset omits is a build failure, not a fallback.
2. **One space unit**, `space.base`. The ramp and the radii follow by arithmetic.
3. **One density and one type scale**, `control.height` and `type.scale`, so a host picks a
   size family instead of listing sizes.
4. **The status families stay the host's** — danger, success and warning are supplied by the
   preset, and are never derived from the accent, because they carry meaning rather than
   identity.

The five fixed tokens become parametric in the same change: `font-size` from a scale,
`control-height` from density, `focus-ring-width` from a factor, `transition` from a factor,
and `focus-halo` derived from the accent with
`color-mix(in oklab, var(--brikka-…-accent) 18%, transparent)` rather than a literal.

A brand and a mode are two orthogonal layers selected by attribute — `data-brand` and
`data-theme` — and neither becomes part of a name. The 103 names are the same in every brand;
what grows with a brand is the number of emitted blocks, not the number of names.

The validation that today runs only here runs for a preset too: every referenced primitive
exists, every role resolves in every mode, and the contrast ratio of each pair the components
paint passes the accessibility rules. A preset that fails does not build.

### Alternatives considered

| Alternative                                               | Why it was rejected                                                                                                                                                                                                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A preset supplies roles                                   | The semantic layer stops meaning anything: `bg.surface` would be whatever a brand says, R1 could not be enforced, and every brand would be a separate graph with its own names to keep in sync. 0012 says the role is the contract; a contract that each party writes is not one. |
| A preset supplies the emitted CSS by hand                 | It is what overwriting `--brikka-*` already is, without validation, and it drifts silently: the build cannot tell a deliberate override from a missing primitive.                                                                                                                 |
| Generate the graph from one seed colour, inside the build | Non-deterministic colour science in the pipeline, and it cannot produce the status families, which carry meaning rather than identity. Kept as a generator that writes a preset — an authoring aid outside the build, validated like any other preset.                            |
| One role file per brand and mode, 19 roles each           | The same explicitness with 19×2N edits per role change. Sixteen anchors per brand is the same surface, a quarter of the size, and it keeps role authoring in one place.                                                                                                           |
| Two-hop runtime indirection: role → brand → palette       | It would let a brand override at runtime without rebuilding, and it contradicts R2 as accepted — a chain no longer than one hop. The attribute layers already give runtime swapping without a second hop, so the rule stays.                                                      |

## Consequences

A brand becomes sixteen colours and four numbers, written in the same format as the source, by
someone who never opens a role file. Names stop multiplying: a host with five brands reads one
set of custom properties. And a preset cannot ship an unresolved role, because the validation
is part of the contract instead of a script in this repository.

The debts are three. The first is that Style Dictionary 5.8.0 has no resolver, so both axes are
carried by mechanism the standard will replace — a per-platform preprocessor today, a `brand`
modifier and a `theme` modifier when resolvers arrive. The second is that the five parametric
tokens change the emitted CSS: the arithmetic turns literals into `calc()`, so the current
"byte-identical output" gate cannot be the proof for that change, and it needs a changeset.
The third is linear CSS growth: every brand adds blocks for both modes.

The mistake this arrangement most invites is letting a preset write a role "just this once",
because the escape hatch is one JSON key away and the result looks correct in the one theme
that was tested. The second most likely is deriving danger, success or warning from the seed,
which produces a system whose failures are on-brand. Both belong in review, and the validation
is what makes the first one loud.

Revisit this when a resolver ships in the toolchain, when a host needs more brands than the
block model carries comfortably, or when a host needs a role the primitive contract cannot
express — that last one is a signal about the contract, not permission to let presets write
roles.
