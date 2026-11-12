# Documentation

How Brick is put together and why. The root [README](../README.md) covers usage
and is written for consumers; this directory is for whoever changes the kit.

## Read in this order

1. [Token conventions](conventions-tokens.md) — the rules the token layers obey.
2. [0001. Generate the token CSS from JSON](adr/0001-generate-token-css-from-json.md)
   — where the tokens come from, then the four decisions that follow it.

## Documents

| Document | Type | Answers |
| --- | --- | --- |
| [conventions-tokens.md](conventions-tokens.md) | reference | which token rules apply, and what enforces each |
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

## When to update what

| If you change… | Update |
| --- | --- |
| a token, a layer or the pipeline | [conventions-tokens.md](conventions-tokens.md); a new ADR if it is a decision |
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
| semantic role | a role in `color.json` read **directly** by a component (`--bk-color-danger`). See R1 in [conventions-tokens.md](conventions-tokens.md) |
| control token | what one control paints (`--bk-button-primary-bg`). Aliases the palette |
| hook | a public custom property a consumer may override (`--bk-button-bg`), declared in `style-dictionary.config.mjs` |
| part | a styling escape hatch exposed through `::part()` |
| invariant | a rule that holds across the codebase and has something enforcing it |
| ADR | architecture decision record — one decision, one file, in [adr/](adr/) |
