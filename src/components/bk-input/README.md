# `bk-input`

A single-line text field with a real `<label>`, a description and an error slot,
and a `bk-change` event.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-input--docs)

```html
<bk-field>
  <bk-input name="email" placeholder="you@brick.dev">
    <bk-field-label>Email</bk-field-label>
    <bk-field-description>We never share it.</bk-field-description>
  </bk-input>
</bk-field>
<bk-field>
  <bk-input name="email" value="you@brick" error="That address looks wrong.">
    <bk-field-label>Email</bk-field-label>
  </bk-input>
</bk-field>
```

## Usage

A required field, with the browser's own message:

```html
<bk-field>
  <bk-input name="email" type="email" required>
    <bk-field-label>Email</bk-field-label>
  </bk-input>
</bk-field>
```

The message appears once the field is touched or after a failed submit;
`showValidationMessage()` asks for it earlier.

A message your own validation produces:

```html
<bk-field>
  <bk-input name="email" error="That address looks wrong.">
    <bk-field-label>Email</bk-field-label>
  </bk-input>
</bk-field>
```

`error` wins over the description and over the native message, and it clears on `input`:
set it again from the schema result or the rejection.

A message that lives in markup, when the problem has to exist before any JavaScript runs:

```html
<bk-field>
  <bk-input name="email">
    <bk-field-label>Email</bk-field-label>
    <bk-field-error>Enter the address on your account.</bk-field-error>
  </bk-input>
</bk-field>
```

An atom with text **is** the field's error and outranks `error`; an atom with no text is
not content, so the field stays valid.

Blocked by the form rather than by the field:

```html
<form>
  <fieldset disabled>
    <bk-field>
      <bk-input name="email"><bk-field-label>Email</bk-field-label></bk-input>
    </bk-field>
  </fieldset>
</form>
```

The inner native field is the one that is disabled, so the field leaves the tab order —
unlike `bk-button` and `bk-checkbox`, which keep it and announce `aria-disabled`
([ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md)).

## Attributes and properties

| Property       | Attribute      | Type                                                                                        | Default  | Notes                                                                                                                                                                                                           |
| -------------- | -------------- | ------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`        | `error`        | `string`                                                                                    | `''`     | the message from JavaScript; wins over the description and over the native message, and loses to a slotted `bk-field-error` that has text; sets `aria-invalid="true"` and blocks submission; cleared on `input` |
| `value`        | `value`        | `string`                                                                                    | `''`     |                                                                                                                                                                                                                 |
| `name`         | `name`         | `string`                                                                                    | `''`     |                                                                                                                                                                                                                 |
| `type`         | `type`         | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'`                             | `'text'` |                                                                                                                                                                                                                 |
| `placeholder`  | `placeholder`  | `string`                                                                                    | `''`     |                                                                                                                                                                                                                 |
| `autocomplete` | `autocomplete` | `string`                                                                                    | `''`     | forwarded to the field (WCAG 1.3.5)                                                                                                                                                                             |
| `inputMode`    | `inputMode`    | `'text' \| 'tel' \| 'url' \| 'email' \| 'numeric' \| 'decimal' \| 'search' \| 'none' \| ''` | `''`     | sets `inputmode` on the field                                                                                                                                                                                   |
| `disabled`     | `disabled`     | `boolean`                                                                                   | `false`  | reflected; sets the native `disabled` attribute on the inner field ([ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md))           |
| `required`     | `required`     | `boolean`                                                                                   | `false`  | reflected; announces the state and marks the label with a `*` when there is one                                                                                                                                 |

## Slots

| Slot          | Content                | Notes                                                                                                                                                                                                                           |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `bk-field-label`       | rendered inside the `<label>` bound to the input with `for`/`id`; the slot is the only label, and the field is unnamed while it is empty                                                                                        |
| `description` | `bk-field-description` | the help text; `aria-describedby` names the region while it has content                                                                                                                                                         |
| `error`       | `bk-field-error`       | the problem, rendered in the `role="status"` region; an atom with text **is** the field's error (marks the field invalid, blocks submission) and wins over the `error` property; the description is hidden while it has content |

What the description and the error slots hold is the consumer's text. A
`bk-field-error` with text is the field's error, and `error` is the same channel
written from JavaScript: the atom wins while it has text, and the property comes
back when the atom's text goes. An atom with no text is not content — nothing is
referenced and the field stays valid
([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)).
The atoms need no `slot` attribute inside a `bk-field`, which assigns them by
tag name.

