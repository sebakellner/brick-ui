# 0014. Publish under the scope the kit owns, and move both packages together

Date: 2026-11-20

## Status

accepted, superseded in part by
[0016](0016-adopt-changesets-before-the-first-release.md): the deferral of a release
tool is gone — changesets now enforces the `fixed` group this document decided by
hand. What still holds is the scope and the rule that both packages carry one
version; the paragraph below on why they move together is still the reason.

Extends [0013](0013-let-the-identifier-prefix-follow-the-product-name.md), which
named the product but not the namespace it publishes into.

## Context

[0013](0013-let-the-identifier-prefix-follow-the-product-name.md) named the kit `brikka`
and made the identifier prefix follow the name. It said nothing about the npm
namespace, and the namespace turned out to be the harder name to get.

`@brikka` is not available. A dormant account holds the name and has published
nothing — the registry reports zero packages for it. npm's dispute process covers
a trademark or an impersonation, not a dormant account, so the name is
unreachable rather than contested. The unscoped `brikka` is free, and so are
`brikka-tokens`, `brikka-react`, `brikka-vue`, `brikka-svelte` and
`brikka-angular` — the question was never availability, it was retention.

Two packages ship. `@brikka-ui/tokens` is a **peer** of `@brikka-ui/web-components`:
a consumer installs both, and the elements read the custom properties the styles
declare. `@brikka-ui/test-utils` and the Storybook package are internal and stay
private. Nothing has been published, so every option is still free.

## Decision

**The published packages live under `@brikka-ui`, an organization this kit owns, and
the two that ship carry one version and move together.**

`publishConfig.access` is `"public"` in both manifests, because a scoped package
defaults to restricted and the free plan allows unlimited public packages. `tokens`
no longer carries `private: true`: it has to be installable for the elements to be
usable, and a package that cannot be published is a package the peer range can
never point at.

One version for both while the kit is pre-1.0. `tokens` is a peer of the elements,
so they cannot drift without producing an install where one half is older than the
other and the custom properties it reads do not exist yet. A `0.x` minor is the
signal for a breaking change; 1.0 is not a formality to be reached early.

### Alternatives considered

| Alternative                          | Why it was rejected                                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@brikka`                            | Held by a dormant account with no published packages, and npm does not arbitrate dormancy. Unreachable, not contested.                                                                                                                                                   |
| Unscoped `brikka` + `brikka-tokens`  | The nicest install line of the options — `pnpm add brikka` — and it loses on one fact: an unscoped name cannot be reserved without publishing, an organization can be created and held. Every future wrapper would be a separate race, and each one is a name to defend. |
| `@sebakellner/*`, the personal scope | Available today with no new name at all, and it removes the product from the install line. A personal scope also makes the packages a property of one account rather than of the kit.                                                                                    |
| Independent versions per package     | The arrangement of a family whose packages have different lifecycles, and it needs per-package release tooling to stay honest. Here the two published packages change together by construction: the peer relationship is the lifecycle.                                  |

## Consequences

Easier: one namespace holds every present and future package, so `@brikka-ui/react`
or `@brikka-ui/vue` needs no new name and no new decision. The scope is an
organization with roles, so a second maintainer is an invite rather than a shared
password. The install line states the product and the artifact:
`@brikka-ui/web-components`.

Harder: five characters in every install command, and the scope is a name the code
does not otherwise use — tags, custom properties, events, classes and the
repository all say `brikka`, and only the namespace says `brikka-ui`. That is the
deal the field makes too: the product is Radix, the scope is `@radix-ui`. A reader
who expects the two to match will look for the reason here.

Debt accepted: **the version is set by hand.** Both manifests are at `0.1.0` and
nothing enforces that they stay equal; a release means editing two files and
publishing in dependency order, `tokens` before the elements, because the peer has
to exist when the other arrives. The condition to revisit is the first release that
needs more than one package bumped independently, or a second contributor
publishing — that is when changesets earns its dependency.

The mistake this arrangement invites: bumping `web-components` and forgetting
`tokens`, which publishes a peer range that points at a version the consumer cannot
resolve. It fails loudly at install time rather than silently at runtime, which is
the only reason it is acceptable debt.
