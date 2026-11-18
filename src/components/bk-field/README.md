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

## Attributes and properties

| Property  | Attribute | Type      | Default | Notes                                                                     |
| --------- | --------- | --------- | ------- | ------------------------------------------------------------------------- |
| `invalid` | `invalid` | `boolean` | `false` | reflected; sets `data-state="invalid"` on every part and removes it again |

`invalid` is the consumer's to set, or their form library's. The field does not
derive it from the control: it does not read the control's validity, and the
control does not read the field's attribute.

## Slots

| Slot          | Content                | Notes                                                                                               |
| ------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| _(default)_   | the control            | the one child `bk-field` stacks with the atoms; the atoms have to be its children, not its siblings |
| `label`       | `bk-field-label`       | assigned by tag on `slotchange`, so the consumer writes the element and never the attribute         |
| `description` | `bk-field-description` | the help text of the control                                                                        |
| `error`       | `bk-field-error`       | the message of the control                                                                          |

There is no attribute a field can be labelled with or described by. The slots
are the label and the description, so the control's name is the text the consumer
puts in `label` and its description is the text in `description`. While the error
region has content the description region is hidden; neither is deleted.

## Parts

**`bk-field` exposes no parts.** It stacks and it routes slots; the regions, the
label and the control are rendered by the control you put inside it, so they are
styled through that element — `bk-input::part(error)`, never `bk-field::part(error)`.
The field's own hooks are its atoms' tags, which are elements a consumer can
target directly.

## Tokens and hooks

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
- A4: `aria-describedby` names a region only while that region has content. A
  slotted atom is not in the region's `textContent` and an edit to its text fires
  no `slotchange`, so the control decides from the nodes assigned to the slot,
  re-read on `slotchange` and watched by a `MutationObserver` while it has them.
  [Conventions A4](https://github.com/sebakellner/brick-ui/blob/main/docs/conventions-accessibility.md)
- A7: the live region is never removed from the accessibility tree. It is clipped
  to a 1px box while empty, so the announcement is not lost when the text
  appears. [Conventions A7](https://github.com/sebakellner/brick-ui/blob/main/docs/conventions-accessibility.md)
- The flat shape is not supported: written as siblings, the atoms make the input
  visually labelled and silently unnamed — [ADR 0009](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0009-nest-the-field-parts-inside-the-control.md).

## Limitations

- `bk-field-error` is the control's error, not this field's. The control reads
  the text of the atom assigned to its `error` slot, marks itself `aria-invalid`
  and reports that text as `customError`, so the atom alone writes an invalid
  field: no `error` property, no duplicate
  ([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)).
  An atom with no text is not content — nothing is referenced and the field stays
  valid — and a `bk-field-error` is never decorative for a control: writing one is
  a declaration that the field has a problem.
- The field's own `invalid` is still not derived from any of that. It is the
  consumer's attribute, so `bk-field invalid` can paint the atoms of a field whose
  control is valid, and a control can be invalid while `bk-field` reports
  nothing. Two statements, two owners.

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
- An atom paints `invalid` and nothing else. `data-state="disabled"` is written by
  the control that hosts the atom — it reports the state, and the row that owns the
  dim is what paints it ([C5](https://github.com/sebakellner/brick-ui/blob/main/docs/conventions-code.md#c5-a-disabled-control-keeps-its-muted-text-loses-its-hover-and-carries-one-dim)).

It has no `role`, computes no accessible name and carries no validity. The role
belongs to the widget; `bk-field` is structure.

## The atoms

`bk-field-label`, `bk-field-description` and `bk-field-error` are presentational.
They own their type and colour from semantic roles, carry no logic, and work
outside a field — one rendered on its own still lays out and still paints. Each
projects its own text and nothing else, and each one that can be clipped says
for itself that it is empty: `bk-field-description` and `bk-field-error` read
their own light DOM and carry `data-empty` while they hold no text, so the mark no
longer depends on a container noticing it.

### `bk-field-label`

| Slot        | Content        | Notes                                          |
| ----------- | -------------- | ---------------------------------------------- |
| _(default)_ | the label text | paints with `--bk-text-default`, medium weight |

### `bk-field-description`

| Slot        | Content       | Notes                         |
| ----------- | ------------- | ----------------------------- |
| _(default)_ | the help text | paints with `--bk-text-muted` |

### `bk-field-error`

| Slot        | Content     | Notes                          |
| ----------- | ----------- | ------------------------------ |
| _(default)_ | the message | paints with `--bk-text-danger` |