## Events

| Event       | Detail              | Notes                                                           |
| ----------- | ------------------- | --------------------------------------------------------------- |
| `bk-change` | `{ value: string }` | `bubbles: true`, `composed: true`; fires like a native `change` |

```js
document.querySelector('bk-input').addEventListener('bk-change', (event) => {
  console.log(event.detail.value);
});
```

## Parts

| Part          | Element                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `label`       | the `<label>`, carrying `data-state` when the field is invalid or disabled, and `data-disabled` while it is disabled |
| `input`       | the native `<input>`                                                                                                 |
| `required`    | the `*` that marks a required field, `aria-hidden`                                                                   |
| `message`     | the container of the two regions                                                                                     |
| `description` | the help region                                                                                                      |
| `error`       | the error region, `role="status"`                                                                                    |

The two regions always exist so screen readers announce an error when it
appears: the description is hidden while the error has text, and an empty region
is collapsed with `data-empty` instead of being removed, so it stays in the
accessibility tree. The error region always carries `data-state="error"`, which
names it as the region that paints a problem, whichever channel fills it; whether
it holds a message is `data-empty`, not that attribute.

## Tokens and hooks

| Token                                                                                                        | Paints                                         |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `--bk-input-radius`                                                                                          | corner radius (defaults to `--bk-radius-md`)   |
| `--bk-bg-surface`                                                                                            | field surface                                  |
| `--bk-border-default`                                                                                        | field border                                   |
| `--bk-border-strong`                                                                                         | border on hover                                |
| `--bk-border-danger`                                                                                         | border on error                                |
| `--bk-text-default`                                                                                          | input text and label                           |
| `--bk-text-danger`                                                                                           | message on error, label while invalid, `*`     |
| `--bk-text-muted`                                                                                            | placeholder, message, the value while disabled |
| `--bk-opacity-disabled`                                                                                      | the field and its label row while disabled     |
| `--bk-border-width`                                                                                          | border width                                   |
| `--bk-control-height`, `--bk-space-1`, `--bk-space-2`, `--bk-space-3`                                        | height, padding and the gap under the label    |
| `--bk-font-sans`, `--bk-font-size-sm`, `--bk-font-size-md`, `--bk-line-height-md`, `--bk-font-weight-medium` | typography                                     |
| `--bk-focus-ring`, `--bk-focus-ring-width`, `--bk-focus-ring-offset`                                         | focus ring                                     |
| `--bk-transition`                                                                                            | border transition                              |

`--bk-input-radius` is the only override hook. The rest are shared roles or base
values: theming the input means theming the roles, not the field.

## Accessibility

- A real `<label>` bound by `for`/`id`; the id is generated once per instance so
  re-renders never break the link, and the name comes from the `label` slot — a
  field whose slot is empty stays unnamed rather than named by an attribute.
- `aria-describedby` points at the error region while it has content, otherwise
  at the description region. `aria-invalid` follows what the error region
  displays, never what the field computes: an invalid field nobody has touched is
  not marked. The error region is `role="status"` and stays in the accessibility
  tree while empty (visually collapsed instead of `display: none`), so an
  announcement is not lost when the text appears.
- A slotted `bk-field-error` with text is the field's error
  ([ADR 0011](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0011-a-slotted-error-atom-is-the-fields-error.md)):
  the same text is what the region shows, what `aria-invalid` marks and what
  `customError` blocks the submit with, so the announcement and the form cannot
  disagree. An empty atom is invisible to assistive technology — no reference and
  no invalidity — and the control watches the text of the atom it was given, so an
  edit to the node updates the validity without a re-assignment.
- `autocomplete` and `inputMode` are forwarded, so a field can identify its
  purpose (WCAG 1.3.5).
- The label colour is reinforcement, never the signal (WCAG 1.4.1): the border,
  `aria-invalid` and the message region carry the error, the native `required`
  attribute carries "required", and the `*` is `aria-hidden` decoration.
- **Form-associated**: the element takes part in a `<form>` — its `value`
  submits under `name`, the form can disable it, and constraint validation
  reflects `required` and `error` through `ElementInternals`.
