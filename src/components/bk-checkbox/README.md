# `bk-checkbox`

A checkbox with a real `<label>`, a description and an error slot, and a
`bk-change` event. The label sits beside the box, never above it.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-checkbox--docs)

```html
<bk-field>
  <bk-checkbox name="terms" required>
    <bk-field-label>Accept the terms</bk-field-label>
  </bk-checkbox>
</bk-field>
<bk-field>
  <bk-checkbox name="terms" checked error="You have to accept the terms.">
    <bk-field-label>Accept the terms</bk-field-label>
    <bk-field-description>You can change this later.</bk-field-description>
  </bk-checkbox>
</bk-field>
```

## Attributes and properties

| Property        | Attribute       | Type      | Default | Notes                                                                                                                                                                                                       |
| --------------- | --------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`         | `error`         | `string`  | `''`    | the message from JavaScript; a slotted `bk-field-error` with text wins over it; wins over the description and over the native message; sets `aria-invalid="true"` and blocks submission; cleared on `input` |
| `checked`       | `checked`       | `boolean` | `false` | the state. The attribute is the default the form returns to on reset, like the platform's `defaultChecked`; the property is not reflected, so the attribute stays what the author wrote                     |
| `indeterminate` | `indeterminate` | `boolean` | `false` | reflected; the mixed state: paints a dash instead of the check, submits nothing while it holds, and a click resolves it to checked. The attribute is also what a reset returns to                           |
| `value`         | `value`         | `string`  | `''`    | submits as `on` while checked, and submits nothing while unchecked                                                                                                                                          |
| `name`          | `name`          | `string`  | `''`    |                                                                                                                                                                                                             |
| `disabled`      | `disabled`      | `boolean` | `false` | reflected; sets `aria-disabled` on the inner checkbox and blocks activation                                                                                                                                 |
| `required`      | `required`      | `boolean` | `false` | reflected; announces the state and marks the label with a `*` when there is one                                                                                                                             |

The mixed state is a header over a set, not a value. While `indeterminate` holds,
nothing is submitted, whatever `checked` says: the box reports the case the HTML
specification gives for a select-all control, so `FormData` does not carry a key
for it. A click resolves the state to checked and clears the flag, and
`bk-change` reports `{ checked: true }` as usual — the control mirrors what the
native input did rather than inventing a transition. It is not a validity state:
a mixed box is not invalid, and a `required` mixed box is still `valueMissing`,
because nothing is submitted.

## Slots

| Slot          | Content                | Notes                                                                                                                                                                                                           |
| ------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `bk-field-label`       | rendered inside the `<label>` that wraps the native input; the slot is the only label, and the box is unnamed while it is empty                                                                                 |
| `description` | `bk-field-description` | the help text, under the label row and indented to the label text; `aria-describedby` names the region while it has content                                                                                     |
| `error`       | `bk-field-error`       | the problem, rendered outside the label; an atom with text **is** the box's error (marks the box invalid, blocks submission) and wins over the `error` property; the description is hidden while it has content |

The error channel has two writers and one display: `error` from JavaScript, and
a `bk-field-error` with text in the `error` slot. When both are set the atom
wins, and the property comes back when the atom's text goes; an atom with no text
is not content and says nothing about validity
([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)).

The atoms need no `slot` attribute inside a `bk-field`, which assigns them by
tag name. Rendered straight as a child of the control they do, because the
control is not a field.

The `label` goes inside the `<label>` that wraps the native input, so the
association stays implicit by containment. The description and the error are
rendered outside it: text inside a label joins the control's accessible name, and
the name of this control is the label, not its help text.

## Events

| Event       | Detail                 | Notes                                                           |
| ----------- | ---------------------- | --------------------------------------------------------------- |
| `bk-change` | `{ checked: boolean }` | `bubbles: true`, `composed: true`; fires like a native `change` |

```js
document.querySelector('bk-checkbox').addEventListener('bk-change', (event) => {
  console.log(event.detail.checked);
});
```

## Parts

| Part          | Element                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| `label`       | the `<label>` row: the box and the label, carrying `data-state` and `data-disabled` |
| `input`       | the native `<input type="checkbox">`                                                |
| `box`         | the painted square                                                                  |
| `required`    | the `*` that marks a required box, `aria-hidden`                                    |
| `message`     | the container of the two message regions, indented to the label text                |
| `description` | the help region                                                                     |
| `error`       | the error region, `role="status"`                                                   |

Both message regions always exist so screen readers announce an error when it
appears. The description is hidden while the error has text, and an empty region
is collapsed with `data-empty` instead of being removed, so it stays in the
accessibility tree. The error region always carries `data-state="error"`, which
names it as the region that paints a problem, whichever channel fills it; whether
it holds a message is `data-empty`, not that attribute. The part names do not
move with the state: `description` keeps its name while the error shows.

The **message block starts where the label text starts**, not under the box: it is
indented by `var(--bk-checkbox-size, var(--bk-checkbox-variant-size))` plus the row
gap `--bk-space-2`, both read from the hook the box paints. A consumer who resizes
the box through `--bk-checkbox-size` keeps the alignment, because one value paints
the box and the indent. Both regions are indented, because a description and an
error are one block about the same box. The rule is the checkbox's own and never
the shared sheet: `bk-input` puts its label above its control and must not gain an
indent.

The label is inline beside the box by design. The row is the checkbox's own
layout, so no `orientation` decides it and the field never reaches into it.

## Tokens and hooks

| Hook                   | Paints                                                   |
| ---------------------- | -------------------------------------------------------- |
| `--bk-checkbox-size`   | the edge of the painted box (defaults to `--bk-space-4`) |
| `--bk-checkbox-radius` | corner radius (defaults to `--bk-radius-sm`)             |

Everything else the box paints is a shared role or base token: theming the
checkbox means theming the roles, not the field. The disabled dim is the base
primitive `--bk-opacity-disabled`, which the box does not wrap in a hook of its
own, and a disabled row keeps the box surface and the default text role instead
of the muted ones.

`--bk-checkbox-variant-size` and `--bk-checkbox-variant-radius` are the internal
defaults the two hooks fall back to, so an override set on an ancestor still
wins ([ADR 0002](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0002-require-the-theme.md)).
Set the two hooks above, not those.

```css
.checkout {
  --bk-checkbox-size: var(--bk-space-3);
  --bk-checkbox-radius: var(--bk-radius-sm);
}
```

## Accessibility

- A real `<label for>` wraps a real `<input type="checkbox">`, and focus is
  delegated to that input: the accessible name, the Space key, the form
  participation and the announced state are the platform's.
- The accessible name is the text of the `label` slot and nothing else. There is
  no attribute a box can be labelled with, so a box whose slot is empty stays
  unnamed rather than named by one.
- The painted box is `aria-hidden` decoration. Everything the assistive
  technology reads — `checked`, `aria-invalid`, `aria-disabled`,
  `aria-describedby` — lives on the native input.
- The label colour is reinforcement, never the signal (WCAG 1.4.1): the box
  border, `aria-invalid` and the message region carry the error, the native
  `required` attribute carries "required", and the `*` is `aria-hidden`
  decoration.
- The focus ring is drawn on the box through `:focus-visible` on the input, so it
  appears for keyboard focus and not for a mouse click.
- The box boundary, the check — while checked, and while a checked box is
  disabled — and the focus ring each clear 3:1 against what they sit on
  (WCAG 1.4.11). The suite asserts all three, in both themes.
- `disabled` sets `aria-disabled` on the inner checkbox and cancels the click:
  the control stays in the tab order and is announced as unavailable, while
  Space and the label stop changing it. A native `disabled` input would be
  skipped entirely, which hides it from someone navigating with a screen reader.
- `aria-describedby` points at the error region while it has text, otherwise at
  the description region, and at neither while both are empty. Content that
  arrives through a slot is read from `slotchange` and `assignedNodes()`, never
  from the region's `textContent`. The error region is `role="status"` and stays
  in the accessibility tree while it is visually collapsed.
- **Form-associated** through `ElementInternals`: a checked box submits under
  `name`, an unchecked one submits nothing, `required` reports `valueMissing`,
  `error` — or the text of a `bk-field-error` in the `error` slot — reports
  `customError`, a disabled `<fieldset>` disables the field, and `reset()`
  restores the authored `checked` and `indeterminate` state and drops `error`. A
  disabled box submits nothing and reports no error, like a native one.

## Limitations

- No group here. Wrapping several boxes is `bk-checkbox-group`: this component is
  one box with its own label, message and validity, and it never reads an
  ancestor.
- A value the browser restores after a navigation comes back as the submitted
  `value`, not as `checked`, so a restored box can render unchecked.

## Label state

The control writes its state on its own label row — this `<label>`, and a
`bk-field-label` hosted through the `label` slot — as `data-state`:

| Value      | When                                               | Paints                  |
| ---------- | -------------------------------------------------- | ----------------------- |
| `invalid`  | `error` is set, or the native message is showing   | `--bk-text-danger`      |
| `disabled` | `disabled`, or the field is inside a disabled form | `--bk-opacity-disabled` |

A box that is both is painted with the danger colour and still dimmed: the colour
is the state's and the dim is the fact's. `data-state` carries one value and
`invalid` wins it, so the row also carries `data-disabled` while the box is
unavailable, and both the row and the box are dimmed from that.

A label with no state keeps `--bk-text-default`, and a standalone
`bk-field-label` paints the same way from its own `data-state`. The row is the
one container that dims: the box and the label inside it are not dimmed twice,
and a `bk-field-label` hosted through the `label` slot is dimmed by the row it
sits in.

A `required` box marks its label with a `*` (`part="required"`,
`aria-hidden="true"`) in `--bk-text-danger`, the same role as the error text. It
sits on the label's line, beside the box, so a slotted `bk-field-label` does not
push it to its own row. The mark is not rendered while the box has no label, and
it is never the only signal — the native `required` attribute is what announces
the state.
