# `bk-input`

A single-line text field with a real `<label>`, a helper/error message region
and a `bk-change` event.

[Live stories](https://sebakellner.github.io/brick-ui/?path=/story/components-input--default)

```html
<bk-input label="Email" helper="We never share it." placeholder="you@brick.dev"></bk-input>
<bk-input label="Email" error="That address looks wrong." value="you@brick"></bk-input>
```

## Properties

| Property | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `''` | bound to the input with `for`/`id`; omitted when empty |
| `helper` | `helper` | `string` | `''` | shown when there is no `error` |
| `error` | `error` | `string` | `''` | wins over `helper`; sets `aria-invalid="true"` |
| `value` | `value` | `string` | `''` | |
| `name` | `name` | `string` | `''` | |
| `type` | `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'` | `'text'` | |
| `placeholder` | `placeholder` | `string` | `''` | |
| `disabled` | `disabled` | `boolean` | `false` | reflected |
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

## Parts

| Part | Element |
| --- | --- |
| `label` | the `<label>` |
| `input` | the native `<input>` |
| `message` | the helper/error region |

The message region always exists so screen readers announce an error when it
appears, and collapses with `:empty` when it has nothing to say. It carries
`data-state="error"` only while there is an error.

## Tokens

| Token | Paints |
| --- | --- |
| `--bk-input-bg`, `--bk-input-border-color` | field surface and border |
| `--bk-input-color`, `--bk-input-label-color` | input text and label |
| `--bk-input-radius` | corner radius (defaults to `--bk-radius-md`) |
| `--bk-color-border-strong` | border on hover |
| `--bk-color-danger` | border and message on error |
| `--bk-color-text-muted` | placeholder and message |
| `--bk-color-surface-muted` | background when disabled |
| `--bk-border-width` | border width |
| `--bk-control-height`, `--bk-space-1`, `--bk-space-3` | height and padding |
| `--bk-font-sans`, `--bk-font-size-sm`, `--bk-font-size-md`, `--bk-line-height-md` | typography |
| `--bk-focus-ring`, `--bk-focus-ring-width`, `--bk-focus-ring-offset` | focus ring |
| `--bk-transition` | border transition |

`--bk-input-bg`, `--bk-input-color`, `--bk-input-label-color`,
`--bk-input-border-color` and `--bk-input-radius` are override hooks; the rest
are shared roles.

## Accessibility

- A real `<label>` bound by `for`/`id`; the id is generated once per instance so
  re-renders never break the link.
- `aria-describedby` points at the message region only while it has content.
- `error` sets `aria-invalid="true"` and the region is `aria-live="polite"`.
- Focus is delegated to the native input.
