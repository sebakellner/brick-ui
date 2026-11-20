# 0025. Keep the identifiers in an accepted ADR current, and never its reasoning

Date: 2026-11-20

## Status

accepted. It extends the folder rules in
[docs/README.md](../README.md) and pays the debt recorded in
[0023](0023-let-the-identifier-prefix-follow-the-product-name.md). It reverses no
decision: every ADR it touches still says what it said.

## Context

[0023](0023-let-the-identifier-prefix-follow-the-product-name.md) renamed the kit
and made the identifier prefix follow the name. The 22 ADRs written before it
kept their `bk-` examples, deliberately, because the folder's rule is that an
accepted ADR is never edited and that marking the status is the only change it
receives. 0023 accepted that as debt with a stated condition: update the
identifiers, never the reasoning, the day a reader hits a dead name more than
once.

That day arrived immediately, and it was measurable rather than felt. `bk-` and
`Bk<Component>` appeared on **133 lines across 17 files** of `docs/adr/`:
`--bk-button-bg` in an illustrative snippet, `bk-radio-group` in a decision about
naming a group, `BkButton` in prose about a variant. Every one of those names
stopped existing. A reader who greps for the element an ADR names finds nothing,
and an ADR whose example cannot compile is an ADR a reader stops trusting — which
is worse than one that is merely old, because it teaches a name that is wrong.

The folder rule was written for a different event: an ADR being edited _when the
decision changes_, which is how a record gets quietly rewritten into agreement
with the present. A rename is not that event. Nothing in those files decided
anything about `bk-`; the prefix was the vocabulary of the day, and the words
around it are the decision.

## Decision

**An accepted ADR's identifiers follow a rename of the thing they name. Its
reasoning is never rewritten.**

In practice the edit is limited to the three shapes a rename produces: the custom
property prefix (`--bk-` to `--brikka-`), the element and class names
(`bk-radio-group` to `brikka-radio-group`, `BkButton` to `BrikkaButton`), and a
package path. Every sentence that states what was decided, what was rejected, and
what it cost stays exactly as it was written, including the sentences that use the
old name as history — 0023 still says the kit was called `brick-ui`, and the two
ADRs about the rename keep the old prefix on purpose, because the old prefix is
their subject.

`AGENTS.md` and [docs/README.md](../README.md) now state the exception next to the
rule, so an agent reading either does not have to infer it from 17 edited files.

### Alternatives considered

| Alternative                                  | Why it was rejected                                                                                                                                                                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leave them stale and let 0023 be the mapping | 0023 is one line of explanation against 133 lines of example. A reader of 0012 does not read 0023 first; they read a name, grep it, and find nothing. The mapping only works for someone who already knows a rename happened.          |
| Supersede 17 ADRs with 17 new ones           | The cost is a folder of 40 files where half say the same thing twice, to record that a prefix changed. A reversal deserves its own record; a vocabulary change does not, and dressing it as one buries the real reversals among noise. |
| Edit only the snippets, leave the prose      | The prose is where most of the 133 lines are, and it is where a reader takes a name from. Half a sweep leaves a file that is internally inconsistent about what an element is called.                                                  |
| Do nothing until the folder is rewritten     | The condition in 0023 was "more than once", and the count was 133. Waiting makes every new reader pay for it once.                                                                                                                     |

## Consequences

Easier: an ADR can be read as documentation. The name a decision talks about is
the name the code has, so a grep from a sentence reaches an element, and a reader
never has to know a rename happened to understand a decision.

Harder: the folder rule now has a line in it, and the line depends on judgement —
telling a _name_ from a _sentence that states a decision_ is not mechanical when
the sentence contains the old name as its subject. 0023 and 0024 are the live
example: they keep `bk-` because the old prefix is what they decided about, and a
future sweep that applies this mechanically would destroy both.

Debt accepted: **an ADR's reasoning can go stale in the other direction.** A
paragraph that argues about `bk-` tokens now argues about tokens by that name; the
argument still holds, but the reader supplies the translation. The condition to
revisit is a second rename of the same scale, at which point the folder needs a
one-line index of renames rather than another sweep.

The mistake this arrangement invites: treating the exception as permission to
modernize an ADR's opinions. The next edit to an accepted ADR should still be a
new ADR, and the only text that may change in place is text that names something.
