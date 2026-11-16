# `bk-checkbox-group`

A container that names and arranges several `bk-checkbox` elements. It is a
`role="group"` with its own label, description and error regions, and it enforces
one thing: with `required`, at least one of its boxes must be checked. It submits
no value of its own — every box submits its own.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-checkbox-group--docs)

```html
<bk-checkbox-group required>
  <bk-field-label>Notifications</bk-field-label>
  <bk-checkbox name="email" value="email">
    <bk-field-label slot="label">Email</bk-field-label>
  </bk-checkbox>
  <bk-checkbox name="sms" value="sms">
    <bk-field-label slot="label">SMS</bk-field-label>
  </bk-checkbox>
  <bk-field-description>Pick at least one.</bk-field-description>
  <bk-field-error>Pick at least one channel.</bk-field-error>
</bk-checkbox-group>
```

## Attributes and properties

| Property      | Attribute     | Type                         | Default    | Notes                                                                                                                                                                              |
| ------------- | ------------- | ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | `name`        | `string`                     | `''`       | carried by the shared form API. The group submits nothing, so the name adds no entry to the form data                                                                              |
| `required`    | `required`    | `boolean`                    | `false`    | reflected; with nothing checked it reports `valueMissing` and blocks the submit, and marks its label with a `*` while it has one                                                   |
| `disabled`    | `disabled`    | `boolean`                    | `false`    | reflected; disables every `bk-checkbox` it owns, submits nothing and reports no error. It takes back only the `disabled` it wrote itself                                           |
| `error`       | `error`       | `string`                     | `''`       | the message from JavaScript; a slotted `bk-field-error` with text wins over it; reports `customError` with that text                                                               |
| `invalid`     | `invalid`     | `boolean`                    | `false`    | reflected; the consumer's own statement, beside the invalid state the field derives from its error. Either one paints the group's own `bk-field-label` and writes nothing on a box |
| `orientation` | `orientation` | `'vertical' \| 'horizontal'` | `vertical` | reflected; the direction the boxes flow in. The only layout difference                                                                                                             |

The rest of the form API is the shared contract, inherited from
`FieldControlMixin`:

| Member                                                                                                 | Notes                                                                       |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `form`, `validity`, `validationMessage`, `fieldMessage`, `fieldError`, `fieldInvalid`, `fieldDisabled` | read-only views of the internals                                            |
| `checkValidity()`, `reportValidity()`, `showValidationMessage()`                                       | the platform's constraint validation, and the message a touched field shows |
| `formResetCallback()`, `formDisabledCallback()`, `formStateRestoreCallback()`                          | driven by the `<form>`, not by the consumer                                 |

## What it enforces

`required` means **at least one box checked**, and it is the only constraint the
group carries. With `required` and nothing checked the group reports
`valueMissing` and the form refuses the submit; the moment one box it owns is
checked the constraint clears, and it comes back when the last one is unchecked.

