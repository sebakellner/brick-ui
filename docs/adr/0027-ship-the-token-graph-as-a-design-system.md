# 0027. Ship the token graph as a design system, and let the components test it

Date: 2026-11-20

## Status

proposed. It extends [0019](0019-the-token-graph-is-the-public-contract.md) and
reverses one rule of row R1 in
[docs/conventions-tokens.md](../conventions-tokens.md). It supersedes no record.

## Context

Today `@brikka-ui/styles` is the theming of the kit: a token source justified by what
`packages/web-components` reads. Row R1 of `docs/conventions-tokens.md` states the rule
and `pnpm check:tokens` enforces it — `scripts/check-token-usage.mjs` derives the
semantic roles from `color.css` minus the `palette` prefix, and fails on a role no file
reads.

That arrangement is about to be the wrong shape. A host that loads
`packages/tokens/src/theme.css` can paint its own markup with `--brikka-bg-surface` and
never register an element. For that host `bg-surface`, `text-default` and
`border-default` are the contract, and whether a component of this repository happens to
read a given role says nothing about whether it is useful. Measured in the tree today:
122 declared tokens — 64 `palette`, 41 semantic roles (`bg` 16, `text` 10, `border` 9,
`focus` 6), 12 primitives across `space`, `radius` and `font-size`, and 5 singletons —
plus 40 hooks, which the token graph does not contain at all.

Two facts make the current shape expensive to keep.

The first is that the rule deletes what the export needs. The ten roles removed when the
control tier went — `primary`, `on-primary`, `surface`, `text`, `border` among them —
were deleted because nothing read them. Under a standalone export that reason inverts: a
published role may have no consumer in this repository and still be exactly what a host
paints with.

The second is that R2 does not describe the code. It says no chain is longer than one
hop, and the button resolves through three: `--brikka-button-bg` (the hook), then
`--brikka-button-variant-bg` (`brikka-button.ts:29`), then `--brikka-bg-accent`, then
`--brikka-palette-blue-600`. The rule is true of `tokens/*.json` and false of what the
browser resolves, and nothing in the rule says which of the two it governs.

The token source is also not in a format a design system can stay in. Every token carries
`value`; none carries a `$type` or a `$description`, because nothing needs one while a
component is the only reader. Light and dark are two top-level groups, `role-light` and
`role-dark`, collapsed by a `name/strip-theme` transform and emitted under
`platform.prefix: 'brikka'`.

The package is also misnamed, and by the same error. `@brikka-ui/styles` names the format the
package emits rather than the artefact it publishes, while its own manifest says something
else: `theme.css`, `tokens.css` and the typed map, and a **peer** dependency from the
elements, which means a host can install the design system and never install a component.
The name is read before the README and at every import site, and it says the package is the
CSS of a component kit.

Nothing is published, which is what makes all of it reparable at this price. [0023](0023-let-the-identifier-prefix-follow-the-product-name.md)
recorded the condition on that freedom — it "stops being true the day a version ships".
Every item in the decision below is a rename, a restructure or a removal: the three kinds
of change that are free only now.

## Decision

**`@brikka-ui/tokens` ships a design system a host can consume without the components,
and the components are its integration test rather than its definition.**

1. **The identifier prefix stays `--brikka-`, permanently, declared once at
   `platform.prefix`.** It is not parameterized and not derived from the host. A host
   with its own brand rebrands by forking the token source; the fork procedure is written
   the day a second consumer exists, not before.
2. **R1 is deprecated and replaced.** The replacement lives in
   `docs/conventions-tokens.md` from the change that accepts this record: a role is a
   documented, typed commitment that resolves in every theme, and its removal or rename
   is a breaking change that ships with the changeset saying so. The converse of R1
   survives unchanged — a value only one component paints is a component token, and it is
   deleted in the same change that stops reading it.
