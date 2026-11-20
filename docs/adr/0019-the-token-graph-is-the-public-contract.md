# 0019. The token graph is the public contract

Date: 2026-11-17

## Status

accepted

## Context

Themes are configured by writing token values, so the token graph is already the surface a
consumer touches: R4 in [conventions-tokens.md](../conventions-tokens.md) says a rename is a
breaking change, and R6 says a component reads a role for colour and a primitive for
everything else. Both were decided while solving a local problem, and neither says what
"breaking" obliges anyone to do.

The last time names moved, sixteen of them went at once: the whole control tier
(`button.{primary,secondary,ghost}.{bg,bg-hover,fg,border}`, `input.{bg,color,label-color,border-color}`)
was deleted because a second tier meant two ways for a component to reach a colour, and the
role that should have answered the question was one hop further from the reader. The removal
was correct and it left `--brikka-button-disabled-opacity` as the only component token, because
opacity is not a colour. A consumer who had themed any of those sixteen tokens got a silently
different page.

That was affordable while nothing was published. It stops being affordable the moment a
consumer writes the token names into their own theme file — and a configuration layer that
chooses values per application type is exactly that consumer. When it arrives, the thing it
addresses is the primitives and the roles: a density axis moves `space`, a motion axis moves
`transition`, a brand moves `palette`. Merging two primitives that mean different things, or
splitting one that means two, is a rename of everything downstream — and it is far cheaper
to decide now than after twenty components read the merged name.

## Decision

The token graph is versioned public API. Four properties of it are now decisions rather than
conventions of the moment:

1. **A token name is API.** Renaming or removing one is a breaking change once the package is
   published, and it needs a migration path — an alias, or a release note that names the old
   token and its replacement. Until then it needs a row here and a suite that still passes;
   after, it needs both plus the note.
2. **Colour reaches a component only through a semantic role** (R6, enforced by
   `pnpm check:tokens`). The component tier stays at the one token that carries a value no
   role can express, `--brikka-button-disabled-opacity`, and a new component token needs the same
   justification: it is not a colour, and no role answers it.
3. **A component never carries a literal** (ADR 0004). A value that is not a token cannot be
   configured, and the graph above is only a contract if every painted value is in it.
4. **A primitive means one thing and holds one axis.** `space` is rhythm, `control-height` is
   the size of a target, `focus-ring-width`/`focus-ring-offset` are the focus geometry,
   `transition` is motion. A new axis gets a new primitive; it never reinterprets an existing
   one, and two primitives are never merged because they happen to hold similar numbers
   today.

### Alternatives considered

| Alternative                                                   | Why it was rejected                                                                                                                                                                                                   |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One density multiplier scaling the whole interface            | A single factor shrinks the target and the focus ring with the rhythm, which breaks the accessibility bar A2 pays for. The separation in property 4 exists so density can move rhythm alone                           |
| Reintroduce a per-component token tier for convenience        | It was removed once for a reason: two reachable paths for one colour means a theme can be half-applied, and the reader cannot tell which value paints. The one surviving token is the exception that proves the shape |
| Adopt the DTCG `$value`/`$type` format now                    | It changes the file shape without changing a single resolved name, so it buys portability to other tools and nothing else. It is a migration to do with a reason, not to bundle here                                  |
| Leave the token graph as an unpublished implementation detail | It is already public: the generated CSS is the theming entry point, and every component reads those names. Calling it private would only mean renaming it without warning                                             |

## Consequences

Easier: a configuration layer has a stable surface to address; a rename becomes a visible
decision with a cost instead of a refactor inside a file; a new dimension of theming has an
obvious home, and the check that enforces the colour direction already exists.

Harder: renaming a token now needs an alias or a note, so cleaning up a bad name costs more
than editing two files; and adding a dimension means adding a primitive file rather than
reusing one, which is more tokens to read.

Debt accepted: no tooling emits the alias or the release note for a rename — it is a
checklist item, and R4's enforcement is still review. Revisit when the package is published,
or when the first configuration layer addresses these names, whichever comes first.
