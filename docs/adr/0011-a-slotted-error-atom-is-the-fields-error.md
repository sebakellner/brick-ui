# 0011. A slotted error atom is the field's error

Date: 2026-11-15

## Status

accepted; superseded in part by
[0013](0013-a-group-enforces-at-least-one-and-nothing-else.md)

## Context

`bk-input` and `bk-checkbox` render one `role="status"` region. Its content comes
from one of three sources: the `error` property, the browser's native message,
or a consumer's `bk-field-error` atom. The first two are the field's error — they
set `aria-invalid="true"` and take part in constraint validation as
`customError`. The third only painted.

Measured on a `bk-input` holding
`<bk-field-error>That address looks wrong.</bk-field-error>` and no `error`,
before this decision:

- the region showed the atom's text, because the slot projects it;
- the inner `<input>` carried no `aria-invalid`, so nothing told assistive
  technology the field was broken;
- `ElementInternals.validity` was empty, so `form.checkValidity()` returned
  `true` and the submit went through.

What was on screen and what the form enforced disagreed, and the disagreement
ran in the direction that loses the user's work: the consumer had written the
message, the field looked rejected, and the form submitted it. The same seam had
a second shape: with the property and the atom both set, the region showed the
atom's text while `aria-invalid` and `validationMessage` came from the property,
so a screen reader announced a sentence nobody could see. `bk-field/README.md`
documented the duplicate as the way to write an invalid field — the atom for the
text, the property for the state — and left the ownership decision open.

The atom also broke the region's own contract: `aria-describedby` was written
from _assignment_, so an empty `bk-field-error` was referenced as the
description of a region with nothing in it (A4 of
[the accessibility conventions](../conventions-accessibility.md)).

## Decision

**A slotted `bk-field-error` with text is the field's error, not decoration.**

- That text is the field's message: it is what the region shows, it sets
  `aria-invalid="true"` on the native control, and it participates in constraint
  validation as `customError` with that text as the validation message, so it
  blocks a submit exactly as the `error` property does.
- The atom wins over `error` while both carry text, because markup is the more
  specific statement, and the property comes back when the atom's text goes.
- An atom with no text is not content: no `aria-describedby` reference, no
  invalidity. Content means text, for both regions.
- The control observes the nodes assigned to the `error` slot — `characterData`
  and `childList`, the shape `bk-checkbox-group` already uses for the same
  reason — because a consumer editing an atom in place fires no `slotchange`.
  The observer lives once, in `FieldMessagesController`, so the group and the
  controls share it instead of each carrying a copy.

`FormControlMixin` gained one extension point for this: `fieldError`, which
returns `error` for every control and is widened to `slotted atom text || error`
by the two controls that render message slots. `fieldInvalid` and the
`customError` in `syncFormValue` read `fieldError`, so a single source decides
what is displayed and what is enforced.

### Alternatives considered

| Alternative                                                                  | Why it was rejected                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The atom stays decoration and only `error` reports validity (the status quo) | It is two sources of truth for one fact. The consumer has to write the sentence twice — once in markup for the display, once in a property for the state — and the audit found the two already drifting: text on screen with `aria-invalid` off, or an announcement of a property whose text was hidden behind the atom. A component that shows a problem and submits the form is worse than one that shows nothing. |
| An atom is allowed only outside a control, where it is structure             | Then a message _inside_ a control has no legal shape, and the markup a consumer reaches for first is a silent no-op: the element looks identical, renders identically, and enforces nothing. The element that is form-associated is the control; a wrapper cannot report validity for it.                                                                                                                            |
| The property is the only source: drop the atom from the error slot           | The components are markup-first — the label and the description are atoms, not attributes. Dropping the atom would send every schema or server message through JavaScript, because there would be no way to write one in the template, and a page that ships its message in HTML would lose it.                                                                                                                      |
| Derive the message from the host's light DOM (`textContent`)                 | That reads the label and the description too, so the message would become the whole field. Only the nodes assigned to the `error` slot are the error region's content, and the same read serves the A4 reference and the atom's invalidity.                                                                                                                                                                          |
| A `presentational` attribute on the atom, so decoration stays possible       | It would make the invalidity of a field depend on an attribute the form never sees, which is the shape this decision removes: another statement about validity that does not reach `validity`. Skipped rather than deferred, because nothing in the kit needs a red caption today.                                                                                                                                   |

## Consequences

One sentence in the markup now states the display, the state and the constraint,
so `error` and a `bk-field-error` cannot disagree. The audit's A4 finding closes
with it: an empty atom is neither referenced nor invalid, and `aria-describedby`
names a region only while that region has text.

The cost is named in the decision and accepted: **markup now declares
invalidity**. A decorative atom is not a thing. The component cannot tell "a red
caption" from "a rejected field", because both are a `bk-field-error` with text,
so a consumer who wants danger-coloured text that blocks nothing has no shape
for it. That is a real limitation of the element, not an oversight; it is why the
element is called `bk-field-error`.

Two smaller consequences follow from the atom being the consumer's node:

- The DOM `input` event clears the `error` property and nothing else. It does
  not empty the atom, because the text is not the component's to write: the
  consumer owns the node and removes or empties it. A field whose atom carries
  text is therefore invalid until its owner says otherwise — the observer is what
  makes that state live rather than stale.
- Several atoms in the `error` slot with text are read as one message, in
  document order. The field does not pick one, and it does not merge meanings;
  writing two errors is reading them both out in one region.

`bk-checkbox-group` keeps its own region logic and reports no validity of its
own, so it keeps its own description/error decision. The observer is the part
both needed, and that part is shared.

It gets revisited if the kit needs a message that is deliberately not a problem —
a `bk-field-hint` would be a separate element with its own slot, not a mode of
this one — or if `valueMissing`-style platform rules need to be combined with the
atom's text rather than replaced by it.
