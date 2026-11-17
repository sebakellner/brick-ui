# 0020. The component manifest is generated, and the README renders it

Date: 2026-11-17

## Status

accepted

## Context

A component's public surface is stated three times: in the class, in its `README.md`, and in
the `.mdx` page that renders that README. Nothing keeps the three agreeing, and the failure
is silent — `bk-field` documented three `part`s it never rendered, so `bk-field::part(error)`
styled nothing, and that was found by reading, not by a check. The same surface will have to
be stated a fourth time when a React and a Vue package arrive, which is the point where
hand-writing it stops being merely untidy.

A spike ran `@custom-elements-manifest/analyzer` over the thirteen elements this repository
registers, with the Lit plugin. What it produced, and what it did not:

| Surface                       | Generated today   | Where the fact lives                                             |
| ----------------------------- | ----------------- | ---------------------------------------------------------------- |
| Attributes and properties     | **yes**, complete | the class, decorators and initialisers                           |
| Events                        | no                | `new CustomEvent('bk-change', { detail })` inside a method       |
| Slots                         | no                | the render template — **and the shared controllers it composes** |
| `part`s                       | no                | the same composed template                                       |
| CSS custom properties (hooks) | no                | `style-dictionary.config.mjs`, not the component at all          |

`bk-input` documented eight attributes and the manifest produced those eight plus the one
property that has no attribute (`inputMode`), so the largest slice of the tables is already
free. The other four are empty, because CEM takes them from JSDoc tags (`@fires`, `@slot`,
`@csspart`, `@cssprop`) rather than from code.

The spike also showed why a plugin cannot simply read the rest out of the source: for
`bk-input`, two of its five `part`s and one of its three slots are declared in
`field-messages.controller.ts`, which five elements share. The fact is real and it is in the
source, but it is spread across the composition, so a plugin would have to reconstruct what
the analyzer never builds: the render tree of each element.

Two operational facts that cost time and belong here: `plugins: litPlugin()` — not
`plugins: [litPlugin()]`, which nests the array and is ignored silently, producing a manifest
of zeros that looks like "the analyzer does not support Lit"; and running the analyzer writes
`"customElements": "src/custom-elements.json"` into `package.json` on its own.

## Decision

The manifest is the machine-readable statement of the contract, and the README renders it.

1. **Adopt [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)**
   at `src/custom-elements.json`, produced by `@custom-elements-manifest/analyzer` with its Lit
   plugin. It is **committed**, like the generated token CSS, and CI regenerates it and fails
   when the committed file is stale — the same gate shape the tokens already have.
2. **Attributes and properties come from the code.** No annotation, no hand-keeping: the
   decorators already say it.
3. **Events, slots and `part`s are annotated in the element that publishes them** (`@fires`,
   `@slot`, `@csspart`), not extracted from the composed template. The annotation puts the
   fact where a reader looks for it and where publishing it is a decision; a plugin over the
   composition would be a second implementation of what the controllers already do, and it
   would still need to know which controller each element composes.
4. **The hooks are joined in by prefix** from `style-dictionary.config.mjs`, the file that
   already declares them and that `check:tokens` already reads: every `--bk-<tag>-*` becomes a
   `cssProperties` entry on `<tag>`. A hook is the only surface whose source is the token
   pipeline rather than the component, so it is the only one joined rather than declared.
5. **A check fails when the README and the manifest disagree**: every name in the manifest's
   tables appears in the README's, and every name in the README appears in the manifest. That
   replaces the review that found `bk-field`'s three phantom parts, and it is what makes
   "documented name, tested name" (the rule in
   [conventions-testing.md](../conventions-testing.md) that gives every documented name a case)
   a closed loop rather than three lists kept by hand.

### Alternatives considered

| Alternative                                                       | Why it was rejected                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Annotate everything, including attributes                         | The decorators already carry the attributes, the type and the default. Repeating them in JSDoc is a second copy that can disagree with the class, which is the problem being solved                                                                                              |
| A custom plugin that reads slots and `part`s out of the source    | The declaration is spread across the element and the controllers it composes (two `part`s and one slot of `bk-input` live in `field-messages.controller.ts`). The plugin would have to reconstruct the rendered tree, and would break silently the first time a controller moved |
| Generate the README tables at build time and stop committing them | The README is the contract a consumer reads on GitHub and in Storybook; a generated file that only exists after a build is a contract that is missing on the page where people look for it                                                                                       |
| Adopt Stencil for the wrapper generation instead                  | It replaces the component authoring model to obtain metadata. The metadata format is the useful part, and CEM is that format without the framework                                                                                                                               |
| Keep hand-writing the tables, add only the check                  | Cheaper today and it leaves the fourth language (React, Vue) to be written by hand as well, which is the cost this decision exists to avoid                                                                                                                                      |

## Consequences

Easier: the largest part of the public surface is stated once and cannot drift; a future
package renders the same manifest with its own vocabulary, which is the rule the documentation
conventions already state; the check that a documented name exists and behaves can read one
file instead of three; an IDE or a docs site consumes the same file Storybook does.

Harder: about a hundred JSDoc tags — thirteen elements, one event or none, one to five slots
and `part`s each — are written once and kept as the surface changes; a new `part` is a
decision made in the element rather than an accident of the template; and the committed
manifest means a stale one is a CI failure, not a fixup.

Debt accepted: the prefix join for hooks assumes a hook is named after the element it belongs
to, which is true today and is not enforced yet — the join reports an unmatched hook rather
than guessing. Revisit if a hook ever has to serve two elements.
