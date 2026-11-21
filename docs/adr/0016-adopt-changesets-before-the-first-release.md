# 0016. Adopt changesets before the first release, for the lockstep

Date: 2026-11-20

## Status

accepted. Supersedes in part
[0014](0014-publish-under-the-scope-the-kit-owns.md): that document deferred a
release tool until a package needed independent bumping or a second person
published, and this adopts one earlier. The scope, the lockstep rule and the peer
reasoning all still hold.

## Context

[0014](0014-publish-under-the-scope-the-kit-owns.md) decided that
`@brikka-ui/web-components` and `@brikka-ui/tokens` carry **one version and move
together**, because `tokens` is the peer of the elements. It then wrote the debt
down honestly: _the version is set by hand, and nothing enforces that the two stay
equal._ The failure that debt allows is a published peer range pointing at a
version the consumer cannot resolve — loud at install time, but only after the
irreversible step.

The condition 0014 set for a tool was "the first release that needs more than one
package bumped independently, or a second contributor publishing". Neither has
happened, and the milestone is still ahead, so adopting now needs a reason that is
not "the milestone arrived". The reason is the debt itself: a rule enforced by
memory is a rule that fails on the day the person is busy, and the failure lands at
the one moment that cannot be undone.

The field was checked rather than assumed. Of the monorepo component kits that
automate releases, four use changesets — `primer/react`, `radix-ui/primitives`,
`lit/lit`, `chakra-ui/chakra-ui` — while `microsoft/fluentui` uses beachball and
`carbon-design-system/carbon` uses lerna. Among the four, **only Chakra groups its
packages**: `fixed: [["@chakra-ui/**"]]`. The others version independently, which
is the arrangement of a family whose packages have different lifecycles. This kit is
Chakra's shape, not Radix's.

## Decision

**`@changesets/cli` lives at the root, and the two shipped packages are a `fixed`
group.**

```
fixed: [["@brikka-ui/web-components", "@brikka-ui/tokens"]]
access: "public"
baseBranch: "main"
```

A changeset that declares a bump for either package bumps both. Declaring one is
enough, and forgetting the other stops being possible — which is precisely the
condition 0014 could not enforce.

`commit: false`, because the repository squash-merges and the changelog file belongs
in the version PR rather than in a commit of its own. The changelog generator is the
built-in one: the GitHub integration would add a dependency to render links the
small changelog does not need yet.

**Stage one only: this versions, it does not publish.** `pnpm changeset` writes the
intent, `pnpm changeset:version` applies the bumps and writes each package's
`CHANGELOG.md`. There is no publish step, no workflow and no token, so nothing here
can reach the registry.

### Alternatives considered

| Alternative                                | Why it was rejected                                                                                                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A CI check that the two versions are equal | Closes half the debt: it catches a mismatch, not the missing changelog, and it fires after someone has already edited a manifest by hand. It also makes the version a thing two places compute instead of a thing a tool owns.                        |
| `semantic-release`                         | Derives the number from commit messages and publishes on merge, with no human between the decision and the registry. A kit that has not shipped once should choose its own first numbers, and "you cannot unpublish" argues for a person at the gate. |
| `beachball` / `lerna`                      | What Fluent and Carbon use, and both carry more machinery than two packages justify: lerna is in maintenance for the publishing role, and beachball is shaped around a much larger review and bump workflow.                                          |
| Keep it manual, as 0014 wrote it           | The honest option, and it fails exactly when the debt says it fails: on a busy day, at publish time, with an unresolvable peer range as the symptom.                                                                                                  |

## Consequences

Easier: the versions leave the manifests and become changesets, so two people
bumping two packages cannot disagree; the peer relationship is expressed once, in
config, instead of in a paragraph asking the next maintainer to remember it; and
each package gets a changelog from the same input that moves its version.

Harder: a habit. Every PR that changes a shipped package has to add a changeset,
which is friction on the smallest changes and is not yet enforced — see the debt
below. A dependency also joins the repository that must never reach a published
tarball, since only the packages that ship are published.

Debt accepted: **nothing requires a changeset in CI.** A PR that changes
`web-components` and lands without one is not caught; the omission surfaces at the
next `changeset version`, when the changelog is missing a line but the version still
moves. The condition to revisit is the first PR that lands without one, or the
arrival of a second contributor — whichever is first, the fix is a check that a PR
touching a shipped package adds a file under `.changeset/`.

The mistake this arrangement invites: treating `fixed` as a licence to bump without
reading. It keeps the numbers equal, not the change meaningful — a `minor` that
describes nothing is still a minor, and the changelog entry is the only artifact a
consumer reads.
