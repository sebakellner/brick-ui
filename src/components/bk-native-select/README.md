# `bk-native-select`

The platform's `<select>`, with its options written as atoms. The native control
stays the control — its arrow, its keyboard and its mobile picker are its own —
and the atoms in the light DOM are mirrored into real `<option>` and `<optgroup>`
elements inside the shadow root.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/form-native-select--docs)

```html
<bk-field>
  <bk-native-select name="channel" placeholder="Choose a channel">
    <bk-field-label>Channel</bk-field-label>
    <bk-native-select-opt value="email">Email</bk-native-select-opt>
    <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
    <bk-field-description>Where we send the receipt.</bk-field-description>
  </bk-native-select>
</bk-field>
```

## Attributes and properties

| Property      | Attribute     | Type      | Default | Notes                                                                                                                                                                                           |
| ------------- | ------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `value`       | `string`  | `''`    | the selected atom's value; setting it selects the matching `<option>`, and a value set before the options exist is applied as soon as they arrive                                               |
| `placeholder` | `placeholder` | `string`  | `''`    | renders a first `<option value="" disabled hidden>` with that text, so "nothing selected" has a face; with no placeholder the first option is what the user sees, exactly as in a native select |
| `name`        | `name`        | `string`  | `''`    | the entry the value submits under                                                                                                                                                               |
| `disabled`    | `disabled`    | `boolean` | `false` | reflected; the native attribute on the inner `<select>` ([ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md))      |
| `required`    | `required`    | `boolean` | `false` | reflected; the native attribute on the inner `<select>`, so `valueMissing` is the browser's                                                                                                     |
| `error`       | `error`       | `string`  | `''`    | the message from JavaScript; paints the label, fills the error region, sets `aria-invalid="true"` and blocks submission                                                                         |

### `bk-native-select-opt`

| Property   | Attribute  | Type      | Default | Notes                                      |
| ---------- | ---------- | --------- | ------- | ------------------------------------------ |
| `value`    | `value`    | `string`  | `''`    | the `<option>`'s value                     |
| `disabled` | `disabled` | `boolean` | `false` | reflected; the `<option>`'s disabled state |

| Slot        | Content                | Notes                                                                                                                   |
| ----------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| _(default)_ | the text of the option | it is the option's label. There is no rich content: an `<option>` holds text, and an element inside it is silently lost |

### `bk-native-select-opt-group`

| Property   | Attribute  | Type      | Default | Notes                                        |
| ---------- | ---------- | --------- | ------- | -------------------------------------------- |
| `label`    | `label`    | `string`  | `''`    | the `<optgroup>`'s label                     |
| `disabled` | `disabled` | `boolean` | `false` | reflected; the `<optgroup>`'s disabled state |

| Slot        | Content                             | Notes                                  |
| ----------- | ----------------------------------- | -------------------------------------- |
| _(default)_ | the `bk-native-select-opt` children | they become the `<optgroup>`'s options |

It holds `bk-native-select-opt` children. A group inside a group is not
rendered: the platform has no nested `<optgroup>`, so the inner group and its
options are left out of the mirror.

Both atoms are `display: none`. They carry data, not layout, and the accessible
name lives on the real `<option>` inside the select.

## Slots

| Slot          | Content                | Notes                                                                                           |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `label`       | `bk-field-label`       | rendered inside the `<label>` bound to the select with `for`/`id`                               |
| `description` | `bk-field-description` | the help text; `aria-describedby` names the region while it has content                         |
| `error`       | `bk-field-error`       | the problem, rendered in the `role="status"` region; an atom with text **is** the field's error |

There is no default slot: the atoms are the select's data, not projected
content, so nothing is distributed into the shadow root except the three regions
above.

## Events

| Event       | Detail              | Notes                                                             |
| ----------- | ------------------- | ----------------------------------------------------------------- |
| `bk-change` | `{ value: string }` | `bubbles: true`, `composed: true`; fires on the select's `change` |

```js
document.querySelector('bk-native-select').addEventListener('bk-change', (event) => {
  console.log(event.detail.value);
});
```

## Parts

