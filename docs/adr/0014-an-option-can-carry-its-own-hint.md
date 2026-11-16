# 0014. An option can carry its own hint

- **Status:** accepted
- **Date:** 2026-11-17

## Context

[0012](0012-a-radio-group-is-a-widget-not-a-container.md) gave the option one part
and the set the messages: each `bk-radio-group-item` carries a
`bk-field-label`, and the description and the error are the group's, because a
message is about the set and nine live regions saying one sentence is nine
announcements. That split is right about validity and wrong about everything an
option has to say for itself. "Three to five working days" is not a message about
the delivery set; it is the reason to pick _this_ option, and a consumer who has to
write it into the group's one description says it once, somewhere else.

The same shape was already inconsistent on the checkbox side. `bk-checkbox` is
its own field: it has a description and an error region of its own, rendered after
its label row, because a box with a label beside it is one option with a
statement. A standalone checkbox therefore carries its own hint, while a radio's
option could not, even though both are one row with a box and a label.

There was also a layout fault to settle on the way. Both components render the
label row as a flex row — the box, the gap, the label text — and the message
regions after it. Rendered from the row's left edge, the text of a description
starts under the box and reads as a second, unrelated column. The label text is
what the description is about, so the description has to start where the label
text starts.

## Decision

**An option carries its own hint, and validity stays with the set.**

- `bk-radio-group-item` gains a description slot: a `bk-field-description` written
  inside the item is the item's hint. The item assigns `slot="description"` to the
  atoms it owns, so the consumer writes the atom with no `slot` attribute, exactly
  as inside a `bk-field` ([0009](0009-nest-the-field-parts-inside-the-control.md))
  or a group ([0010](0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md)).
  An atom of one item is never the surrounding group's: `FieldRegionsController`
  stops at the nearest control or container, and the item is the control there.
- The item takes **no error region**. There is no `error` slot and no `error`
  property on it: the set is what is valid or invalid, and a per-option error
  would put N live regions where one fact belongs
  ([0012](0012-a-radio-group-is-a-widget-not-a-container.md)).
- A hint with no text takes no space. The region is hidden while the item owns no
  atom with text, so a column of options is as tight as its labels, and a hint
  that arrives or is filled later appears without a re-render the consumer
  performs.
- **The message block starts where the label text starts.** In both components
  the block is indented by the box plus the row gap, read from the component's own
  size hook: `var(--bk-checkbox-size, var(--bk-checkbox-variant-size))` and
  `var(--bk-radio-group-item-size, var(--bk-radio-group-item-variant-size))`, each
  plus `--bk-space-2`. One value paints the box and indents the block, so a
  consumer who resizes the box keeps the alignment. On the checkbox both regions
  are indented, because a description and an error are one block about one box.
  The rule is each component's own and never the shared sheet: `bk-input` puts its
  label above its control and must not gain an indent.

## Alternatives considered

| Alternative                                          | Why it was rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the hint on the group only                      | It is the shape 0012 chose and the reason this record exists: one region for one set is honest about a message _about the set_, and a hint that distinguishes the options is not one. Written on the group, "three to five working days" cannot say which option it belongs to, and a consumer with three different lead times would need three descriptions for a group that has one message slot.                                                                         |
| An error region per item                             | It moves validity to the option, where nothing can enforce it: an item is form-inert, has no `value` it can submit and no constraint it can report, so a red line under one box would promise a rule nothing checks. It also multiplies live regions — nine for a set — which 0012 rejected for the same reason.                                                                                                                                                            |
| A `hint` string property on the item                 | It is the smaller API, and it contradicts the kit's authoring model: every message in the kit is an atom (`bk-field-description`, `bk-field-error`) so that a consumer can put markup — a link, a code — inside it, and a string property would either render text that cannot be slotted or force the item to invent its own text region. It would also skip the description atom's own typography and its `data-empty` behaviour, which the item would have to reproduce. |
| No description on the item, a wider `bk-field-label` | Writing the hint into the label is the workaround this record removes: the label names the radio, its text joins the accessible name, and a two-sentence label makes every option's name a paragraph. The description stays a sibling of the name, not part of it.                                                                                                                                                                                                          |
| Aligning the block with the box's left edge          | Cheaper — no arithmetic, no hook — and it reads as a second column starting under the box, which is what the request that produced this record asked to change. It also breaks the moment a consumer resizes the box, because the block would keep its own left edge.                                                                                                                                                                                                       |

## Consequences

The pair now has two message channels and they are not the same one: the item's
description is the option's, the group's description and error are the set's. A
consumer who writes the atom in the wrong place gets no error — a
`bk-field-description` inside an item is never adopted by the group, and one
inside the group is never adopted by an item — so the markup is the contract and
the README is where it is stated.

The item writes on its own atoms only: the slot attribute, and nothing else. It
sets no id, no `role` and no `data-empty` on them, because the atom is content and
not a region that anything references — the radio's `<input>` is inside the item's
shadow root, so the hint cannot be its `aria-describedby`
([0009](0009-nest-the-field-parts-inside-the-control.md) is the same tree rule).
The hint is read where it is, next to the option; a consumer who needs it
announced has to state it in the label.

The most likely mistake this invites is treating the item's description as a
second error channel: it is a region shaped like the field's, styled by the same
shared `.message`, and an author who writes a `bk-field-error` inside an item gets
a node that nothing adopts, nothing announces and nothing blocks on. The group is
still the only place an error can be shown, and the README says so twice.

The indent is computed from the hook and not measured, so a consumer who paints
the box with something other than `--bk-checkbox-size` /
`--bk-radio-group-item-size` — a `::part(box)` rule, say — breaks the alignment.
That is the same trade the hooks already make for the box itself: one value, one
owner.

It gets revisited if a set ever needs a message that is neither about the set nor
about one option, or if `shadowroot.referencetarget` reaches every engine and a
hint is referenced directly: the region the item renders and the input it describes sit in the
