# `brikka-input`

A single-line text field with a real `<label>`, a description and an error slot,
and a `brikka-change` event.

[Docs page](https://github.com/sebakellner/brikka/?path=/docs/components-input--docs)

```html
<brikka-field>
  <brikka-input name="email" placeholder="you@brikka.dev">
    <brikka-field-label>Email</brikka-field-label>
    <brikka-field-description>We never share it.</brikka-field-description>
  </brikka-input>
</brikka-field>
<brikka-field>
  <brikka-input name="email" value="you@brikka" error="That address looks wrong.">
    <brikka-field-label>Email</brikka-field-label>
  </brikka-input>
</brikka-field>
```

## Usage

A required field, with the browser's own message:

```html
<brikka-field>
  <brikka-input name="email" type="email" required>
    <brikka-field-label>Email</brikka-field-label>
  </brikka-input>
</brikka-field>
```

The message appears once the field is touched or after a failed submit;
`showValidationMessage()` asks for it earlier.

A message your own validation produces:

```html
<brikka-field>
  <brikka-input name="email" error="That address looks wrong.">
    <brikka-field-label>Email</brikka-field-label>
  </brikka-input>
</brikka-field>
```

`error` wins over the description and over the native message, and it clears on `input`:
set it again from the schema result or the rejection.

A message that lives in markup, when the problem has to exist before any JavaScript runs:

```html
<brikka-field>
  <brikka-input name="email">
    <brikka-field-label>Email</brikka-field-label>
    <brikka-field-error>Enter the address on your account.</brikka-field-error>
  </brikka-input>
</brikka-field>
```

An atom with text **is** the field's error and outranks `error`; an atom with no text is
not content, so the field stays valid.

Blocked by the form rather than by the field:

```html
<form>
  <fieldset disabled>
    <brikka-field>
      <brikka-input name="email"><brikka-field-label>Email</brikka-field-label></brikka-input>
    </brikka-field>
  </fieldset>
</form>
```

The inner native field is the one that is disabled, so the field leaves the tab order —
unlike `brikka-button` and `brikka-checkbox`, which keep it and announce `aria-disabled`.

## Attributes and properties

| Property       | Attribute      | Type                                                                                        | Default  | Notes                                                                                                                                                                                                               |
| -------------- | -------------- | ------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`        | `error`        | `string`                                                                                    | `''`     | the message from JavaScript; wins over the description and over the native message, and loses to a slotted `brikka-field-error` that has text; sets `aria-invalid="true"` and blocks submission; cleared on `input` |
| `value`        | `value`        | `string`                                                                                    | `''`     |                                                                                                                                                                                                                     |
| `name`         | `name`         | `string`                                                                                    | `''`     |                                                                                                                                                                                                                     |
| `type`         | `type`         | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'`                             | `'text'` |                                                                                                                                                                                                                     |
| `placeholder`  | `placeholder`  | `string`                                                                                    | `''`     |                                                                                                                                                                                                                     |
| `autocomplete` | `autocomplete` | `string`                                                                                    | `''`     | forwarded to the field (WCAG 1.3.5)                                                                                                                                                                                 |
| `inputMode`    | `inputMode`    | `'text' \| 'tel' \| 'url' \| 'email' \| 'numeric' \| 'decimal' \| 'search' \| 'none' \| ''` | `''`     | sets `inputmode` on the field                                                                                                                                                                                       |
| `disabled`     | `disabled`     | `boolean`                                                                                   | `false`  | reflected; sets the native `disabled` attribute on the inner field                                                                                                                                                  |
| `required`     | `required`     | `boolean`                                                                                   | `false`  | reflected; announces the state and marks the label with a `*` when there is one                                                                                                                                     |

## Slots

| Slot          | Content                    | Notes                                                                                                                                                                                                                           |
| ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `brikka-field-label`       | rendered inside the `<label>` bound to the input with `for`/`id`; the slot is the only label, and the field is unnamed while it is empty                                                                                        |
| `description` | `brikka-field-description` | the help text; `aria-describedby` names the region while it has content                                                                                                                                                         |
| `error`       | `brikka-field-error`       | the problem, rendered in the `role="status"` region; an atom with text **is** the field's error (marks the field invalid, blocks submission) and wins over the `error` property; the description is hidden while it has content |

What the description and the error slots hold is the consumer's text. A
`brikka-field-error` with text is the field's error, and `error` is the same channel
written from JavaScript: the atom wins while it has text, and the property comes
back when the atom's text goes. An atom with no text is not content — nothing is
referenced and the field stays valid. The atoms need no `slot` attribute inside a
`brikka-field`, which assigns them by tag name.

## Events

| Event           | Detail              | Notes                                                           |
| --------------- | ------------------- | --------------------------------------------------------------- |
| `brikka-change` | `{ value: string }` | `bubbles: true`, `composed: true`; fires like a native `change` |

```js
document.querySelector('brikka-input').addEventListener('brikka-change', (event) => {
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

| Token                                                                                                                            | Paints                                           |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `--brikka-input-radius`                                                                                                          | corner radius (defaults to `--brikka-radius-md`) |
| `--brikka-bg-surface`                                                                                                            | field surface                                    |
| `--brikka-border-default`                                                                                                        | field border                                     |
| `--brikka-border-strong`                                                                                                         | border on hover                                  |
| `--brikka-border-danger`                                                                                                         | border on error                                  |
| `--brikka-text-default`                                                                                                          | input text and label                             |
| `--brikka-text-danger`                                                                                                           | message on error, label while invalid, `*`       |
| `--brikka-text-muted`                                                                                                            | placeholder, message, the value while disabled   |
| `--brikka-opacity-disabled`                                                                                                      | the field and its label row while disabled       |
| `--brikka-border-width`                                                                                                          | border width                                     |
| `--brikka-control-height`, `--brikka-space-1`, `--brikka-space-2`, `--brikka-space-3`                                            | height, padding and the gap under the label      |
| `--brikka-font-sans`, `--brikka-font-size-sm`, `--brikka-font-size-md`, `--brikka-line-height-md`, `--brikka-font-weight-medium` | typography                                       |
| `--brikka-focus-ring`, `--brikka-focus-ring-width`, `--brikka-focus-ring-offset`                                                 | focus ring                                       |
| `--brikka-transition`                                                                                                            | border transition                                |

`--brikka-input-radius` is the only override hook. The rest are shared roles or base
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
- A slotted `brikka-field-error` with text is the field's error: the same text is
  what the region shows, what `aria-invalid` marks and what `customError` blocks
  the submit with, so the announcement and the form cannot disagree. An empty atom
  is invisible to assistive technology — no reference and no invalidity — and the
  control watches the text of the atom it was given, so an edit to the node updates
  the validity without a re-assignment.
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
  leaves the tab order. That is unlike `brikka-button` and `brikka-checkbox`, which keep
  `aria-disabled` so a keyboard user can still reach them and be told why they are
  unavailable: the split follows what is blocked, and only a control whose job is
  an action has to stay reachable to answer for itself. A disabled field also
  submits nothing and reports no error, so it never blocks a submit it cannot take
  part in.
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

| Member                                | Notes                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `form`                                | the owning `<form>`, or `null`                                                                                      |
| `validity`, `validationMessage`       | the delegated validity state and its message                                                                        |
| `checkValidity()`, `reportValidity()` | the platform validation calls                                                                                       |
| `showValidationMessage()`             | marks the field touched, so the native message appears                                                              |
| `fieldMessage`                        | the native message the field would show, or `''`                                                                    |
| `fieldError`                          | the message the field owns: the text of the `error` slot when it has any, otherwise `error`                         |
| `fieldInvalid`                        | whether the message region is currently reporting a problem                                                         |
| `submittedValue`                      | what `setFormValue` submits; `value` by default, overridden by `brikka-checkbox` to submit only while it is checked |

`error` wins over `required`: a field with a message is invalid because of it, and
its validity carries `customError`. A `required` field with no value reports
`valueMissing`.

## The two channels

The field shows one message at a time, from one of three sources:

| Source                           | Produced by                                                   | Shows                                                   |
| -------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| native constraints               | the browser: `required`, `type=email`, `pattern`, `minlength` | after the field is touched, or after a failed submit    |
| `error`                          | the consumer, from a schema result or a rejection             | immediately, and it wins while it is set                |
| a `brikka-field-error` with text | the consumer, in markup                                       | immediately, and it wins over `error` while it has text |

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
`brikka-field-label` hosted through the `label` slot — as `data-state`:

| Value      | When                                               | Paints                      |
| ---------- | -------------------------------------------------- | --------------------------- |
| `invalid`  | `error` is set, or the native message is showing   | `--brikka-text-danger`      |
| `disabled` | `disabled`, or the field is inside a disabled form | `--brikka-opacity-disabled` |

A field that is both is painted with the danger colour and still dimmed: the
colour is the state's and the dim is the fact's. `data-state` carries one value
and `invalid` wins it, so the label also carries `data-disabled` while the field
is unavailable, and the dim is read from that. The field itself takes the same
opacity through `:disabled`.

A label with no state keeps `--brikka-text-default`, and a standalone
`brikka-field-label` paints the same way from its own `data-state`.

The dim is applied where the state is: the label row and the `<input>` each take
it once, and a `brikka-field-label` hosted through the `label` slot is dimmed by the
row it sits in, not a second time on its own.

A `required` field marks its label with a `*` (`part="required"`,
`aria-hidden="true"`) in `--brikka-text-danger`, the same role as the error text. It
sits on the label's line, so a slotted `brikka-field-label` does not push it to its
own row. The mark is not rendered while the field has no label, and it is never
the only signal — the native `required` attribute is what announces the state.
