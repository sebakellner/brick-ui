# Add a component

Use this to add the next element to the kit. It assumes the token layers are
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

1. **Tokens, if the component needs its own.** A component file
   (`packages/tokens/tokens/component/<component>.json`) exists only when something must be themable per
   component; a control that paints roles and needs one geometry value gets a **hook** in
   `packages/tokens/style-dictionary.config.mjs` with a primitive default instead
   (`--brikka-input-radius`).
   Reuse a semantic role when it is genuinely shared. Whatever you add: run
   `pnpm build:tokens` and commit the output.

2. **Compose, don't copy.** Decide what the component _is_ before writing its element. The
   shared layer answers most of it, and copying the nearest component is how this kit grew two
   versions of the same anatomy twice:

   | You are building                                                 | Compose                                                                                                               |
   | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
   | a control with one native anchor (`input`, `select`, `textarea`) | `FormControlMixin` + `FieldControlMixin`, `static styles = [formControlStyles, …]`, and override `formControlElement` |
   | a control whose constraint no native anchor reports (a group)    | the same two, plus `fieldConstraint` to state the flags and the message                                               |
   | a container announced as a set (checkbox group, radio group)     | `FieldRegionsController` — it names the host and adopts the consumer's atoms as the regions                           |
   | anything that must know whether slotted content has text         | `SlottedTextController`                                                                                               |

   The layers, and what each assumes of its host, are listed in
   [CONTRIBUTING.md](../CONTRIBUTING.md#how-a-field-is-built).

3. **An atom is public; a part is private.** Both are elements, and the difference is who may
   compose with them:

   - an **atom** is shared vocabulary — `brikka-field-label`, `brikka-field-description`,
     `brikka-field-error`. It is exported from `src/index.ts`, registered by its own `define.ts`,
     documented in its own README, and any component may compose with it.
   - a **part** works inside one component only — `brikka-radio-group-item`,
     `brikka-native-select-opt`. It is registered by that component's `define.ts` (a markup part
     whose tag nobody defined would stay inert), **not exported** from the package entry, and
     documented as a section of the parent's README.

   The test is one question: would a second component compose with it? If yes it is an atom;
   if it only makes sense inside one, it is a part.

4. **Element.** `packages/web-components/src/components/brikka-<name>/brikka-<name>.ts`: Lit, `delegatesFocus`, styles that
   read tokens with no fallback, a `part` attribute on each thing a consumer might need to
   reach, and a reflected attribute per variant.

5. **Variants, if any.** The public hook is read first and the variant default lives in a
   different variable. That split is what lets an override inherited from an ancestor win:

   ```css
   :host {
     --brikka-x-variant-bg: var(--brikka-x-primary-bg);
   }

   :host([variant='secondary']) {
     --brikka-x-variant-bg: var(--brikka-x-secondary-bg);
   }

   button /* the inner native element */ {
     background: var(--brikka-x-bg, var(--brikka-x-variant-bg));
   }
   ```

   If the variant wrote `--brikka-x-bg` itself, an inherited override would lose —
   [ADR 0002](adr/0002-require-the-theme.md).

6. **Accessibility.** Not a step to finish later; it is the component. The bar is in
   [conventions-accessibility.md](conventions-accessibility.md), and most of it is asserted by
   the suite.

7. **Tests.** `test/brikka-<name>.test.ts` (the component's `test/` folder holds every suite it
   ships) and assertions on computed styles. No registration suite: `package.json` declares
   `"sideEffects": ["**/define.js", "**/define.ts"]` and the suite proves registration by
   using the element.
   See [conventions-testing.md](conventions-testing.md), T8.

8. **Stories.** `brikka-<name>.stories.ts` with one story per variant and per state, and a
   `title` that states the kind of component it is: `Form/<Name>` for anything that takes
   part in a form, with the component's own name in Title Case (`Form/Checkbox Group`,
   `Form/Native Select`). The sidebar groups by that first segment and sorts inside it.
   Stories are the only place where a raw `px` is acceptable — scaffolding, not
   design.

9. **Docs.** `brikka-<name>/README.md` plus its Storybook page. Name any limitation
   you are shipping with in the PR description: a limitation written down is a
   limitation someone can fix, and one kept quiet is a bug report six months
   late.

10. **Check the definition of done** in [AGENTS.md](../AGENTS.md).

## What each component documents

The sections, their names and their order are fixed in
[conventions-docs.md](conventions-docs.md), in "The README sections are a fixed set, in a
fixed order", which also names the README to start from. This document does not repeat
that list: a second copy is a second thing to keep true, and the copy that used to live
here had already lost two sections. The Storybook page renders the same file, so it is
never a second place to maintain the API.

## Verify

- Every gate in the [definition of done](../AGENTS.md#definition-of-done) is green. A
  component that fails `check:readmes` is one whose README and manifest disagree, which
  no test catches, so it is worth knowing that the check exists before the merge rather
  than after it.
- The new element has its own `README.md` and a Storybook page. The root README's
  documentation table reaches it through the `packages/web-components/src/components/*/README.md` row, so nothing
  is added to the root README per component — the component's own README is what has to
  exist.
- A keyboard-only pass: tab to it, focus ring visible, `aria-disabled` controls
  reachable and inert.
- Every new token is read by the component, and every new name resolves: the suite and
  `check:tokens` say so.

## Related

- [conventions-accessibility.md](conventions-accessibility.md)
- [conventions-testing.md](conventions-testing.md)
- [0002](adr/0002-require-the-theme.md) — why there are no fallbacks