3. **R2 is amended, not deprecated.** Within `tokens/*.json` an alias points one layer
   down and a role never aliases a role. The hops that hooks and component-local defaults
   add live outside the graph, and that is where the depth budget sits. The amendment
   names which graph the rule governs rather than asserting a depth the code exceeds.
4. **The token source moves to DTCG, and the themes move to the Resolver module.**
   `value` becomes `$value`, every group declares a `$type`, and every role carries a
   `$description`. `role-light` and `role-dark` become one set plus a `theme` modifier,
   which is the model that maps onto a design tool's collections and modes instead of
   being collapsed by a transform.
5. **Enforcement moves with the rule.** A role that resolves in one theme and not another
   fails `pnpm check:tokens`. A token name that disappears from a change declaring no bump
   fails a diff against the base branch, which needs no release to exist. The `$description`
   and `$type` half becomes mechanical when item 4 lands; until then it is review, and the
   rule says so instead of implying a gate it does not have.
6. **The order is contract, then export, then tools.** The Figma plugin is a later,
   separate package with its own release. It reads this contract; it never becomes a
   reason to change it.
7. **The package is `@brikka-ui/tokens`.** `styles` named the format the package emits, not
   the product, and it read as an annex of the elements — the subordination this record
   reverses. The artefact is the token graph in three serializations; the package is a peer
   of the elements, not a part of them; and the product name stays where a reader looks for
   it, in the description and the documentation. A host that adopts the design system
   without the components installs this package and nothing else.

### Alternatives considered

| Alternative                            | Why it was rejected                                                                                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep R1 as written                     | A role with no component consumer would fail the check exactly when the standalone export starts to need it, so the rule and the product would contradict each other in the same commit.                                                           |
| Deprecate R1 with no replacement       | The ten roles written up front so the file would look complete are the evidence of what fills the vacuum: the semantic layer grows back to look complete, now with hosts depending on names nobody justified.                                      |
| Deprecate R2 as well                   | Without it a theme change propagates through a role aliasing a role, and a resolved value stops being answerable by opening two files. The depth the hooks add is bounded and named under this decision; unbounded and unnamed is the alternative. |
| Parameterize the prefix now            | 40 hooks, the check scripts that match `--brikka-` by regular expression, and the stories and tests that read the names would each span N prefixes, to serve a consumer that does not exist.                                                       |
| Wait until a component needs each item | Every item is a rename or a restructure, and each stops being free at the first version. Waiting spends the one asset that expires.                                                                                                                |
| Keep the package named `styles`        | The name describes the format the package emits rather than the artefact it publishes, and it keeps the elements looking like the owners of the design system. It is also only free to change while nothing is published.                          |     |

## Consequences

Easier: a host can take `theme.css` and its own markup, and an import site says what it is
importing. A role survives a component
refactor instead of being deleted and re-authored. A third theme stops being a third
file. And the design-tool bridge has a model to target — a set with modifiers, a type per
group — rather than a shape this repository invented and would have to re-explain.

Harder: every role is a published name someone owes a description. Adding one is a design
decision with a release rather than a component detail. Two gates are new and both will
fail on today's tree the first time they run. And the depth the hooks add is now something
to watch, where before the rule denied it existed. The rename also leaves the token source
at `packages/tokens/tokens/`, which reads as a stutter; it stays, because that directory is
not a published path and is therefore free to change forever, unlike the package name.

Debt accepted, in two parts. The DTCG and Resolver migrations do not land in one change,
so the source keeps `value` and two role groups while the rule text already asks for
`$description` and every-theme coverage. The condition to revisit is the change that lands
item 4: from there the description half of R1 becomes a check, and the `role-light` /
`role-dark` split stops being a reason to keep two files. The second part is the fork
procedure promised in item 1 and not written; the condition to write it is a second
consumer that wants its own brand.

The mistake this arrangement invites: reading "a role may ship with no consumer" as "a
role may ship without a reason". The gate moved from the consumer to the description and
the changeset; it did not go away. A role added because the system "should" have it is the
ten roles again, with the difference that the removal is now paid for by someone who never
saw this source.
