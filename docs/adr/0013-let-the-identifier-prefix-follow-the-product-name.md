# 0013. Let the identifier prefix follow the product name

Date: 2026-11-20

## Status

accepted, superseded in part by
[0015](0015-keep-identifiers-in-an-accepted-adr-current.md). What still holds is
everything this document decided: the rename, and that the reasoning in the earlier
ADRs was written for the rule rather than for the prefix. What no longer holds is
the last half of this status — those ADRs **do** carry `brikka-` identifiers now,
because a name is not a decision and their examples had stopped naming anything.
Read 0015 for that line.

It reverses no decision of its own: it renames the identifiers that
[0002](0002-require-the-theme.md), [0004](0004-forbid-style-literals-in-components.md),
[0006](0006-stack-the-token-layers-and-add-a-theme.md) and
[0012](0012-the-token-graph-is-the-public-contract.md) argue about, and every
rule they state still holds under the new names.

## Context

The kit was called `brick-ui`, and the name was taken twice over. `robin8yeung/BrickUI`
is a declarative UI framework for Android in Kotlin, 81 stars, in the same domain —
a component kit. On npm, `brick-ui` holds version `0.0.1` published in April 2022
with no description and no repository, and `@brick-ui/core` holds `0.1.2` from the
same month. Both are abandoned, and both are what a reader of this kit finds first
when they search for it.

The name reached further than the package: `bk-` was the prefix of every custom
element tag, every custom property, every event and every component directory, and
`Bk` of every exported class. Measured across the repository before the change:

| Surface                        | Occurrences | Files | Notes                                     |
| ------------------------------ | ----------- | ----- | ----------------------------------------- |
| `bk-` — tags, events and paths | 4636        | 137   | 72 of those are path segments             |
| `--bk-` — custom properties    | 1335        | 85    | 122 distinct token names                  |
| `Bk<Component>` — classes      | 1026        | —     | 10 components plus `shared/`              |
| `brick` — product and packages | 250         | 53    | 5 manifests, the example, the CI workflow |

Nothing was published, so the rename carried no compatibility burden: no
deprecation window, and no alias tags. That is the fact that made the change
affordable at this size, and it stops being true the day a version ships.

## Decision

**The kit is named `brikka`, and every identifier it publishes carries that name.**
Tags read `brikka-*`, custom properties `--brikka-*`, events `brikka-*`, classes
`Brikka*`, packages `@brikka-ui/*`, and component directories `brikka-*`. The
example consumer is `examples/brikka-vite-ts`.

Style Dictionary's `prefix` option is the single place the property prefix is
declared; the 41 override hooks in the same config file and the four check
scripts that match `--brikka-` by regular expression are the places it is
assumed, and they are the reason a prefix change is a repository-wide edit
rather than a config edit.

### Alternatives considered

| Alternative                                     | Why it was rejected                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `brikka` as the brand, `bk-` kept as the prefix | The consumer would write a prefix that spells a name the kit no longer has, and the one thing the rename exists to fix — that the identifiers point at a taken name — would survive in 4636 places. The prefix is the identifier that is read and typed most often.                  |
| `kandi`                                         | Free on npm and free of any same-domain project, but the top search results for it are the Kandinsky diffusion models: 37 repositories named `kandi` exist and none is a component kit, while `kandinsky*` accounts for the first six hits by stars. Discoverability, not collision. |
| `kando`                                         | `kando-menu/kando`, TypeScript, 6674 stars. The rename would have swapped a weak collision for a strong one in the same language.                                                                                                                                                    |
| `brikui`                                        | `ShawnGeorge03/BrikUI` exists and `brikui` holds version `0.0.116` on npm. Someone had already done brick-plus-ui and published it.                                                                                                                                                  |
| Keeping `brick-ui` with no rename               | Cheapest of all, and it was the status quo until the collision was measured. It leaves the kit unsearchable next to an Android framework with the same normalized name.                                                                                                              |
| `tejido`, `kandela`, `tessela`, `bloka`         | All free on npm and none in the same domain. `brikka` won on distance from `brick` without leaving its sound, and on being short enough that `brikka-slider-variant-halo-size` stays readable.                                                                                       |

## Consequences

Easier: the kit owns its search result. The name, the tag prefix, the property
prefix and the package scope are one string, so a reader who sees
`--brikka-button-bg` learns the product from the identifier.

Harder: every consumer's markup and theme breaks at once, which is why the change
had to land before the first release and cannot land after it. The longest
identifiers grew by five characters, and `--brikka-slider-variant-readout-gap` is
where that is felt.

Which gate pins the prefix is not what it looks like, and this was measured by
mutation rather than assumed. `pnpm check:tokens` matches names by the new prefix,
so a property read that kept `--bk-` is invisible to it: one hook reverted to
`--bk-button-bg` passed the check unchanged. The suite is what catches it — the
same edit fails two tests, because the inherited-property case asserts that the
hook wins over the variant default — and renaming a tag back to `bk-button` fails
four more. A stale prefix in a place no test exercises would pass both gates and
render through the fallback.

One part of this change is not a commit. The repository rename is an action on
GitHub, and it behaves unlike every other rename here: `github.com/sebakellner/brick-ui`
and the git remotes redirect to the new name, while **project site URLs do not** —
`sebakellner.github.io/brick-ui/` stops resolving the moment the repository is
renamed, and nothing in the repository can prevent it. The 16 URLs across the
READMEs, which are the CI badge, the Storybook link and the convention anchors,
therefore change in the same change as the rename. Any future repository rename
has the same shape: the redirect covers the repository, never the site.

Debt accepted, in two parts and both conditional:

1. **The 23 accepted ADRs keep `bk-` and `@brick/` in their prose and snippets.**
   Rewriting them would edit the record of a decision made at a different time,
   so this document is the mapping instead. The condition to revisit is the day a
   reader of an ADR reaches for an element that no longer exists by that name more
   than once: the honest fix then is to update the identifiers, never the
   reasoning.
2. **A stale prefix is caught only where a test exercises it.** `check:tokens`
   cannot reject `--bk-*` because it looks for `--brikka-*`, and the browser suite
   only notices when the read has a visible consequence. The condition to revisit
   is the next change to `check-token-usage.mjs`, which should also fail on a
   property read that carries the old prefix, so the gap is closed by the check
   rather than by the suite's coverage.

The mistake this arrangement invites: renaming a component after this ADR and
taking the prefix from the component's own name instead of the product's. The
prefix is `brikka-`, always, and the component name follows it.
