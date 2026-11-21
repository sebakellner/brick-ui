# 0020. Suspend changesets until the first version, and let the history carry the record

Date: 2026-11-20

## Status

accepted, in the change that drops the changeset this record makes unnecessary. It supersedes
**in part** [0016](0016-adopt-changesets-before-the-first-release.md): the clause that adopts
changesets _before_ the first release. Everything else in 0016 still holds — the `fixed` group,
`commit: false`, stage one versión-only, no publish step — and `.changeset/` stays configured,
so reversing this record is one ADR away rather than one migration away.

## Context

0016 adopted `@changesets/cli` early on purpose. Its reason was not the release milestone but a
debt from [0014](0014-publish-under-the-scope-the-kit-owns.md): the two shipped packages must
carry one version, "a rule enforced by memory is a rule that fails on the day the person is
busy", and the `fixed` group is what makes forgetting the second package impossible.

That reasoning is sound where it applies. It applies **at the moment of publishing**, and it is
about the version cut, not about every change. What the repository has been doing since is the
other thing: a changeset on every pull request, at `0.1.0`, with nothing published and no
consumer anywhere.

The costs, measured on the two most recent slices rather than imagined:

- The status-vocabulary changeset restated its commit message almost verbatim. The information
  a changeset adds over the commit is, in this phase, nothing.
- Every changeset forces a bump level. At `0.x` with no consumers, `minor` means "breaking,
  which is allowed at 0.x" and `patch` means "not breaking, which nobody can observe". The
  decision carries no consequence and still has to be made.
- Two changesets were written within hours of each other and neither will be consumed until a
  release that is still ahead. Until then they are a queue of files that a reviewer reads
  twice: once in the commit, once in `.changeset/`.
- CI never checked for them. There is no job that reads `.changeset/`, so the rule has lived in
  `CONTRIBUTING.md` and in review attention — which is the arrangement 0016 itself argued
  against for the version rule, applied to a rule whose failure costs nothing.

What 0016 protects against cannot happen before publication: a published peer range pointing at
a version the consumer cannot resolve. There are no published versions.

## Decision

**No changeset is written per pull request until the first version is cut.** The commit message
is the record: it already states what changed and why, and the repository squash-merges, so the
history that survives is one message per change.

The first release is versioned by hand, in its own change, with its own procedure: it bumps both
packages together under the existing `fixed` group, checks the peer range, and writes the
changelog. That change either re-adopts per-pull-request changesets or supersedes this record
with the procedure it actually uses.

The mechanics stay. `.changeset/` keeps its configuration and the `fixed` group, `pnpm changeset`
still works, and the changeset written before this record
(`dtcg-role-names.md`) is left where it is: the release change consumes it or drops it, and no
change is made because of it today.

`CONTRIBUTING.md` stops asking for a changeset and points here instead; R1 of
[docs/conventions-tokens.md](../conventions-tokens.md) stops counting the changeset among what
enforces it.

### Alternatives considered

| Alternative                                   | Why it was rejected                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep 0016 as written                          | It pays a real cost per pull request for information nobody consumes, and the risk it mitigates cannot occur until publication. The decision was made when the release looked closer than it turned out to be.                                                                                                                             |
| Remove the tooling entirely                   | It would discard the `fixed` group, which is 0014's debt paid, and reinstating later costs the same work twice. Suspension is reversible; removal is not free.                                                                                                                                                                             |
| Keep changesets for user-visible changes only | The boundary between "user-visible" and not is arguable at every pull request — is a renamed TypeScript key visible if nothing imports it? The rule would drift into judgement calls, which is the failure mode of any rule that needs a discussion per change. The suspension has a single, testable condition: the first version is cut. |

## Consequences

A pull request loses a ceremony step and keeps its explanation, in the place a reader of the
history already goes. The release stops being incremental and becomes a single deliberate change
— which is where 0016's lockstep guarantee is actually needed, and where it is now stated as a
procedure instead of an accumulation.

The debt is named rather than hidden: for the first release, the lockstep is back to being
enforced by whoever cuts it, because nothing in the tree forces both packages to bump. 0016
called that the arrangement that fails on the day the person is busy. The mitigation is that the
release is one change, reviewed, with the two packages in front of it — not a step hidden inside
a feature pull request.

The mistake this most invites is publishing from a branch while the suspension is in force, on
the assumption that the version was already handled. The second is treating this record as
"changesets are gone" and deleting the dependency, which is the alternative above. Revisit at
the first release, not before.
