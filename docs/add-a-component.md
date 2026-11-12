# Add a component

Use this to add a third element to the kit. It assumes the token layers are
familiar — read [architecture.md](architecture.md) and
[conventions-tokens.md](conventions-tokens.md) first — and it exists so the next
component does not re-decide any of it.

## Prerequisites

- The component has a native reference. A button, a field, a checkbox: something
  with platform semantics to delegate to. If there is no native element, the
  accessibility bar gets much more expensive, and that conversation comes before
  the first line of code.
- Its tokens exist, or you know which ones to add: [add-a-token.md](add-a-token.md).

## Steps

1. **Tokens.** `tokens/<component>.json` with a top-level group named after the
   component, wired to palette entries. Reuse a semantic role only when it is
   genuinely shared. Register the group in `style-dictionary.config.mjs`, run
   `pnpm build:tokens`, commit the output.

2. **Element.** `src/components/bk-<name>/bk-<name>.ts`: Lit, `delegatesFocus`,
   styles that read tokens with no fallback, a `part` attribute on each thing a
   consumer might need to reach, and a reflected attribute per variant.

3. **Variants, if any.** The public hook is read first and the variant default lives
   in a different variable. That split is what lets an override inherited from an
   ancestor win:

   ```css
   :host {
     --bk-x-variant-bg: var(--bk-x-primary-bg);
   }

   :host([variant='secondary']) {
     --bk-x-variant-bg: var(--bk-x-secondary-bg);
   }

   button /* the inner native element */ {
     background: var(--bk-x-bg, var(--bk-x-variant-bg));
   }
   ```

   If the variant wrote `--bk-x-bg` itself, an inherited override would lose —
   [ADR 0002](adr/0002-require-the-theme.md).

4. **Accessibility.** Not a step to finish later; it is the component. The bar is in
   [conventions-accessibility.md](conventions-accessibility.md), and most of it is
   asserted by the suite.

5. **Tests.** `bk-<name>.test.ts` next to the element, `before(loadTheme)`, and
   assertions on computed styles. See [conventions-testing.md](conventions-testing.md).

6. **Stories.** `bk-<name>.stories.ts` with one story per variant and per state.
   Stories are the only place where a raw `px` is acceptable — scaffolding, not
   design.

7. **Docs.** `bk-<name>/README.md` plus its Storybook page, then add the element to
   the components table in the root `README.md`. Name any limitation you are
   shipping with in the PR description: a limitation written down is a limitation
   someone can fix, and one kept quiet is a bug report six months late.

8. **Check the definition of done** in [AGENTS.md](../AGENTS.md).

## What each component documents

A component's `README.md` states, in this order:

| Section | Content |
| --- | --- |
| Summary | one sentence, what it is for |
| Attributes and properties | each one, its type, its default |
| Events | what fires, when, with what detail |
| Parts | every `::part()` escape hatch and what it reaches |
| Override hooks | every public custom property, read from `style-dictionary.config.mjs` |
| Limitations | what it does not do yet |

The Storybook page is the same document, rendered live. It is not a second place
to maintain the API: it reads this file.

## Verify

- `pnpm test`, `pnpm typecheck`, `pnpm check:tokens` all green.
- The new element appears in the root README table and in Storybook.
- A keyboard-only pass: tab to it, focus ring visible, `aria-disabled` controls
  reachable and inert.
- Every new token is read by the component, and every new name resolves: the suite
  and `check:tokens` say so.

## Related

- [conventions-accessibility.md](conventions-accessibility.md)
- [conventions-testing.md](conventions-testing.md)
- [0002](adr/0002-require-the-theme.md) — why there are no fallbacks