- `disabled` uses the native attribute on the inner field: typed text, autofill,
  the pointer and constraint validation are the browser's to refuse, and the field
  leaves the tab order. That is unlike `bk-button` and `bk-checkbox`, which keep
  `aria-disabled` so a keyboard user can still reach them and be told why they are
  unavailable — [ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md)
  records why the two shapes differ. A disabled field also submits nothing and
  reports no error, so it never blocks a submit it cannot take part in.
- `reset()` restores the default: the `value` attribute, read when the reset
  happens — the contract a native `<input>` has for its `defaultValue`, not a
  snapshot of the value the field held when it mounted. It is synchronous, so a
  reset handler can read `FormData` or submit immediately. It also drops `error`
  and the touched state, so a reset form does not come back red. A value the
  browser restores is not an interaction, so it leaves the field untouched.
- The author's `disabled` and a `<fieldset>` disabling the field are separate
  states: re-enabling the fieldset never clears an author-disabled field.
- The field border clears 3:1 against a white surface (WCAG 1.4.11), which the
  tests assert.
- Focus is delegated to the native input.

## Form API

Inherited from `FormControlMixin`, the same surface a native control offers:

| Member                                | Notes                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `form`                                | the owning `<form>`, or `null`                                                                                  |
| `validity`, `validationMessage`       | the delegated validity state and its message                                                                    |
| `checkValidity()`, `reportValidity()` | the platform validation calls                                                                                   |
| `showValidationMessage()`             | marks the field touched, so the native message appears                                                          |
| `fieldMessage`                        | the native message the field would show, or `''`                                                                |
| `fieldError`                          | the message the field owns: the text of the `error` slot when it has any, otherwise `error`                     |
| `fieldInvalid`                        | whether the message region is currently reporting a problem                                                     |
| `submittedValue`                      | what `setFormValue` submits; `value` by default, overridden by `bk-checkbox` to submit only while it is checked |

`error` wins over `required`: a field with a message is invalid because of it, and
its validity carries `customError`. A `required` field with no value reports
`valueMissing`.

## The two channels

The field shows one message at a time, from one of three sources:

| Source                       | Produced by                                                   | Shows                                                   |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| native constraints           | the browser: `required`, `type=email`, `pattern`, `minlength` | after the field is touched, or after a failed submit    |
| `error`                      | the consumer, from a schema result or a rejection             | immediately, and it wins while it is set                |
| a `bk-field-error` with text | the consumer, in markup                                       | immediately, and it wins over `error` while it has text |

The atom outranks the property because markup is the more specific statement. A
template that writes both had not decided, and the sentence the consumer left
next to the control is the one that shows, announces and blocks.

The native message is the browser's own, in the browser's locale.
`showValidationMessage()` reports the native message explicitly, for the submits
the browser cannot run: an intercepted submit, or a form with `novalidate`.

```js
const result = schema.safeParse({ email });
emailInput.error = result.success ? '' : result.error.issues[0].message;
```

A form with `novalidate` never shows a native message, so only `error` appears
there. The store stays the consumer's: the field does not call a schema, run an
async rule, or translate a message.

## Label state

The control writes its state on its own label — this `<label>`, and a
`bk-field-label` hosted through the `label` slot — as `data-state`:

| Value      | When                                               | Paints                  |
| ---------- | -------------------------------------------------- | ----------------------- |
| `invalid`  | `error` is set, or the native message is showing   | `--bk-text-danger`      |
| `disabled` | `disabled`, or the field is inside a disabled form | `--bk-opacity-disabled` |

A field that is both is painted with the danger colour and still dimmed: the
colour is the state's and the dim is the fact's. `data-state` carries one value
and `invalid` wins it, so the label also carries `data-disabled` while the field
is unavailable, and the dim is read from that. The field itself takes the same
opacity through `:disabled`.

A label with no state keeps `--bk-text-default`, and a standalone
`bk-field-label` paints the same way from its own `data-state`.

The dim is applied where the state is: the label row and the `<input>` each take
it once, and a `bk-field-label` hosted through the `label` slot is dimmed by the
row it sits in, not a second time on its own.

A `required` field marks its label with a `*` (`part="required"`,
`aria-hidden="true"`) in `--bk-text-danger`, the same role as the error text. It
sits on the label's line, so a slotted `bk-field-label` does not push it to its
own row. The mark is not rendered while the field has no label, and it is never
the only signal — the native `required` attribute is what announces the state.
