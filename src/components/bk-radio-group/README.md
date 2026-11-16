# `bk-radio-group`

A widget that owns one value: it arranges several `bk-radio-group-item` boxes,
keeps exactly one of them selected, submits that one value, reports `valueMissing`
while a `required` group has no selection, and carries the tab stop and the
arrow keys. It is a `role="radiogroup"` with its own label and its own message
regions.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-radio-group--docs)

```html
<bk-radio-group name="size" required>
  <bk-field-label>Size</bk-field-label>
  <bk-radio-group-item value="s">
    <bk-field-label slot="label">Small</bk-field-label>
  </bk-radio-group-item>
  <bk-radio-group-item value="m" checked>
    <bk-field-label slot="label">Medium</bk-field-label>
  </bk-radio-group-item>
  <bk-radio-group-item value="l">
    <bk-field-label slot="label">Large</bk-field-label>
  </bk-radio-group-item>
  <bk-field-description>Pick the size you normally wear.</bk-field-description>
  <bk-field-error>Pick a size.</bk-field-error>
</bk-radio-group>
```

`bk-radio-group-item` is the markup of the group, not a component you import:
the group's `define.ts` registers its tag beside the group's own, the package
entry exports only the group, and [The item](#the-item) describes what it carries.

## What it owns

- **One value.** `value` is the selection, and it is the only place the selection
  lives. The group writes `checked` on each item on every update; an item reports
  an activation with `bk-change` and the group moves the value. A
  `<form>` submits the selected item's `value` under the group's `name`, or
  nothing while nothing is selected.
- **The validity.** `required` with no selection reports `valueMissing`, blocks
  the submit and fires `invalid` at the group; `error`, or a `bk-field-error` with
  text, reports `customError` with that text. A disabled group reports nothing and
  submits nothing.
- **The tab stop.** Exactly one item is in the tab order: the selected one, or
  the first enabled one while nothing is selected, and none while every item is
  disabled. A disabled group keeps no tab stop at all.
- **The keyboard.** The platform's radio grouping by `name` does not cross shadow
  roots, because each `bk-radio-group-item` encapsulates its `<input>`, so the
  group handles the arrow keys itself.

## Attributes and properties

| Property      | Attribute     | Type                         | Default    | Notes                                                                                                                                                                   |
| ------------- | ------------- | ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `value`       | `string`                     | `''`       | the selection. Assigning a radio's value selects that radio; the author's `checked` attribute on a radio is read as the default a reset returns to                      |
| `name`        | `name`        | `string`                     | `''`       | the key the selection submits under                                                                                                                                     |
| `required`    | `required`    | `boolean`                    | `false`    | reflected; with no selection reports `valueMissing`, blocks the submit and marks the label with a `*` when there is one                                                 |
| `disabled`    | `disabled`    | `boolean`                    | `false`    | reflected; disables every radio it owns, keeps the tab stop out of the tab order, submits nothing and reports no error. It gives back only the `disabled` it set itself |
| `error`       | `error`       | `string`                     | `''`       | the message from JavaScript; a slotted `bk-field-error` with text wins over it; sets `aria-invalid="true"` and reports `customError`; cleared by an `input` event       |
| `orientation` | `orientation` | `'vertical' \| 'horizontal'` | `vertical` | reflected; the direction the radios flow in. The arrow keys work on both axes whatever it says                                                                          |

The rest of the form API is the shared contract, inherited from
`FormControlMixin`:

| Member                                                                                                 | Notes                                                                       |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `form`, `validity`, `validationMessage`, `fieldMessage`, `fieldError`, `fieldInvalid`, `fieldDisabled` | read-only views of the internals                                            |
| `checkValidity()`, `reportValidity()`, `showValidationMessage()`                                       | the platform's constraint validation, and the message a touched field shows |
| `formResetCallback()`, `formDisabledCallback()`, `formStateRestoreCallback()`                          | driven by the `<form>`, not by the consumer                                 |

The group is the only form participant of the pair; `bk-radio-group-item` has no
form API
([ADR 0012](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0012-a-radio-group-is-a-widget-not-a-container.md)).

## Slots

| Slot          | Content                | Notes                                                                                                                  |
| ------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| _(default)_   | `bk-radio-group-item`  | the boxes. Nothing else belongs here                                                                                   |
| `label`       | `bk-field-label`       | the name of the group. The slot is the only name; the group is unnamed while it has no such atom                       |
| `description` | `bk-field-description` | the help text and the description region itself; the group gives it an id and takes the empty mark back when it leaves |
| `error`       | `bk-field-error`       | the problem and the live region itself; it wins over the description and over `error` while it has text                |

The group's atoms need no `slot` attribute: it assigns `bk-field-label`,
`bk-field-description` and `bk-field-error` by tag name, at any depth. An item's
atoms are the item's: a label written for a box goes inside that
`bk-radio-group-item` with `slot="label"` on the atom itself, and a description
written for a box needs no slot either, because the item assigns
`bk-field-description` to its own `description` slot. The group stops at the
nearest item, so an atom inside an item is never adopted as a message about the
set, and a bare `bk-field-label` inside the group names the group.

## The item

`bk-radio-group-item` is the box of one option: a real `<label>`, a round box, the
slotted `bk-field-label` that names it, the slotted `bk-field-description` that
hints at it, and a `bk-change` report. **It is part of the group's markup, not a
component you import.** The group's `define.ts`
registers its tag beside the group's own, so a `<bk-radio-group-item>` whose tag
was never defined can never stay inert; the package entry `src/index.ts` exports
only `BkRadioGroup` and the orientation type.

It stays a custom element because each box needs its own shadow root — the native
`<input type="radio">` is `part="input"`, inside the `<label>` the element paints
— and its own slotted label atom. It is not a public component because a radio
that only works inside its group promises a use that does not exist: nothing
outside a `bk-radio-group` keeps its selection, submits it or reaches it with the
keyboard, and a public tag whose only correct context is one container is a trap
([ADR 0012](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0012-a-radio-group-is-a-widget-not-a-container.md)).

The item is form-inert: no `name`, no `required`, no `error`, no `submittedValue`,
no validity and no error region. Validity is the group's. The one message region
the item carries is the **description of its own option**, and the group never
adopts it.

### Properties

| Property   | Attribute  | Type      | Default | Notes                                                                                                                                                                                                                          |
| ---------- | ---------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checked`  | `checked`  | `boolean` | `false` | the selection. The group is the writer; the attribute is the state the markup declared, which the group reads as the value a reset returns to, and the property is not reflected, so the attribute stays what the author wrote |
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets `aria-disabled` on the inner input, cancels activation and stays focusable. A group's `disabled` writes this property on the items it owns and gives back only what it took                                    |
| `value`    | `value`    | `string`  | `''`    | what the item contributes to the group's value. An item with no `value` cannot hold the selection                                                                                                                              |
| `tabStop`  | —          | `boolean` | `false` | the roving tab stop, written by the group as a **property only**. It becomes `tabindex="0"` on the inner input, or `-1`; the attribute does not exist because the group computes the tab order and a consumer never invents it |

The item also takes two slots:

| Slot          | Content                | Notes                                                                                                                                                                                                 |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `bk-field-label`       | rendered inside the `<label>` that wraps the native input, so the association is implicit by containment. The slot is the only label, and the box is unnamed while it is empty                        |
| `description` | `bk-field-description` | the hint of that option, rendered under the label row and indented to the label text. The item assigns the slot by tag, so the atom needs no `slot` attribute. An empty or absent hint takes no space |

### Parts

| Part          | Element                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `label`       | the `<label>` row: the hidden input, the box and the label slot                 |
| `input`       | the native `<input type="radio">`, visually hidden and still focusable          |
| `box`         | the painted circle, `aria-hidden` decoration                                    |
| `description` | the region of the option's hint, hidden while the option carries no description |

### The hint of an option

The item takes a **description, never an error**: why one option is the better
choice belongs to that option, while validity belongs to the set
([ADR 0014](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0014-an-option-can-carry-its-own-hint.md)).
It renders under the label row, styled like any other message region (small and
muted, `--bk-space-1` above it), and it starts where the label text starts: the
region is indented by `var(--bk-radio-group-item-size,
var(--bk-radio-group-item-variant-size))` plus the row gap `--bk-space-2`, read
from the hook the box paints, so a resized box keeps the alignment.

```html
<bk-radio-group-item value="standard">
  <bk-field-label slot="label">Standard</bk-field-label>
  <bk-field-description>Three to five working days.</bk-field-description>
</bk-radio-group-item>
```

An absent or still-empty description takes no space at all, so a column of
options stays as tight as the labels it holds; the region appears when its text
does, and it is content, not a live region. There is no `error` slot: an error
written inside an item would be adopted by nothing and announced by nothing.

### Override hooks

| Hook                           | Paints                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| `--bk-radio-group-item-size`   | the edge of the painted box (defaults to `--bk-space-4`)   |
| `--bk-radio-group-item-radius` | corner radius (defaults to `--bk-radius-lg`, half the box) |

Everything else the box paints is a shared role or base token: theming the box
means theming the roles, not the box.

`--bk-radio-group-item-variant-size` and `--bk-radio-group-item-variant-radius`
are the internal defaults the two hooks fall back to, so an override set on an
ancestor still wins
([ADR 0002](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0002-require-the-theme.md)).
Set the two hooks above, not those.

```css
.compact {
  --bk-radio-group-item-size: var(--bk-space-3);
  --bk-radio-group-item-radius: var(--bk-radius-sm);
}
```

### Limits of the item

- **It needs the group.** Alone it reports activations that nothing keeps, it
  submits nothing under no name, and it has no tab stop until a group computes
  one. The group is the widget; this element is one box of it.
- **An item with no `value` cannot hold the selection.** The group selects by
  matching its `value` against the items' `value`, and an empty one is
  indistinguishable from "nothing selected", so a group of value-less items
  submits nothing after a click.
- **It is not in the tab order by itself.** `tabStop` is `false` until the group
  writes the roving tab stop, so the inner input is `tabindex="-1"` and the only
  way to it is a click or `focus()`.
- **Its label is dimmed with the row.** The row carries `data-disabled` while
  the radio is disabled and is drawn with `--bk-opacity-disabled`, so the box and
  the label beside it dim together, once. The label atom is the consumer's and
  this element writes no `data-state` on it (the group's own `data-state` marks
  only the group's label).
- **The hint is referenced, and it is the region the item renders.** The `<input>` and the
  region sit in the same shadow root, so `aria-describedby` resolves and the hint is the
  radio's accessible description while it has text. It is dropped when the hint empties (A4).
  [ADR 0009](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0009-nest-the-field-parts-inside-the-control.md)
  could not resolve. The hint is read where it is, next to the option.

## Group-level messages

The consumer's atoms **are** the regions. A container cannot reference a region
inside its own shadow root — `aria-labelledby`/`aria-describedby` resolve per tree
— so the group writes on the atom what a region would otherwise carry:

| The group writes   | On                 | When                                                                        |
| ------------------ | ------------------ | --------------------------------------------------------------------------- |
| `id`               | description, error | always, if the atom has none: `<group id>-description`/`-error`             |
| `role="status"`    | error              | always, if the atom has no role of its own                                  |
| `data-empty`       | description, error | while `textContent.trim()` is empty                                         |
| `hidden`           | description        | while the error atom has text                                               |
| `aria-describedby` | the host           | the error id while the error has text, else the description id, else absent |

The rule and its reason are
[ADR 0010](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md)'s;
the group hosts the label the same way and assigns it with
`ariaLabelledByElements`.

**An error atom with text is the group's error**: it reports `customError`, paints
the label invalid and sets `aria-invalid="true"` on the host, exactly as the
`error` property does ([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)).
The property is cleared by an `input` event from an interaction; the atom is the
consumer's node and the consumer empties it.

## Keyboard

| Key                       | Moves                                                                          |
| ------------------------- | ------------------------------------------------------------------------------ |
| `ArrowDown`, `ArrowRight` | focus and selection to the next enabled radio; the last one wraps to the first |
| `ArrowUp`, `ArrowLeft`    | focus and selection to the previous enabled radio; the first wraps to the last |
| `Home`                    | focus and selection to the first enabled radio                                 |
| `End`                     | focus and selection to the last enabled radio                                  |

- Moving focus **selects**: this is a radiogroup, not a toolbar, and the platform
  behaves the same way for native radios.
- Both axes navigate whatever `orientation` says. `orientation` is the layout,
  not a restriction, so a horizontal group still answers `ArrowDown` and a
  vertical one still answers `ArrowRight`: a user's guess about the axis can
  never trap them.
- A disabled radio is skipped, wrapping as if it were not there.
- A key with `Alt`, `Ctrl` or `Meta` is left to the platform.
- The group listens for the composed `keydown`, so the key presses that reach it
  are the ones the radios' inner inputs report.

## Parts

| Part       | Element                                                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| `label`    | the row holding the label slot and the required mark, hidden while the group is unnamed |
| `radios`   | the flow container of the default slot, `flex-direction` from `orientation`             |
| `required` | the `*` that marks a required group, `aria-hidden`                                      |

There is no `message`, `description` or `error` part: those regions are the
consumer's own atoms.

## Label state

The group writes its state on the `bk-field-label` it hosts, as `data-state`:

| Value      | When                                                | Paints                  |
| ---------- | --------------------------------------------------- | ----------------------- |
| `invalid`  | an `error`, or a `bk-field-error` with text, shows  | `--bk-text-danger`      |
| `disabled` | the group is disabled, or is inside a disabled form | `--bk-opacity-disabled` |

The dim is applied to the group's own label row and to the row of every radio it
disables, each once; a hosted label atom is dimmed by the row it sits in.

`aria-invalid` on the host follows the same flag: **it follows what is
displayed.** A missing value with no message on screen is not painted as invalid;
the `*` is the required mark, and the platform's own message is what the submit
shows.

## Reset

`form.reset()` restores the radio whose markup carried `checked`, clears the
group's error state, moves the tab stop with the restored selection and submits
the restored value. The group writes the property and never the attribute, so the
authored state stays readable for the next reset.

## Tokens

No new token tier and no hook of the group's own: there is no
`--bk-radio-group-*` name. The only hooks in the pair are the item's two
([The item](#the-item)), and the group paints no box.

| The group paints          | With                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the gap between items     | `--bk-space-2`                                                                                                                                                                   |
| the first line of an atom | `--bk-space-1` above it, while the atom has text                                                                                                                                 |
| its label row             | the label roles: `--bk-font-sans`, `--bk-font-size-sm`, `--bk-font-weight-medium`, `--bk-text-default`, `--bk-text-danger` while invalid, `--bk-opacity-disabled` while disabled |
| the required mark         | `--bk-text-danger`                                                                                                                                                               |

The items, the description and the error paint themselves. Theming a group
means theming the roles.

## Accessibility

- The host is the widget: it carries `role="radiogroup"`, so a screen reader
  announces the bounds of the set, and its name is the slotted `bk-field-label`
  assigned with `ariaLabelledByElements`. No id is written for the name and no
  reference crosses a shadow root.
- `aria-describedby` on the host names the **consumer's** error atom while it has
  text, otherwise the consumer's description atom, and neither while both are
  empty. The atom is in the document tree, so the IDREF resolves; the error atom
  carries `role="status"` and stays in the accessibility tree while it is
  visually collapsed.
- The keyboard is the group's, not the platform's: arrows select and move focus,
  `Home`/`End` jump, the ends wrap, and a disabled radio is skipped. Exactly one
  radio's inner input has `tabindex="0"` — and none while every radio is
  disabled — so the set is one stop in the tab order rather than one per button.
- `disabled` writes `aria-disabled` on each owned radio's inner input rather than
  the native attribute, so the radios stay focusable and discoverable, and the
  group removes the tab stop while disabled.
- `aria-invalid` and the label's `data-state` are set only while a message is
  displayed, so the flag never describes a state the page does not show.
- **Form-associated** through `ElementInternals`: the selection submits under
  `name`, `required` reports `valueMissing`, an `error` or an error atom reports
  `customError`, a disabled `<fieldset>` disables the group and cancels the
  submit, and `reset()` restores the authored selection.

## Limitations

- **The group cannot display a message it does not own.** A `required` group with
  nothing selected blocks the submit and reports `valueMissing`, but the visible
  sentence is the consumer's: the `error` property or a `bk-field-error` atom. The
  built-in default — `Please select an option.` — is English, fixed, and only the
  platform surfaces it, through `validationMessage` and the browser's own
  validation UI on submit. A consumer who wants text on the page writes an atom
  (and it becomes the message and the blocking constraint, as in any field).
- **The label is not painted invalid for a missing value.** `aria-invalid` and
  `data-state="invalid"` follow what is displayed ([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)),
  so a required empty group with no error atom shows the `*` and the platform's
  message and nothing red — before the interaction and after it. Write an error
  atom, or set `error`, to mark the set and keep it marked.
- **A radio with no `value` cannot hold the selection.** The selection is matched
  by value, and an empty value reads as "nothing selected".
- **Nested groups each own their nearest radios.** A radio belongs to its
  closest `bk-radio-group` ancestor, so an inner group keeps the buttons inside
  it and the outer one never writes to them. Nothing else about nesting is
  supported or proved.
- **The keyboard is implemented, not native.** A new key that native radio groups
  support in some engine is the group's to add here, and the suite is where that
  claim is proved.