There is no manual call: the group reads what each box submits — its
`submittedValue` — and re-evaluates on the `bk-change` every box already emits. The boxes stay
independent — the group writes nothing on them except `disabled` (see
[Disabled](#disabled)), an unchecked box submits nothing, and no box knows it is
in a group.

**It submits no value of its own.** The boxes submit theirs under their own
`name`s; the group adds no entry to the form data. `new FormData(form)` has the
checked boxes and no row for the group: it is a constraint in the payload, not a
key.

The message is the consumer's. The `error` property, or a `bk-field-error` atom
with text, reports `customError` with that text, exactly as in any field
([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)).
With neither, the group falls back to a fixed English sentence — `Please select
at least one option.` — which only the platform surfaces, through
`validationMessage` and the browser's own validation UI on submit. A component
does not translate; a consumer who wants text on the page writes it.

**A nested group is its own widget.** A group writes `disabled` on the boxes it
owns, and a group nested inside another is not owned by it: the outer `disabled`
does not reach the inner one, and the inner boxes keep responding — which is what
they look like, since nothing dims them. Disabling a whole subtree means disabling
each group.

## Disabled

`disabled` flows to the boxes. The group writes `disabled` on every `bk-checkbox`
it owns, and takes back only what it wrote: leaving `disabled` re-enables those
boxes and leaves a box authored `disabled` disabled. Each box then refuses the
pointer and reports `aria-disabled` on its own inner input, which is the disabled
they already carry
([ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md)).
A group that looks unavailable while its boxes still respond is the lie
[Conventions C5](https://github.com/sebakellner/brick-ui/blob/main/docs/conventions-code.md#c5-a-disabled-control-keeps-its-muted-text-loses-its-hover-and-carries-one-dim)
exists to prevent.

A disabled `<fieldset>` reaches the group too, through `formDisabledCallback`, and
the group flows it to the boxes the same way. Each box also honours the fieldset
on its own, so both routes leave the set inert:

```html
<fieldset disabled>
  <bk-checkbox-group required>
    <bk-field-label>Notifications</bk-field-label>
    <bk-checkbox name="email" value="email">
      <bk-field-label slot="label">Email</bk-field-label>
    </bk-checkbox>
  </bk-checkbox-group>
</fieldset>
```

## Slots

| Slot          | Content                | Notes                                                                                                       |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| _(default)_   | `bk-checkbox`          | the boxes; the only things the group arranges                                                               |
| `label`       | `bk-field-label`       | the name of the group. The slot is the only name; the group is unnamed while it has no such atom            |
| `description` | `bk-field-description` | the help text, and the description region itself; the group gives it an id and takes it back when it leaves |
| `error`       | `bk-field-error`       | the problem, and the live region itself; it wins over the description while it has text                     |

The three atoms need no `slot` attribute inside the group: it assigns them by tag
name, at any depth, the way `bk-field` does. A box keeps its own atoms — the
group never routes or paints what a `bk-checkbox` hosts, so a box's label is
written with `slot="label"` on the box itself, or left bare inside a `bk-field`.

## Group-level messages

The consumer's atoms **are** the regions. The group does not render a region of
its own and does not wrap them: a container cannot reference a region inside its
own shadow root, because `aria-labelledby`/`aria-describedby` resolve per tree.
So the group writes on the atom what a region would otherwise carry, and the
atom stays in the document tree where an IDREF finds it:

| The group writes   | On                 | When                                                                        |
| ------------------ | ------------------ | --------------------------------------------------------------------------- |
| `id`               | description, error | always, if the atom has none: `<group id>-description`/`-error`             |
| `role="status"`    | error              | always, if the atom has no role of its own                                  |
| `data-empty`       | description, error | while `textContent.trim()` is empty                                         |
| `hidden`           | description        | while the error atom has text                                               |
| `aria-describedby` | the host           | the error id while the error has text, else the description id, else absent |

An empty atom is clipped, never removed: it keeps its 1px box, its place in the
flow and its place in the accessibility tree, so the live region is already
there when the error arrives. `data-empty` is what the atom paints — the atom
stays presentational, it never decides that it is empty.

`hidden` is a different job and only the description gets it: while the error has
text the description gives it the row, exactly as a field's two regions behave,
and it comes back when the error empties. Neither atom is ever removed.

When an atom leaves the group, the group takes its `role` and its `data-empty`
back; the `id` it assigned can stay.

**This is a deliberate departure from A7's "never `role="status"` on slotted
content".** A7 keeps the live region on the control's own shadow region, which
works because the control's references live in the same tree as that region. A
group is a different shape: the element a screen reader lands on is the host,
and the host's `aria-describedby` cannot reach into its own shadow root —
measured, the reference resolves to nothing. Putting the role and the id on the
atom the consumer wrote is the only shape that both resolves and keeps the
region in the tree, and the cost is that the group writes on a node it does not
own. It writes only these four facts, never text, never state a box reads.

## Parts

| Part       | Element                                                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| `label`    | the row holding the label slot and the required mark, hidden while the group is unnamed |
| `boxes`    | the flow container of the default slot, `part="boxes"`                                  |
| `required` | the `*` that marks a required group, `aria-hidden`                                      |

There is no `message`, `description` or `error` part: those regions are the
consumer's own atoms, styled by the atoms and by the group's `::slotted` rules.
They are always there, because the group never removes them.

## Label state

The group writes its state on the `bk-field-label` it hosts, as `data-state`, and
`data-disabled` on its own label row; it writes neither on a box, nor on the
label of one:

| Value      | When                                                     | Paints                  |
| ---------- | -------------------------------------------------------- | ----------------------- |
| `invalid`  | `invalid` is set, or the field derives it from its error | `--bk-text-danger`      |
| `disabled` | the group is disabled, or is inside a disabled form      | `--bk-opacity-disabled` |

A label with no state keeps `--bk-text-default`, which is what the atom paints
from its own `:host` rules. The dim is written once, on the row: the hosted atom
is dimmed by the row it sits in and not a second time on its own.

A missing answer with no message on screen is **not** painted invalid: `data-state`
follows what is displayed, so a required empty group with no error atom shows the
`*` and the platform's message and nothing red
([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)).

## Tokens

No new token tier. The group reads the roles and primitives the atoms already
read — `--bk-space-2` for the gap between the boxes, and the atoms' own
`--bk-text-muted`, `--bk-text-danger` and `--bk-text-default` — plus the ones the
shared label styles paint with now that the group has a label state: the
`*`'s `--bk-text-danger` and the row's `--bk-opacity-disabled` while disabled. It
declares **no override hook**: there is no `--bk-checkbox-group-*` name, and
layout is the only thing `orientation` decides.

```css
/* theming a group means theming the role, not the group */
.checkout {
  display: flex;
  flex-direction: column;
  gap: var(--bk-space-2);
}
```

## Accessibility

- The host is the group: it carries `role="group"`, so a screen reader announces
  the bounds of the set when entering it.
- The accessible name is the slotted `bk-field-label`, assigned to the host with
  `ariaLabelledByElements` (Baseline 2025). The group writes no id on the
  consumer's node and no reference crosses a shadow root; the name is the
  element the consumer wrote. Removing the atom clears it again.
- `aria-describedby` on the host names the **consumer's** error atom while it has
  text, otherwise the consumer's description atom, and neither while both are
  empty. The atom is in the document tree, so the IDREF resolves; the group gives
  it the id rather than referencing a region of its own. The error atom carries
  `role="status"` — the group adds it when the atom has none and takes it back
  when the atom leaves — so the live region is the element that stays in the
  tree. An empty atom is clipped with `data-empty` and never removed; while the
  error has text the description takes `hidden` for that row and gets it back
  when the error empties. Text is read from the atom's `textContent`, never from
  a region the group renders. See [Group-level messages](#group-level-messages).
- `invalid` is reinforcement of the group's own label. It is never the only
  signal for a box: each box carries its own `aria-invalid`, its own message and
  its own native constraint, and the group cannot mark a box valid or invalid.
- **Form-associated, and it submits no entry.** The group composes the shared
  field contract, so it carries `name`, `required`, `disabled`, `error` and the
  validity surface: a required empty group reports `valueMissing` and the submit
  is refused at the group. `submittedValue` is `null`: the boxes submit their own
  values under their own names, and the group exists in the payload as a
  constraint, not as a key.
- **There is no `aria-required` for a group of checkboxes, and the group does not
  pretend there is.** `aria-required` belongs to `combobox`, `gridcell`,
  `listbox`, `radiogroup`, `spinbutton`, `textbox` and `tree`; `role="group"` is
  not among them, and an attribute no assistive technology maps is the same
  mistake as a decorative asterisk. The requirement is announced by the
  consumer's `bk-field-description` ("Pick at least one") and enforced by the
  constraint; the message is the consumer's `bk-field-error`. `radiogroup` **is**
  in that list, which is why `bk-radio-group` can say more with less.
- The `*` is `aria-hidden="true"` and `part="required"`: it is decoration for the
  eye, and the requirement a screen reader reads is the description text.
- The host carries no `aria-invalid` of its own: the user does not interact with
  the container, the invalid state is painted on its label, and the error is the
  consumer's atom. The boxes keep their own `aria-invalid`.
- No focus, key handling or tab order of its own: the boxes are the controls, and
  the group is a container around them.

## Limitations

- **Only "at least one".** There is no `min`, no `max` and no count, so a group
  that needs "two of these" is a different decision with its own message and its
  own suite.
- **The group cannot display a message it does not own.** A required group with
  nothing checked blocks the submit and reports `valueMissing`, but the visible
  sentence is the consumer's: the `error` property or a `bk-field-error` atom. The
  built-in default — `Please select at least one option.` — is English, fixed, and
  only the platform surfaces it.
- **A box that is `indeterminate` is not checked.** The constraint counts
  `checked` only, and a mixed box submits no value of its own, so it does not
  satisfy the group.
- **No `aria-required`.** `role="group"` has no such attribute, so the
  requirement lives in the consumer's description text and in the constraint. See
  [Accessibility](#accessibility).
- **The label is not painted invalid for a missing answer.** `data-state` and
  `invalid` follow what is displayed
  ([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)),
  so a required empty group with no error atom is not red, before an interaction
  or after it. Write an error atom, or set `error`, to mark the set and keep it
  marked.
- **The group reads and writes as little as it can.** It reads each box's
  `submittedValue` — never into a box's shadow root — and writes only
  `disabled` on them. It never sets a box's `checked`, its `required` or its
  message, and an unchecked box still submits nothing.
- **The inherited `value` is inert.** The group has no value of its own, so
  assigning `value` changes nothing it submits.
