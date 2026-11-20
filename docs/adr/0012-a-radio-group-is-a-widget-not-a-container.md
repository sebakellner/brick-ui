# 0012. A radio group is a widget, not a container

Date: 2026-11-16

## Status

accepted; superseded in part by
[0013](0013-a-group-enforces-at-least-one-and-nothing-else.md) and in part by
[0014](0014-an-option-can-carry-its-own-hint.md)

## Context

The kit had one group, and it was a container. `brikka-checkbox-group` names itself
on its host and lets the consumer's atoms be its regions
([0010](0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md)); it
holds no value and no validity, because checkboxes are independent and a
container that coordinated them would invent a contract the form does not have.

A radio group is the other case, and the platform says so. Its radio button
group is not a set of independent controls: several `<input type="radio">` with
one `name`, in one tree, are mutually exclusive, share one tab stop, move with
the arrow keys and submit one value under that name. The radio is a button; the
group is the widget.

None of that reaches these components. `brikka-radio-group-item` renders its own
`<input type="radio">` inside its own shadow root — the input is `part="input"`,
inside the `<label>` the element paints — and the specification groups radio
buttons by tree. Two items with `name="size"` would therefore be in
different trees and the platform could not group them: nothing would stop both
being checked, each inner input would be its own tab stop, and the arrows would
only scroll the page. That is why the radio has no `name` at all, and why
everything a radio group means has to be written here.

What to write is constrained by what already exists:

- **One form participant, one value.** `FormControlMixin` associates one element
  with the form through `ElementInternals`, submits one `submittedValue` and
  reports one `ValidityState`. It is built around one native anchor
  (`formControlElement`) — the input whose `validity` and `validationMessage` it
  forwards — and a radio group has no such anchor.
- **The regions are the consumer's atoms, on the host, in the document tree**
  ([0010](0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md)).
  The group can name itself and point at a description and an error, but it
  cannot render a region of its own and cannot write text into one.
- **A field's parts are nested in the control**
  ([0009](0009-nest-the-field-parts-inside-the-control.md)), and the label is the
  part that names it.

## Decision

**The group is the widget and the box is a private part of it, and the asymmetry
is the contract.**

- `brikka-radio-group` is form-associated: `role="radiogroup"` on the host, one
  `value`, the validity of that value, the tab stop and the keyboard.
  `brikka-radio-group-item` is a plain element with no form association, no `name`, no
  `submittedValue`, no validity and no message region. It carries what it paints
  — `checked`, `disabled`, `value` — and nothing it owns.
- **The box is a private part of the group.** `brikka-radio-group-item` lives in
  `src/components/brikka-radio-group/`, is registered by the group's `define.ts`
  beside the group's own tag, and is not exported from the package entry: only
  `BrikkaRadioGroup` and the orientation type are. It stays a custom element because
  each box needs its own shadow root and its own slotted label atom, and it is
  not a component because a radio that only works inside its group is not a
  shared atom like `brikka-field-label`: exporting it promises a use that does not
  exist. The registration is the group's rather than the consumer's for the same
  reason a component's is: a markup `<brikka-radio-group-item>` whose tag was never
  defined would stay inert, which is worse than the problem the privacy solves.
  A public hook cannot be named after a private element's short name, so the box
  is painted through `--brikka-radio-group-item-size` and
  `--brikka-radio-group-item-radius`.
- **The group is the only writer of the selection.** It holds `value`, and on
  every update it writes `checked` on each item. An item reports an activation
  with `brikka-change` and re-syncs its inner input from its own property on the next
  update, so an item that is clicked outside a group does not stay checked. One
  owner, one transition, and `reset()` has one state to put back.
- **The group owns validity.** `required` is the group's, and with nothing
  selected it reports `valueMissing` through `ElementInternals`, blocks the
  submit and reports `invalid` at the host. The message is the consumer's
  `error` — the property or a slotted atom with text — or the fixed English
  `Please select an option.`; a component does not translate.
