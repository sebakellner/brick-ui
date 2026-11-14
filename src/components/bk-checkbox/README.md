# `bk-checkbox`

A checkbox with a real `<label>`, helper and error slots, and a `bk-change`
event. The label sits beside the box, never above it.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-checkbox--docs)

```html
<bk-checkbox label="Accept the terms" helper="You can change this later."></bk-checkbox>
<bk-checkbox label="Accept the terms" checked></bk-checkbox>
<bk-checkbox label="Accept the terms" error="You have to accept the terms."></bk-checkbox>

<bk-field>
  <bk-checkbox name="terms" required>
    <bk-field-label>Accept the terms</bk-field-label>
    <bk-field-description>You can change this later.</bk-field-description>
  </bk-checkbox>
</bk-field>
```

## Attributes and properties

| Property   | Attribute  | Type      | Default | Notes                                                                                                                                                                                   |
| ---------- | ---------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`    | `label`    | `string`  | `''`    | fallback for the `label` slot; the box renders alone when neither is present                                                                                                            |
| `helper`   | `helper`   | `string`  | `''`    | fallback for the `description` slot; shown when there is no `error`                                                                                                                     |
| `error`    | `error`    | `string`  | `''`    | fallback for the `error` slot; wins over `helper` and over the native message; sets `aria-invalid="true"` and blocks submission; cleared on `input`                                     |
| `checked`  | `checked`  | `boolean` | `false` | the state. The attribute is the default the form returns to on reset, like the platform's `defaultChecked`; the property is not reflected, so the attribute stays what the author wrote |
| `value`    | `value`    | `string`  | `''`    | submits as `on` while checked, and submits nothing while unchecked                                                                                                                      |
| `name`     | `name`     | `string`  | `''`    |                                                                                                                                                                                         |
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets `aria-disabled` on the inner checkbox and blocks activation                                                                                                             |
| `required` | `required` | `boolean` | `false` | reflected; the field is invalid until it is checked                                                                                                                                     |

## Slots

| Slot          | Receives                                                      | Fallback property |
| ------------- | ------------------------------------------------------------- | ----------------- |
| `label`       | the name of the box, beside the box                           | `label`           |
| `description` | the help text, under the label row                            | `helper`          |
| `error`       | the error message; replaces the description while it has text | `error`           |

The slot content wins; the property is what the slot falls back to when nothing
is assigned, so both shapes work at once and no public surface was removed.

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

| Part          | Element                                  |
| ------------- | ---------------------------------------- |
| `label`       | the `<label>` row: the box and the label |
| `input`       | the native `<input type="checkbox">`     |
| `box`         | the painted square                       |
| `message`     | the container of the two message regions |
| `description` | the help region                          |
| `error`       | the error region, `role="status"`        |

Both message regions always exist so screen readers announce an error when it
appears. The description is hidden while the error has text, and an empty region
is collapsed with `data-empty` instead of being removed, so it stays in the
accessibility tree. The part names do not move with the state: `description`
keeps its name while the error shows.

The label is inline beside the box by design. The row is the checkbox's own
layout, so no `orientation` decides it and the field never reaches into it.

## Override hooks

| Hook                   | Paints                                                   |
| ---------------------- | -------------------------------------------------------- |
| `--bk-checkbox-size`   | the edge of the painted box (defaults to `--bk-space-4`) |
| `--bk-checkbox-radius` | corner radius (defaults to `--bk-radius-sm`)             |

Everything else the box paints is a shared role or base token: theming the
checkbox means theming the roles, not the field.

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
- The painted box is `aria-hidden` decoration. Everything the assistive
  technology reads — `checked`, `aria-invalid`, `aria-disabled`,
  `aria-describedby` — lives on the native input.
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
  `error` reports `customError`, a disabled `<fieldset>` disables the field, and
  `reset()` restores the authored `checked` attribute and drops `error`. A
  disabled box submits nothing and reports no error, like a native one.

## Limitations

- No `indeterminate`. A tri-state box needs a decision on what it submits, and
  that decision is not made yet.
- No group. Several boxes sharing a `name` are several elements plus the
  consumer's mapping, not a `bk-checkbox-group`.
- A value the browser restores after a navigation comes back as the submitted
  `value`, not as `checked`, so a restored box can render unchecked.
