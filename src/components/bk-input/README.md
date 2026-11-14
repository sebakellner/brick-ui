# `bk-input`

A single-line text field with a real `<label>`, a helper/error message region
and a `bk-change` event.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-input--docs)

```html
<bk-input label="Email" helper="We never share it." placeholder="you@brick.dev"></bk-input>
<bk-input label="Email" error="That address looks wrong." value="you@brick"></bk-input>
```

## Properties

| Property | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `''` | bound to the input with `for`/`id`; omitted when empty |
| `helper` | `helper` | `string` | `''` | shown when there is no `error` |
| `error` | `error` | `string` | `''` | wins over `helper` and over the native message; sets `aria-invalid="true"` and blocks submission; cleared on `input` |
| `value` | `value` | `string` | `''` | |
| `name` | `name` | `string` | `''` | |
| `type` | `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'` | `'text'` | |
| `placeholder` | `placeholder` | `string` | `''` | |
| `autocomplete` | `autocomplete` | `string` | `''` | forwarded to the field (WCAG 1.3.5) |
| `inputMode` | — | `'text' \| 'tel' \| 'url' \| 'email' \| 'numeric' \| 'decimal' \| 'search' \| 'none' \| ''` | `''` | sets `inputmode` on the field |
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets the native `disabled` attribute on the inner field ([ADR 0008](https://github.com/sebakellner/brick-ui/blob/main/docs/adr/0008-keep-the-native-disabled-attribute-on-text-fields.md)) |
| `required` | `required` | `boolean` | `false` | reflected |

## Events

| Event | Detail | Notes |
| --- | --- | --- |
| `bk-change` | `{ value: string }` | `bubbles: true`, `composed: true`; fires like a native `change` |

```js
document.querySelector('bk-input').addEventListener('bk-change', (event) => {
  console.log(event.detail.value);
});
```

## Form API

Inherited from `FormControlMixin`, the same surface a native control offers:

| Member | What it does |
| --- | --- |
| `form` | the owning `<form>`, or `null` |
| `validity`, `validationMessage` | the delegated validity state and its message |
| `checkValidity()`, `reportValidity()` | the platform validation calls |
| `showValidationMessage()` | marks the field touched, so the native message appears |
| `fieldMessage` | the native message the field would show, or `''` |
| `fieldInvalid` | whether the message region is currently reporting a problem |
| `submittedValue` | what `setFormValue` submits; `value` by default, overridden by `bk-checkbox` to submit only while it is checked |

`error` wins over `required`: a field with a message is invalid because of it, and
its validity carries `customError`. A `required` field with no value reports
`valueMissing`.

## The two channels

The field shows one message at a time, from one of two sources:

| Source | Produced by | Shows |
| --- | --- | --- |
| native constraints | the browser: `required`, `type=email`, `pattern`, `minlength` | after the field is touched, or after a failed submit |
| `error` | the consumer, from a schema result or a rejection | immediately, and it wins while it is set |

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

## Parts

| Part | Element |
| --- | --- |
| `label` | the `<label>` |
| `input` | the native `<input>` |
| `message` | the helper/error region |

The message region always exists so screen readers announce an error when it
appears, and collapses with `:empty` when it has nothing to say. It carries
`data-state="error"` while it is showing either channel; the native message is a
problem too, so it is painted as one.

## Tokens

| Token | Paints |
| --- | --- |
| `--bk-input-radius` | corner radius (defaults to `--bk-radius-md`) |
| `--bk-bg-surface` | field surface |
| `--bk-border-default` | field border |
| `--bk-border-strong` | border on hover |
| `--bk-border-danger` | border on error |
| `--bk-text-default` | input text and label |
| `--bk-text-danger` | message on error |
| `--bk-text-muted` | placeholder and message |
| `--bk-bg-surface-muted` | background when disabled |
| `--bk-border-width` | border width |
| `--bk-control-height`, `--bk-space-1`, `--bk-space-3` | height and padding |
| `--bk-font-sans`, `--bk-font-size-sm`, `--bk-font-size-md`, `--bk-line-height-md`, `--bk-font-weight-medium` | typography |
| `--bk-focus-ring`, `--bk-focus-ring-width`, `--bk-focus-ring-offset` | focus ring |
| `--bk-transition` | border transition |

`--bk-input-radius` is the only override hook. The rest are shared roles or base
values: theming the input means theming the roles, not the field.

## Accessibility

- A real `<label>` bound by `for`/`id`; the id is generated once per instance so
  re-renders never break the link.
- `aria-describedby` points at the message region only while it has content.
- `aria-invalid` follows what the message region displays, never what the field
  computes: an invalid field nobody has touched is not marked. The message region
  is `role="status"` and stays in the accessibility tree while empty (visually
  collapsed instead of `display: none`), so an announcement is not lost when the
  text appears.
- `autocomplete` and `inputMode` are forwarded, so a field can identify its
  purpose (WCAG 1.3.5).
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
- `reset()` restores the initial value synchronously, so a reset handler can read
  `FormData` or submit immediately. It also drops `error` and the touched state,
  so a reset form does not come back red. A value the browser restores is not an
  interaction, so it leaves the field untouched.
- The author's `disabled` and a `<fieldset>` disabling the field are separate
  states: re-enabling the fieldset never clears an author-disabled field.
- The field border clears 3:1 against a white surface (WCAG 1.4.11), which the
  tests assert.
- Focus is delegated to the native input.
