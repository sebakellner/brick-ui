# 0009. Nest the field parts inside the control

Date: 2026-11-14

## Status

accepted

## Context

Every control carried its own field. `BkInput` declared `label` and `helper` as
strings and rendered a `<label for=${this.controlId}>` and a message region
around its `<input>`, and a second control would have copied that template; a
consumer had no way to put anything but a string in either position.

The request that started this work was a composable field — a `Field` with
`FieldLabel`, `FieldDescription` and `FieldError`, so labels and messages leave
the controls and a form is written as elements. That shape is the one shadcn ships
for React and the one React Aria composes with, and it is what `odd/tasks/bk-field.md`
records as S1: four siblings inside `bk-field`.

The platform decides which of the two shapes a field can carry, and the facts are
in the code that already shipped:

- `bk-input` builds its reference inside its own shadow root: `for=${this.controlId}`
  on the `<label>`, `aria-describedby=${describedBy}` on the `<input>`, both ids
  generated per instance. A `<slot>` only sees the host's own light children, so
  an atom written as a sibling of the control never arrives at the control at all.
- A cross-root IDREF — `for` or `aria-describedby` pointing into another root —
  is not possible today. An id in the host document does not resolve against an
  element inside a shadow root.
- `Element.ariaLabelledByElements` (Baseline 2025) names the element it is set on.
  Set on the `<bk-input>` host, it names the host, not the focused inner
  `<input>` that a screen reader lands on; the input stays unnamed.
- `shadowroot.referencetarget` does forward IDREFs into a shadow root, and it is
  the one platform feature that would make the flat shape work. It shipped in
  Chrome and Edge 152 (August 2026), is not in Firefox, and
  [0005](0005-test-in-chrome-only.md) keeps the suite on Chrome only. A
  Chromium-only shape would therefore stay green while going silent in every
  other engine, and nothing in the suite would report it.

## Decision

The parts are nested inside the control, and that is the only public shape:
`bk-field` wraps a control, and `bk-field-label`, `bk-field-description` and
`bk-field-error` are children of that control. `bk-field` carries no role.

`bk-field` does three things: it stacks label, control, description and error in a
fixed order; on `slotchange` it assigns `slot="label"`, `slot="description"` and
`slot="error"` to the parts it recognises by tag; and it reflects its `invalid`
boolean into `data-state="invalid"` on those parts. It never computes an
accessible name, never carries `aria-invalid`, and never reads the control's
validity. The three atoms are presentational: typography and colour from semantic
roles, no logic, and they work outside a field.

The reference stays inside the control's shadow root — the `<label for>` and the
message regions remain in the control's own template, and the consumer supplies
their content through the slots. `invalid` is the consumer's, or their form
library's, to set.

### Alternatives considered

| Alternative                                                             | Why it was rejected                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The flat shape, with `role="group"` on the field as a portable floor    | It is the shape S1 asked for, and `role="group"` is the only thing that can be said about a field whose parts are siblings. A group of one is announced as a group of one, and the input inside it still resolves to no label and no description: the degradation is presented as a design, and it is invisible in a screenshot.                             |
| Re-parenting the atoms into the control from `bk-field` on `slotchange` | It works in every engine, and it was the closest call: `bk-field` would move each atom into the control's light DOM, where the control's slots find it. But the DOM then stops being what the consumer wrote — `querySelector` from the page, `::slotted` styling and any form library walking the light DOM all see a tree that silently rearranged itself. |
| `shadowroot.referencetarget` alone, keeping the flat shape              | The feature exists for exactly this problem, and using it would let the consumer write four siblings. It shipped in Chrome and Edge 152 (August 2026) and not in Firefox, and [0005](0005-test-in-chrome-only.md) means the suite cannot notice the difference: the field would be green in CI and unnamed for Firefox and Safari users.                     |

## Consequences

The label and the message regions stay in the control's template, so `for` and
`aria-describedby` are ids in the same root as the input. That is the property
that makes A4 robust: the reference is resolved by the same tree that renders the
region, in every engine.

The nesting is what lets `label` and `helper` be removed later. Their content now
arrives through slots, so the properties are fallback content rather than the only
way to label a field — the removal is a deletion, not a rewrite of the association.

The `label` slot sits inside the control, so where the label goes is the control's
decision; a control that puts its label beside the box instead of above it can
still do so, which a field-level layout could not express.

The `bk-field-error` atom has no validity plumbing: its text does not reach the
control, so an invalid field is written with the atom and the control's `error`
property together. That seam is accepted here and belongs to the form-error model.

The mistake this invites is writing the atoms as siblings of the control, which
looks right and renders right. Nothing in the platform reports the missing
association, and nothing in the suite can either — the components are only as good
as the markup they are given. The published examples and the stories are the only
place the shape is stated, which is why they all show the nesting.

It gets revisited when `shadowroot.referencetarget` reaches every engine the kit
supports, or when the suite stops being Chrome-only and a flat shape can be
verified where it would break.
