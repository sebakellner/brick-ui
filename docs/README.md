# Documentation

Two audiences, two promises.

- **Whoever changes Brikka** reads the frozen documents at this root and the ADRs: how a value
  travels from a JSON file to a pixel, the rules each layer obeys, and every decision with the
  alternatives that lost.
- **Whoever consumes Brikka** —a person or an agent— reads `design-system/` and `guides/`. Those
  are written to be published as a site later; nothing has to move for that to happen.

`AGENTS.md` at the repository root is the entry point for coding agents working on the code; this
file is the map, and the published site gets its own `llms.txt`, generated from the publishable
directories.

## The three groups, and why the files are where they are

| Group       | Where                                                       | Rule                                                                    |
| ----------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Decisions   | [`adr/`](adr/)                                              | Frozen history. An accepted ADR is not edited; a reversal is a new ADR. |
| Internal    | this directory                                              | How to work here. Not published.                                        |
| Publishable | [`design-system/`](design-system/) and [`guides/`](guides/) | Written for a consumer, with the frontmatter a site needs.              |

**Nothing under `adr/` moves, and five documents stay beside it** —
[architecture.md](architecture.md), [conventions-tokens.md](conventions-tokens.md),
[conventions-code.md](conventions-code.md), [conventions-testing.md](conventions-testing.md) and
[conventions-accessibility.md](conventions-accessibility.md). Accepted ADRs link to them with
relative paths, and an accepted ADR is never edited, so moving one of those files would rewrite
history to fix a link. A new document goes in a group directory; these five stay.

## Read in this order

1. [architecture.md](architecture.md) — the system in one screen, and what it deliberately does not do.
2. [conventions-tokens.md](conventions-tokens.md) — the rules the token layers obey, each with what enforces it.
3. [add-a-component.md](add-a-component.md) — the first real task. Follow its links into the accessibility, testing and code conventions as you need them.
4. [0001. Generate the token CSS from JSON](adr/0001-generate-token-css-from-json.md) — why, and what lost.

## Internal documents

| Document                                                     | Type        | Answers                                                                   |
| ------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| [architecture.md](architecture.md)                           | explanation | how a value travels from a JSON file to a pixel, and what is out of scope |
| [conventions-tokens.md](conventions-tokens.md)               | reference   | which token rules apply, and what enforces each                           |
| [conventions-accessibility.md](conventions-accessibility.md) | reference   | the bar a component clears before it ships                                |
| [conventions-testing.md](conventions-testing.md)             | reference   | how to write a test that proves something                                 |
| [conventions-code.md](conventions-code.md)                   | reference   | TypeScript, stylesheets and tooling                                       |
| [conventions-docs.md](conventions-docs.md)                   | reference   | the shape of a component's README, its Storybook page and its stories     |
| [add-a-token.md](add-a-token.md)                             | how-to      | a new design value, without breaking the build                            |
| [add-a-component.md](add-a-component.md)                     | how-to      | the next element, without re-deciding anything                            |
| [adr/](adr/)                                                 | explanation | why the kit is arranged this way, and what was rejected                   |

