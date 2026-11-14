# 0001. Generate the token CSS from tokens/*.json

Date: 2026-11-12

## Status

accepted

## Context

The kit's design values were authored directly as CSS custom properties, in a
hand-written `src/styles/tokens.css` that doubled as the entry point consumers
loaded.

Two problems followed from that.

Nothing connected a component's `var(--bk-…)` to a declared value. CSS drops an
invalid `var()` reference at computed-value time, so a typo or a token deleted
from the stylesheet rendered as nothing: no error, no warning, no failing test —
a blank edge or a missing background. The only possible guard was a validation
script written after the fact, and it would have to know what "declared" means
by duplicating the same list it was checking.

And the values were needed in more than one output format. CSS was the only one
at the time, but a second format meant transcribing every value again by hand,
with no mechanism that would notice when the two drifted.

The practical driver was smaller: pulling a value out of a component and into
the stylesheet was a manual, error-prone edit that no check covered.

## Decision

`tokens/*.json` is the single source of truth for design values. `pnpm
build:tokens` runs Style Dictionary over that directory and writes the CSS under
`src/styles/tokens/` plus `src/styles/tokens.generated.ts`. The generated output
is committed.

How it is wired:

- One Style Dictionary platform per token group, filtered on the first path
  segment (`only('space')`, `only('button', 'input')`), so each generated file
  holds exactly one group and consumers can load only what they need.
- `outputReferences: true` emits aliases as `var(--bk-…)` rather than resolved
  literals. Handling of aliases is [0003](0003-keep-aliases-as-var.md).
- `showFileHeader: false`, so the generated files stay comment-free like every
  other stylesheet in the kit.
- The output is committed, and CI regenerates it and fails on any diff under
  `src/styles` — `git status --porcelain`, so untracked output counts too. A
  token change that was not regenerated is a build failure, not a review catch.

### Alternatives considered

| Alternative                                                         | Why it was rejected                                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the CSS hand-written and add a script that validates the names | The script has to hold its own idea of what is declared, which is the duplication it was meant to prevent. A broken reference stays a review catch until someone runs it, and the validation cannot produce a second output format. |
| Generate at build time only, and stop committing the output         | Consumers load `/src/styles/theme.css` straight from the repository; there is no publish step that could run the token build first. A generated-but-untracked stylesheet would leave the README's instructions broken.              |

## Consequences

Easier:

- A token name that does not exist is now caught by `pnpm check:tokens` and by
  the build, instead of rendering as nothing.
- A second output format is one more platform in `style-dictionary.config.mjs`.
  The TypeScript platform was added that way, with no change to the token
  source: `src/styles/tokens.generated.ts` now carries `TokenName` and
  `HookName` alongside the CSS.
- Renaming a token is one edit in JSON; the CSS and the types follow.

Harder:

- `src/styles/tokens/*.css` appears in every token diff, next to the JSON change
  that caused it. The mistake this arrangement invites is editing the generated
  CSS by hand: the change looks right, passes review, and is silently
  overwritten by the next `pnpm build:tokens`.
- The platform filters are explicit name lists. A group added to `tokens/`
  without its name added to the config is generated into no file at all, with no
  error — the most expensive failure mode here, because it is silent in one
  direction only.
- Two artifacts to commit per token change, and CI fails rather than warns when
  one of them is stale.

Accepted debt: `pnpm check:tokens` matches the names components use against the
declared tokens and the override hooks. It does not read the generated CSS, so a
dangling alias inside `tokens/*.json` is caught by Style Dictionary at build
time, but nothing re-checks the emitted output. Revisit if a dangling reference
ever ships.
