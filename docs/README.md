# Documentation

How Brick is put together and why. The root [README](../README.md) covers usage
and is written for consumers; this directory is for whoever changes the kit.
[AGENTS.md](../AGENTS.md) at the repository root is the same map, written for
coding agents.

## Read in this order

1. [architecture.md](architecture.md) — the system in one screen, and what it
   deliberately does not do.
2. [conventions-tokens.md](conventions-tokens.md) — the rules the token layers
   obey, each with the thing that enforces it.
3. [add-a-component.md](add-a-component.md) — the first real task. Follow its
   links into the accessibility, testing and code conventions as you need them.
4. [0001. Generate the token CSS from JSON](adr/0001-generate-token-css-from-json.md)
   — why, and what lost.

## Documents

| Document | Type | Answers |
| --- | --- | --- |
| [architecture.md](architecture.md) | explanation | how a value travels from a JSON file to a pixel, and what is out of scope |
| [conventions-tokens.md](conventions-tokens.md) | reference | which token rules apply, and what enforces each |
| [conventions-accessibility.md](conventions-accessibility.md) | reference | the bar a component clears before it ships |
| [conventions-testing.md](conventions-testing.md) | reference | how to write a test that proves something |
| [conventions-code.md](conventions-code.md) | reference | TypeScript, stylesheets and tooling |
| [add-a-token.md](add-a-token.md) | how-to | a new design value, without breaking the build |
| [add-a-component.md](add-a-component.md) | how-to | the third element, without re-deciding anything |
| [adr/](adr/) | explanation | why the kit is arranged this way, and what was rejected |

`Type` is one of tutorial, how-to, reference and explanation — the
[Diátaxis](https://diataxis.fr/start-here/) split. There is no tutorial, and none
should be invented: the kit is two components and the root README is the whole
onboarding.

## Architecture decisions

An ADR records one decision that would be expensive to reverse, together with the
alternatives that lost. The rules of the folder:

- One decision per file, named `NNNN-decision-in-the-imperative.md`.
- Four digits, and a number is **never reused or renumbered**. Gaps mean a
  decision was withdrawn, not that the sequence is broken.
- An accepted ADR is **not edited** when the decision changes. Write a new one
  and mark the old `superseded by [NNNN](NNNN-slug.md)`. The history of a reversal
  is the most valuable thing in the folder.
- Start from [0000-template.md](adr/0000-template.md) and replace every prompt.
- **The Context describes our situation, not the industry's.** What hurt, what it
  cost, verified in the code. Benchmarking belongs in the working notes: put it in
  the Context and a reader years later will take what other systems do as the
  argument for what we did.
- An alternative may name the system it comes from, because that is how a rejected
  option proves it was real. That is the only place an outside design belongs.

## When to update what

| If you change… | Update |
| --- | --- |
| a token, a layer or the pipeline | [architecture.md](architecture.md) and [conventions-tokens.md](conventions-tokens.md); a new ADR if it is a decision |
| a component's public surface | its `README.md`, its Storybook page, and the components table in the root README |
| a check, a CI gate or a command | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| something that makes a past decision false | not that ADR — a new one that supersedes it |

## Rules for these documents

- A fact lives in exactly one file; everything else links to it. A second copy is
  a second thing to keep true.
- English, like the code and the commit messages.
- No frontmatter and no hand-numbered sections: the reading order is here.
- Rationale belongs in an ADR. A convention states the rule and links the reason;
  it does not argue.

## Glossary

| Term | Meaning |
| --- | --- |
| primitive / palette | a raw declared value (`--bk-palette-blue-600`). A reference ramp, not a usage list |
| semantic role | a role in `color.json` read **directly** by a component (`--bk-text-danger`). See R1 in [conventions-tokens.md](conventions-tokens.md) |
| control token | what one component paints, when no role can carry it (`--bk-button-disabled-opacity`) |
| hook | a public custom property a consumer may override (`--bk-button-bg`), declared in `style-dictionary.config.mjs` |
| part | a styling escape hatch exposed through `::part()` |
| invariant | a rule that holds across the codebase and has something enforcing it |
| ADR | architecture decision record — one decision, one file, in [adr/](adr/) |