- **The parts split with the ownership.** Each radio carries its own
  `brikka-field-label`, which names that button and nothing else. The description and
  the error belong to the group, because a message is about the set: two live
  regions for one fact is two announcements of the same sentence, and a per-button
  error region would be nine of them.
- **The keyboard lives in the group.** The inner inputs are in shadow roots, so
  no platform keyboard model applies; the group listens for the composed
  `keydown`, moves focus and selection together on both axes, wraps at the ends,
  jumps with `Home`/`End`, skips a disabled radio and prevents the default
  scroll. `orientation` decides the layout and not which keys work, so a user is
  never trapped by a wrong guess about the axis.
- **The roving tab stop travels as a property.** The group sets `tabStop` on the
  `brikka-radio-group-item` host, which the item reflects to its inner input's
  `tabindex`. The group never reads into a shadow root: the item's internals stay
  the item's, and the boundary the checkbox group's S6 draws is restated for a
  widget that legitimately has to coordinate. `tabStop` has no attribute because
  it is not a public state a consumer writes — the group computes it from the
  selection and from `disabled` on every update.
- **`FormControlMixin` grew one extension point.** A protected `fieldConstraint`
  lets a control state a constraint no native anchor reports; it is read before
  the anchor, and `syncFormValue` hands its flags and message to the same
  `setValidity` call the rest of the mixin uses. The group states `valueMissing`
  there. Nothing simulates a native input: no hidden anchor is rendered, no
  `formControlElement` is faked, and every control that states no constraint keeps
  the existing path unchanged.

The accessibility shape follows [0010](0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md)
without a new exception: the name is the slotted `brikka-field-label` assigned with
`ariaLabelledByElements`, the description and error are the consumer's atoms with
the id, `role="status"` and `data-empty` the group gives them, and the host points
`aria-describedby` at whichever of them has text. `aria-invalid` follows what is
displayed — an `error` or an atom with text ([0011](0011-a-slotted-error-atom-is-the-fields-error.md))
— and never a missing value that nothing on screen states.

### Alternatives considered

| Alternative                                                                | Why it was rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A form-associated radio element                                            | It is the platform's shape — one `<input type="radio">` per button, the form groups them by `name` — and it is exactly what the shadow root breaks. Each radio would submit its own entry under the shared name, and nothing would guarantee only one was checked. Mutual exclusion would still have to be written, so the kit would carry a group anyway, and it would carry two sources of truth for one value: N form participants that each believe they own the selection. |
| A public, exported radio element                                           | Kept public, the element promises a use outside the group, and there is none: no consumer can make a lone box hold a selection, submit it under a name or reach it with the arrow keys, so every use outside the group is a bug the documentation would have to talk the reader out of. There is also nothing outside the group to sell it to — a form needs a set of options, and the set is the widget.                                                                       |
| A data-driven `items` array on the group                                   | `items=${[...]}` would remove the private tag from the markup, and it breaks the kit's authoring model: every other part is markup a consumer writes and the label is a slotted atom (`brikka-field-label`), so a group fed by strings would have to invent a label API of its own, render labels it cannot slot, and lose per-option markup for anything the array does not model. Markup is the contract, and the box is markup.                                              |
| Rendering the boxes inside the group's shadow root                         | It is impossible rather than rejected: a slotted label atom cannot reach a part that does not exist in the light DOM. A `brikka-field-label` with `slot="label"` has to sit inside the element that slots it, so a box rendered inside the group's shadow root would have no label to slot and no label to be named by.                                                                                                                                                         |
| Keeping the item public but undocumented                                   | An undocumented public tag is a trap, not a shortcut: the export would still be there, the README would have to explain a component it never documents, and the first consumer to reach for it would find out from a bug report that its only correct context is one container. Private and documented as a section of the group is the honest pair.                                                                                                                            |
| Each radio owning `checked`                                                | The state would have two writers: a radio setting itself checked would have to unset its siblings, which means every radio knowing every other one, and the group's `value` would be a derived read that can disagree with the boxes. Reset, restore and `required` all need one owner, and the keyboard needs the same list the transition does.                                                                                                                               |
| No group-level `required`                                                  | Then "pick one" is expressible only in JavaScript, and the group degrades to a container with a scrollable keyboard. `brikka-checkbox-group` deliberately declares no `required` because "at least one checked" has no native vocabulary; a radio group's required is the platform's own `valueMissing`, and refusing it would be refusing the rule the platform already names.                                                                                                 |
| A structural group like `brikka-checkbox-group`                            | It is the closest shape and the one that cannot be: a checkbox group submits N keys, one per checked box, and coordinates nothing; a radio group submits one key, and its buttons are mutually exclusive. A structural group cannot own the value, cannot express "exactly one", cannot decide the tab stop and cannot skip a disabled radio for the keyboard. A group of one value is a widget.                                                                                |
| A hidden native anchor in the group, keeping the `formControlElement` path | The mixin forwards a native control's `validity` and `validationMessage`; a hidden `<input>` or `<select>` in the group's shadow root would satisfy that shape without touching the mixin. It would also add a second control to keep in step with the slotted radios, and its message would be the platform's, not the consumer's: the group's `fieldError` and the atom would have nowhere to land. One extension point was cheaper than one fake control.                    |
| Description and error on every radio                                       | Each radio would need its own live region for the group's one message, so a group of nine would carry nine regions announcing the same sentence. A message about the set is read once, at the set — which is what [0010](0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md) already decided for a group.                                                                                                                                                        |