`Type` is one of tutorial, how-to, reference and explanation — the
[Diátaxis](https://diataxis.fr/start-here/) split. There is no tutorial, and none should be
invented: the kit is small and the root README is the whole onboarding.

### Two things the map settles

**There is no `internal/` directory.** The root is the internal documentation, and it holds two
kinds of file that look alike: five that history froze — an accepted ADR links to each one, so
moving it would mean editing history to fix a link — and the rest, which could move and do not need
to. A directory that separated them would need this paragraph twice to explain itself, and a reader
would still have to consult a table to know which floor a document is on.

**Component documentation lives in its package.** Each element's `README.md` sits beside its code,
`pnpm check:readmes` ties it to the generated manifest, and it ships with the package. The published
site reads those files from where they are; a `docs/components/` directory would be a second copy of
a fact that already has an owner, which is the one rule this folder does not break.

## Publishable documents

| Document                                                   | Answers                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| [design-system/principles.md](design-system/principles.md) | what the system decides, in whose name, and what it refuses       |
| [design-system/tokens.md](design-system/tokens.md)         | the families, the roles, the axes, and the names a consumer reads |
| `llms.txt` (generated)                                     | the index an agent reads: one line per page, with its summary     |

A publishable page starts with the answer. The first two lines say what it is and what it is for,
so a reader —or an agent given a truncated page— gets the point before the argument. Then the
detail, under headings whose names are stable enough to jump to.

## Rules for these documents

- A fact lives in exactly one file; everything else links to it. A second copy is a second thing
  to keep true.
- English, like the code and the commit messages.
- **Frontmatter belongs to the publishable directories and nowhere else.** A site needs a title, a
  description and a one-line summary, and the summary is what the generated index carries. An
  internal document keeps the reading order here instead, so it cannot disagree with the site.
- **These documents describe the repository as it is, never as it is going to be.** No pending
  task, no "not yet", no roadmap. What changes a document is the thing it describes changing, in
  the same change, per the table below. An ADR is the deliberate exception: it records a decision
  and its date, which is history by design.
- Rationale belongs in an ADR. A convention states the rule and links the reason; it does not
  argue. **`design-system/principles.md` is the one exception**: it argues, because a principle is
  the only place where the thinking behind a rule is the point. Everywhere else, cite.

## Architecture decisions

An ADR records one decision that would be expensive to reverse, together with the alternatives
that lost. The rules of the folder:

- One decision per file, named `NNNN-decision-in-the-imperative.md`.
- Four digits, and a number is **never reused or renumbered**. Gaps mean a decision was withdrawn, not that the sequence is broken.
- An accepted ADR is **not edited** when the decision changes. Write a new one and mark the old `superseded by [NNNN](NNNN-slug.md)`. The history of a reversal is the most valuable thing in the folder.
- When only part of an accepted decision is reversed, the new ADR supersedes that part and the old one is marked `superseded in part by [NNNN](NNNN-slug.md)`, with one sentence naming what still holds. 0003 is the case: its rule about `var()` aliases survived 0006, its description of the layers did not. Marking the status is the only edit an accepted ADR receives; the body below it is never rewritten.
- An accepted ADR's **identifiers** follow a rename of the thing they name. That is not a change of decision: `bk-` becoming `brikka-`, a `BkButton` becoming `BrikkaButton` and a package path moving are updated in place, while every sentence that says what was decided stays as it was written. The line is between the names and the reasoning. [0023](adr/0023-let-the-identifier-prefix-follow-the-product-name.md) is the rename that drew it.
- Start from [0000-template.md](adr/0000-template.md) and replace every prompt.
- **The Context describes our situation, not the industry's.** What hurt, what it cost, verified in the code. Benchmarking belongs in the working notes: put it in the Context and a reader years later will take what other systems do as the argument for what we did.
- An alternative may name the system it comes from, because that is how a rejected option proves it was real. That is the only place an outside design belongs.

## When to update what

| If you change…                             | Update                                                                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a token, a layer or the pipeline           | [architecture.md](architecture.md) and [conventions-tokens.md](conventions-tokens.md); [design-system/tokens.md](design-system/tokens.md) if a consumer sees it; a new ADR if it is a decision |
| a component's public surface               | its `README.md` and its Storybook page, in the shape [conventions-docs.md](conventions-docs.md) fixes                                                                                          |
| a shared layer — a mixin, a controller     | the layers table in [CONTRIBUTING.md](../CONTRIBUTING.md#how-a-field-is-built), and the map in [architecture.md](architecture.md)                                                              |
| a test rule                                | [conventions-testing.md](conventions-testing.md), and the suite that enforces it                                                                                                               |
| adding an element or a part                | [add-a-component.md](add-a-component.md), which is where the current checklist lives                                                                                                           |
| a check, a CI gate or a command            | [CONTRIBUTING.md](../CONTRIBUTING.md)                                                                                                                                                          |
| a publishable page                         | regenerate `llms.txt`; the gate fails when it is stale                                                                                                                                         |
| something that makes a past decision false | not that ADR — a new one that supersedes it                                                                                                                                                    |

## Glossary

| Term                | Meaning                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| primitive / palette | a raw declared value (`--brikka-palette-blue-600`). A reference ramp, not a usage list                                                     |
| semantic role       | a role in `color.json` read **directly** by a component (`--brikka-text-danger`). See R1 in [conventions-tokens.md](conventions-tokens.md) |
| hook                | a component-level custom property a host may set (`--brikka-button-bg`). The default is a variable, never a literal                        |
| axis                | a value a host turns instead of editing tokens: theme, density, type scale, brand preset                                                   |
