# 0010. A group is named on its host, and its atoms are the regions

- **Status:** accepted
- **Date:** 2026-11-15

## Context

`bk-checkbox-group` wraps several `bk-checkbox` elements. A screen reader has to
announce the boundary of the set and its name, and it has to be able to read a
message about the set as a whole. Three facts constrain how:

1. An ARIA IDREF is resolved **within the tree of the element that carries it**.
   The host lives in the document; a region rendered into the host's own shadow
   root is in a different tree, so `aria-describedby` on the host cannot name it.
   This is the same constraint [0009](0009-nest-the-field-parts-inside-the-control.md)
   recorded when it rejected a cross-root reference for the field.
2. Element reflection (`ariaLabelledByElements`, `ariaDescribedByElements`,
   Baseline 2025) removes the IDREF but keeps the tree rule. Measured in Chrome
   in this repository: assigning an element from the host's own shadow root
   yields an empty list, while assigning a document-tree element yields one.
3. `shadowRoot.referenceTarget` would solve it and is Chromium-only. The suite
   runs in Chrome alone ([0005](0005-test-in-chrome-only.md)), so a Chromium-only
   design stays green while losing its name and its description in the engines
   the kit is meant to run in.

The label has no such problem: the consumer writes it as a light-DOM child of the
group, in the document tree, where element reflection works.

## Decision

**The group is named on its host, and the message regions are the consumer's own
atoms.**

- The host carries `role="group"`.
- Its accessible name is the slotted `bk-field-label`, assigned with
  `ariaLabelledByElements`. No id is written for the name and no reference
  crosses a shadow root.
- The group's description and error regions **are** the consumer's
  `bk-field-description` and `bk-field-error` atoms. The group gives them an id
  when they have none, puts `role="status"` on the error atom, marks both with
  `data-empty` while their text is empty, hides the description while the error
  has text, and points its own `aria-describedby` at the error atom or the
  description atom. Every reference now lives in the document tree, so the IDREF
  resolves.
- The group writes only those facts on those nodes: never text, never state a box
  reads, and never anything on a `bk-checkbox`.

This is a **scoped exception to A7** of
[the accessibility conventions](../conventions-accessibility.md), which keeps a
live region on the control's own shadow region and never on slotted content. A7
holds for a control, whose regions and references share one tree. A container has
no such option: the element that must be named is the host, and the host cannot
reach into its own shadow root.

## Alternatives considered

| Alternative                                                                      | Why it was rejected                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regions rendered into the group's shadow root, referenced by IDREF from the host | Does not resolve: the id lives in another tree. The component looks complete and announces nothing, which is the failure [0009](0009-nest-the-field-parts-inside-the-control.md) exists to prevent.                                                                                                                                                               |
| The same, referenced with `ariaDescribedByElements`                              | Also does not resolve: element reflection keeps the tree rule. Measured, not assumed.                                                                                                                                                                                                                                                                             |
| `shadowRoot.referenceTarget`                                                     | Chromium-only; the Chrome-only suite would hide the loss in Firefox and Safari.                                                                                                                                                                                                                                                                                   |
| A group with no shadow root                                                      | It would work, and it was the closest call: the regions would live in the document tree and every reference would resolve. But the component would stop being like every other component here, its styles would land in the consumer's tree, and it would have to be careful not to style the boxes. The atom route keeps one rendering model for all components. |
| No group-level message at all                                                    | Cheapest and honest, but it removes the ability to say "pick at least one" where the user is looking, which is the reason a group is worth building.                                                                                                                                                                                                              |
| Group-level validity (`required`, "at least one checked")                        | Not decided here: `FormControlMixin` is built around one native control, and a cross-control constraint is a separate decision with its own record. The group reports nothing it cannot enforce.                                                                                                                                                                  |

## Consequences

The group writes on nodes it does not own. That is the price of a resolvable
reference, and it is bounded to four attributes on two elements — it never
touches text, and it never touches a box.

An atom that leaves the group loses the `role` and `data-empty` the group gave it,
but keeps the id, so a consumer who moves an atom between groups is not fighting
two writers. An atom that already carries a role of its own is left alone.

The group's own stylesheet gets simpler: no message region to paint, because the
region is the atom, and the atoms paint their own type, colour and empty state.

A group that wants to show its own validity text still cannot: the text is the
consumer's, the group only decides whether it is referenced and whether it is
present. That seam belongs to the form error model, and it is named rather than
hidden.

It gets revisited if `shadowroot.referencetarget` reaches every engine the kit
supports, or if the suite stops being Chrome-only and the tree rule stops being
the only movable part.