## Consequences

The pair is one public component and one private part. An author imports the
group — the group's `define.ts` registers both tags, so one import is enough —
and writes the options as markup. `BrikkaRadioGroupItem` is exported from nothing:
`src/index.ts` carries `BrikkaRadioGroup` and its orientation type, and the item's
API is the "The item" section of the group's README rather than a page of its
own.

A `brikka-radio-group-item` outside a `brikka-radio-group` is unsupported by design: it
reports activations and nothing selects it, it has no `name` to submit under, and
it is not in the tab order until a group computes the tab stop. That is a real
cost of single-sourcing the value, and the README says it rather than hiding it.

The group writes on items whose internals it does not own — `checked`, `disabled`
and `tabStop` on the host, never a shadow root. It gives back only the `disabled`
it took, so an item disabled on its own stays disabled when the group re-enables.

Reset has one source: the radio whose markup carried `checked`. The attribute is
read at connect and again on reset, which is why the group writes the property
and leaves the attribute alone.

The keyboard is the group's to maintain. No engine change removes that: the
inputs are separate trees whatever the platform groups by name, so a native
grouping across shadow roots would be a new feature and not a deletion here.

[0008](0008-keep-the-native-disabled-attribute-on-text-fields.md) names the radio
widget and its `aria-disabled` by the element's old, public tag. That tag no
longer exists: the mechanism it describes is unchanged and now belongs to
`brikka-radio-group-item`, and 0008 is left as the record it is rather than edited.

Two limits ship with the decision rather than being decided later:

- **The group cannot show a message it does not own.** A required, empty group
  blocks the submit, and the sentence in it is the consumer's: `error` or a
  `brikka-field-error` atom. With neither, the platform's own message is the only
  one — English, and surfaced by the browser — and the group paints no invalid
  label, because `aria-invalid` follows what is displayed.
- **A radio with no `value` cannot hold the selection.** The group's `value` is
  the string the selected radio submits; the group selects by matching it, so an
  empty `value` is indistinguishable from "nothing selected". A group whose
  buttons carry no `value` submits nothing even after a click.

It gets revisited if the kit needs a group whose value is not a string — a set is
`brikka-checkbox-group`'s shape and a different decision — or if the platform ever
groups form-associated custom elements the way it groups native radios.