| Part          | Element                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `label`       | the `<label>`, carrying `data-state` when the field is invalid or disabled, and `data-disabled` while it is disabled |
| `input`       | the native `<select>`                                                                                                |
| `caret`       | the arrow drawn over the native `<select>`, `aria-hidden`                                                            |
| `required`    | the `*` that marks a required field, `aria-hidden`                                                                   |
| `message`     | the container of the two regions                                                                                     |
| `description` | the help region                                                                                                      |
| `error`       | the error region, `role="status"`                                                                                    |

The label state, the message regions and the `*` are the shared field anatomy:
`bk-input` and this component paint them the same way, from the same code.

## Tokens and hooks

| Token                                                                                                        | Paints                                       |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `--bk-bg-surface`                                                                                            | control surface                              |
| `--bk-border-default`                                                                                        | control border                               |
| `--bk-border-strong`                                                                                         | border on hover                              |
| `--bk-border-danger`                                                                                         | border on error                              |
| `--bk-text-default`                                                                                          | control text and label                       |
| `--bk-text-danger`                                                                                           | message on error, label while invalid, `*`   |
| `--bk-text-muted`                                                                                            | message, the value while disabled            |
| `--bk-opacity-disabled`                                                                                      | the control and its label row while disabled |
| `--bk-border-width`                                                                                          | border width                                 |
| `--bk-control-height`, `--bk-space-1`, `--bk-space-2`, `--bk-space-3`                                        | height, padding and the gap under the label  |
| `--bk-radius-md`                                                                                             | corner radius                                |
| `--bk-font-sans`, `--bk-font-size-sm`, `--bk-font-size-md`, `--bk-line-height-md`, `--bk-font-weight-medium` | typography                                   |
| `--bk-focus-ring`, `--bk-focus-ring-width`, `--bk-focus-ring-offset`                                         | focus ring                                   |
| `--bk-transition`                                                                                            | border transition                            |

There is no override hook of this component's own: it paints the roles the input
already paints, and theming the select means theming those roles.

## Accessibility

- The control is the real `<select>` in the shadow root, returned from
  `formControlElement`. Selection, keyboard, the mobile picker and the native
  validation message are the platform's, and nothing about them is reimplemented.
- The atoms are data. `bk-native-select-opt` and `bk-native-select-opt-group`
  render nothing (`display: none`), and the accessible name of an option is the
  text of the real `<option>` the component built from it.
- The label is a real `<label>` bound with `for`/`id`; the id is generated once
  per instance, so re-renders never break the link. The name comes from the
  `label` slot — a field whose slot is empty stays unnamed rather than named by
  an attribute.
- `disabled` is the native attribute on the inner select: the platform removes it
  from the tab order, and constraint validation is the browser's. A select is
  text-field-shaped, so it follows the input and not the button
  ([ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md)).
- `aria-describedby` points at the error region while it has content, otherwise
  at the description region. `aria-invalid` follows what the error region
  displays.
- The label colour is reinforcement, never the signal: the border,
  `aria-invalid` and the message region carry the error.
- Focus is delegated to the native select.

## Limitations

- `multiple` is out of scope: it changes the widget — several values in
  `FormData`, a platform-sized box, no per-option hint pattern — and deserves its
  own document.
- A group inside a group is not rendered. The platform has no nested
  `<optgroup>`, so the inner group and its options do not reach the mirror.
- The options are text only. An `<option>` cannot carry an element, so no atom
  inside `bk-native-select-opt` is rendered.

## Why the options are atoms

A `<select>` accepts no slots: its only children are `option`, `optgroup` and
`hr`. So the declarative shape lives outside the select — the consumer writes
`bk-native-select-opt` and `bk-native-select-opt-group` — and the component
builds the real options inside it. The consumer's nodes are never moved and never
removed; they are read, and the mirror is rebuilt from them.

A custom-drawn select is a different component. This one shows the real
`<select>`, so there is no overlay, no display input and no keyboard
reimplementation.

## Form API

Inherited from `FormControlMixin`, the same surface a native control offers:
`form`, `validity`, `validationMessage`, `checkValidity()`, `reportValidity()`,
`showValidationMessage()`, `fieldMessage`, `fieldError`, `fieldInvalid`.

`submittedValue` is the selected value, and a select with nothing selected
contributes no entry at all — the hidden placeholder is not an answer. A
disabled select submits nothing, and a disabled one reports no error, so it never
blocks a submit it cannot take part in.

`value` reports the option the platform selected: with no placeholder the
browser selects the first option, so that option's value is the field's value.
