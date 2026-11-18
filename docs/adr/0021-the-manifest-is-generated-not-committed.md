# 0021. The manifest is generated, not committed

Date: 2026-11-17

## Status

accepted. Supersedes in part
[0020](0020-the-component-manifest-is-generated-and-the-readme-renders-it.md): the manifest
is still generated from the code by the analyzer with its Lit plugin, and the split of what
comes from the code, what is annotated and what is joined by prefix still holds. What falls
is the earlier clause that it is committed and that CI fails when it is stale.

## Context

[0020](0020-the-component-manifest-is-generated-and-the-readme-renders-it.md) decided the
manifest would be committed, like the generated token CSS, with a CI step that fails when
regenerating it produces a different file. Three facts killed that clause within the hour:

- **The file is 198 KB and 5,800 lines.** A candidate containing it can never be reviewed:
  the review provider answers `lens_context_budget_exceeded` and creates no authority, which
  means every future change to a component surface — the change that touches the manifest —
  would be un-reviewable. The token CSS is forty lines a human can read in a diff; this is
  not that.
- **The analyzer's output was not deterministic.** `modules` came back in filesystem order,
  so two runs of the same source produced two files and the staleness gate could never have
  been green. A normaliser fixes it, but a generated file that needs a normaliser to be
  committable is telling you what it is.
- **The libraries that ship this format do not commit it.** Shoelace, Spectrum Web Components
  and Material Web all commit their analyzer configuration and none commits the result;
  Spectrum versions the change as _"publish custom-elements-manifest"_, so the file is born in
  the build and travels in the published package.

## Decision

The manifest is build output. `custom-elements-manifest.config.mjs` is committed, because it
is source; `src/custom-elements.json` is ignored by git, produced by `pnpm build:manifest`, and
belongs to the package rather than to the repository.

CI **runs** the generation rather than comparing against a committed copy: if someone breaks a
`@property` or the analyzer stops understanding the source, the step fails. It verifies the
pipeline, not the contents of a file nobody reads.

## Consequences

Easier: the candidate a reviewer sees is the configuration and the plumbing, not 5,800
generated lines; there is no staleness to keep; and the generated file cannot drift from the
code because it does not exist until something builds it.

Harder: a reader of the repository cannot open the manifest without running the command —
and neither can a tool that expects the file to be present in a checkout. When the package is
published, the file ships in it and that is where consumers, IDEs and Storybook find it, which
is also how the three libraries above behave.

Debt accepted: until there is a published package, Storybook and editors get the manifest only
from a local `pnpm build:manifest`.
