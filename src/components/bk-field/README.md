# `bk-field`

A field assembled from parts: label, control, description and error message are
written as elements instead of strings, and `bk-field` stacks them.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-field--docs)

```html
<bk-field>
  <bk-input name="email">
    <bk-field-label>Email</bk-field-label>
    <bk-field-description>We only use it for the receipt.</bk-field-description>
  </bk-input>
</bk-field>
```

## The shape

The three atoms are children of the control, and the control is a child of
`bk-field`. The nesting is the rule, not a style: a `<slot>` only sees the host's
own light children, so an atom written as a sibling of the control never reaches
it, and the control builds its `<label for>` and `aria-describedby` from ids in
its own shadow root. Written flat, the input keeps its visual label and loses its
accessible name — [ADR 0009](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0009-nest-the-field-parts-inside-the-control.md)
records the alternatives and why they lost.

## What the field does

Three things, and nothing else:

- It stacks label, control, description and error in that order, one
  `--bk-space-1` gap apart, whatever order they were written in.
- On `slotchange` it assigns `slot="label"`, `slot="description"` and
  `slot="error"` to the parts it recognises by tag, so the consumer writes the
  element and never the attribute.
- It reflects its boolean `invalid` into `data-state="invalid"` on those parts.

It has no `role`, computes no accessible name and carries no validity. The role
belongs to the widget; `bk-field` is structure.

## The parts

`bk-field-label`, `bk-field-description` and `bk-field-error` are presentational.
They own their type and colour from semantic roles, carry no logic, and work
outside a field — one rendered on its own still lays out and still paints.

| Atom                   | Assigned slot | Paints with                        |
| ---------------------- | ------------- | ---------------------------------- |
| `bk-field-label`       | `label`       | `--bk-text-default`, medium weight |
| `bk-field-description` | `description` | `--bk-text-muted`                  |
| `bk-field-error`       | `error`       | `--bk-text-danger`                 |

## The control's slots

The control renders the parts inside its own shadow root, so the association
never crosses a root.

| Slot          | Rendered in                       | Falls back to                                 |
| ------------- | --------------------------------- | --------------------------------------------- |
| `label`       | the `<label>` bound with `for`    | the `label` property                          |
| `description` | the description region            | the `helper` property                         |
| `error`       | the error region, `role="status"` | the `error` property, then the native message |

`label`, `helper` and `error` keep working on `bk-input`: each is the fallback
content of its slot, so a field written with attributes is still a field with a
label. While the error region has content the description region is hidden;
neither is deleted.

## Properties

| Property  | Attribute | Type      | Default | Notes                                                                     |
| --------- | --------- | --------- | ------- | ------------------------------------------------------------------------- |
| `invalid` | `invalid` | `boolean` | `false` | reflected; sets `data-state="invalid"` on every part and removes it again |

`invalid` is the consumer's to set, or their form library's. The field does not
derive it from the control: it does not read the control's validity, and the
control does not read the field's attribute.

## Parts

| Part          | Element                                     |
| ------------- | ------------------------------------------- |
| `message`     | the container holding description and error |
| `description` | the description region                      |
| `error`       | the error region                            |

The names are stable and independent of state: a valid field and an invalid one
expose the same three parts, so `::part(error)` never stops matching. `label` and
`input` belong to the control, not to the field.

## Tokens

`bk-field` has no tokens of its own. It paints semantic roles and its only
geometry is the gap between the parts.

| Token                                                                                   | Paints                |
| --------------------------------------------------------------------------------------- | --------------------- |
| `--bk-text-default`                                                                     | the label             |
| `--bk-text-muted`                                                                       | the description       |
| `--bk-text-danger`                                                                      | the error             |
| `--bk-space-1`                                                                          | the gap between parts |
| `--bk-font-sans`, `--bk-font-size-sm`, `--bk-line-height-md`, `--bk-font-weight-medium` | typography            |

The control paints its own surface, border and focus ring; theming a field means
theming the roles.

## Accessibility

- The role belongs to the widget, not to the field. The accessible name and the
  description are resolved on the control's inner `<input>`, from ids in the
  control's own root; `bk-field` adds no `role`, no label text and no
  `aria-invalid`.
- There is one live region, on the error region. A description is context that
  was already there; an error is an update, and only the update is announced.
- A4: `aria-describedby` names a region only while that region has content.
  Slotted content is not in the region's `textContent`, so the control decides
  from `slotchange` and `assignedNodes()`. [Conventions A4](https://github.com/sebakellner/brick-ui/blob/main/docs/conventions-accessibility.md)
- A7: the live region is never removed from the accessibility tree. It is clipped
  to a 1px box while empty, so the announcement is not lost when the text
  appears. [Conventions A7](https://github.com/sebakellner/brick-ui/blob/main/docs/conventions-accessibility.md)
- The flat shape is not supported: written as siblings, the atoms make the input
  visually labelled and silently unnamed — [ADR 0009](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0009-nest-the-field-parts-inside-the-control.md).

## Limitations

- `bk-field-error` is a caption, not a validity source. Its text does not reach
  the control, so the control's `aria-invalid`, its border and the native message
  know nothing about it. An invalid field is written today with the atom _and_
  the control's `error` property: the property drives the state, the atom wins the
  visible text.
- That duplicate is the seam with the form-error model. Which of the two owns the
  message is decided there, not here.
