# `bk-checkbox`

A checkbox with a real `<label>`, a helper/error message region and a
`bk-change` event.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-checkbox--docs)

```html
<bk-checkbox label="Accept the terms" helper="You can change this later."></bk-checkbox>
<bk-checkbox label="Accept the terms" checked></bk-checkbox>
<bk-checkbox label="Accept the terms" error="You have to accept the terms."></bk-checkbox>
```

## Attributes and properties

| Property | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `''` | the visible text, bound to the box with `for`/`id`; the box renders alone when empty |
| `helper` | `helper` | `string` | `''` | shown when there is no `error` |
| `error` | `error` | `string` | `''` | wins over `helper` and over the native message; sets `aria-invalid="true"` and blocks submission; cleared on `input` |
| `checked` | `checked` | `boolean` | `false` | the state. The attribute is the default the form returns to on reset, like the platform's `defaultChecked`; the property is not reflected, so the attribute stays what the author wrote |
| `value` | `value` | `string` | `''` | submits as `on` while checked, and submits nothing while unchecked |
| `name` | `name` | `string` | `''` | |
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets `aria-disabled` on the inner checkbox and blocks activation |
| `required` | `required` | `boolean` | `false` | reflected; the field is invalid until it is checked |

## Events

| Event | Detail | Notes |
| --- | --- | --- |
| `bk-change` | `{ checked: boolean }` | `bubbles: true`, `composed: true`; fires like a native `change` |

```js
document.querySelector('bk-checkbox').addEventListener('bk-change', (event) => {
  console.log(event.detail.checked);
});
```

## Parts

| Part | Element |
| --- | --- |
| `label` | the `<label>` row: the box and the text |
| `input` | the native `<input type="checkbox">` |
| `box` | the painted square |
| `message` | the helper/error region |

The message region always exists so screen readers announce an error when it
appears, and collapses with `:empty` when it has nothing to say.

## Override hooks

| Hook | Paints |
| --- | --- |
| `--bk-checkbox-size` | the edge of the painted box (defaults to `--bk-space-4`) |
| `--bk-checkbox-radius` | corner radius (defaults to `--bk-radius-sm`) |

Everything else the box paints is a shared role or base token: theming the
checkbox means theming the roles, not the field.

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
- The painted box is `aria-hidden` decoration. Everything the assistive
  technology reads — `checked`, `aria-invalid`, `aria-disabled`,
  `aria-describedby` — lives on the native input.
- The focus ring is drawn on the box through `:focus-visible` on the input, so it
  appears for keyboard focus and not for a mouse click.
- The box boundary, the check and the focus ring each clear 3:1 against what they
  sit on (WCAG 1.4.11). The suite asserts all three, in both themes.
- `disabled` sets `aria-disabled` on the inner checkbox and cancels the click:
  the control stays in the tab order and is announced as unavailable, while
  Space and the label stop changing it. A native `disabled` input would be
  skipped entirely, which hides it from someone navigating with a screen reader.
- `aria-describedby` points at the message region only while it has content, and
  the region is `role="status"` while visually collapsed.
- **Form-associated** through `ElementInternals`: a checked box submits under
  `name`, an unchecked one submits nothing, `required` reports `valueMissing`,
  `error` reports `customError`, a disabled `<fieldset>` disables the field, and
  `reset()` restores the authored `checked` attribute and drops `error`.

## Limitations

- No `indeterminate`. A tri-state box needs a decision on what it submits, and
  that decision is not made yet.
- No group. Several boxes sharing a `name` are several elements plus the
  consumer's mapping, not a `bk-checkbox-group`.
- A value the browser restores after a navigation comes back as the submitted
  `value`, not as `checked`, so a restored box can render unchecked.
