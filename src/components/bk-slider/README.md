# `bk-slider`

A slider: one real `<input type="range">` per thumb, painted with a track, the run
it fills and a thumb, in the field row that carries the label and the message
regions. One thumb, or two — `value` and `value-end` — and never three.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/form-slider--docs)

```html
<bk-field>
  <bk-slider name="volume" value="40">
    <bk-field-label>Volume</bk-field-label>
    <bk-field-description>The room the speaker fills.</bk-field-description>
  </bk-slider>
</bk-field>
<bk-field>
  <bk-slider name="price" min="0" max="100" value="20" value-end="80">
    <bk-field-label>Price</bk-field-label>
  </bk-slider>
</bk-field>
```

A slider chooses a number by its place in a range. Reach for it when the position
is the decision and the exact number follows from where the user stopped; when the
number itself is what the user knows and will type, that is a text field. Two
thumbs mark the lower and the upper end of one span, and a third is out of scope:
it doubles the focus, the keyboard and the form problem for a case nothing asks
for. There is no group — each slider is one control with its own label, message and
validity.

## Attributes and properties

| Property       | Attribute        | Type                         | Default        | Notes                                                                                                                                                                                                                         |
| -------------- | ---------------- | ---------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`        | `value`          | `number`                     | `0`            | the lower thumb, and the only thumb while `value-end` is unset; while the pair is set, `value` is clamped to `value-end` when it is written — the lower thumb stops at the upper one, and nothing swaps what the author wrote |
| `valueEnd`     | `value-end`      | `number \| null`             | `null`         | the upper thumb. While it is `null` the element renders one thumb and submits a plain string; setting it renders the second thumb and the run between them                                                                    |
| `min`          | `min`            | `number`                     | `0`            | forwarded to both inputs                                                                                                                                                                                                      |
| `max`          | `max`            | `number`                     | `100`          | forwarded to both inputs                                                                                                                                                                                                      |
| `step`         | `step`           | `number`                     | `1`            | forwarded to both inputs; the arrow keys move by it, `Home` and `End` jump to the ends                                                                                                                                        |
| `orientation`  | `orientation`    | `'horizontal' \| 'vertical'` | `'horizontal'` | reflected; vertical is a writing mode on the track plus `aria-orientation` on every input, so the arrows agree with the paint                                                                                                 |
| `valueText`    | `value-text`     | `string`                     | `''`           | forwarded to `aria-valuetext` on the lower thumb: what a screen reader announces when the number alone does not say what it means ("21 °C", not "21")                                                                         |
| `valueTextEnd` | `value-text-end` | `string`                     | `''`           | the same announcement on the upper thumb                                                                                                                                                                                      |
| `name`         | `name`           | `string`                     | `''`           | the key the value submits under: one string, or one key per thumb                                                                                                                                                             |
| `disabled`     | `disabled`       | `boolean`                    | `false`        | reflected; the native `disabled` attribute on both inputs                                                                                                                                                                     |
| `required`     | `required`       | `boolean`                    | `false`        | declared by the shared form API and inert here: it marks nothing and reports nothing, because the HTML specification excludes `range` from `required` — see "Limitations"                                                     |
| `error`        | `error`          | `string`                     | `''`           | the message from JavaScript; a slotted `bk-field-error` with text wins over it; sets `aria-invalid="true"` on both inputs and blocks submission; cleared on `input`                                                           |

A value outside `min`/`max` is not clamped by the element: the property keeps what
was written, the browser clamps the input it holds, and the form submits what the
input shows. The input is the truth about what the control displays.

## Slots

| Slot          | Content                | Notes                                                                                                                                                                                                                |
| ------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `bk-field-label`       | rendered inside the `<label>` bound to the lower thumb's input with `for`/`id`; the slot is the only label, and a slider with no label renders the inputs unnamed                                                    |
| `description` | `bk-field-description` | the help text; `aria-describedby` names the region while it has content                                                                                                                                              |
| `error`       | `bk-field-error`       | the problem, rendered outside the label; an atom with text **is** the slider's error (marks the field invalid, blocks submission) and wins over the `error` property; the description is hidden while it has content |

The error channel has two writers and one display: `error` from JavaScript, and a
`bk-field-error` with text in the `error` slot. When both are set the atom wins,
and the property comes back when the atom's text goes; an atom with no text is not
content and says nothing about validity.

The atoms need no `slot` attribute inside a `bk-field`, which assigns them by tag
name. Rendered straight as a child of the control they do, because the control is
not a field.

## Events

| Event       | Detail                                        | Notes                                                                                                                                                                     |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bk-input`  | `{ value: number, valueEnd: number \| null }` | `bubbles: true`, `composed: true`; one per move while a thumb is held: the continuous channel                                                                             |
| `bk-change` | `{ value: number, valueEnd: number \| null }` | `bubbles: true`, `composed: true`; the value settled — the pointer was released, or a key was pressed. A key is a drag and a release in one, so it fires `bk-input` first |

```js
document.querySelector('bk-slider').addEventListener('bk-change', (event) => {
  console.log(event.detail.value, event.detail.valueEnd);
});
```

## Parts

| Part          | Element                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `label`       | the `<label>` row, carrying `data-state` and `data-disabled`                                        |
| `track`       | the painted track, which carries the hover step, holds the inputs and is the box the fill paints in |
| `fill`        | the run the slider fills: from the start of the track to the thumb, or between the two thumbs       |
| `input`       | the native `<input type="range">` of the lower thumb                                                |
| `input-end`   | the native `<input type="range">` of the upper thumb, rendered only while `value-end` is set        |
| `message`     | the container of the help and error regions                                                         |
| `description` | the help region                                                                                     |
| `error`       | the error region, `role="status"`                                                                   |

Both message regions always exist so a screen reader announces an error when it
appears. The description is hidden while the error has text, and an empty region
is collapsed with `data-empty` instead of being removed, so it stays in the
accessibility tree.

The **thumb is not in this table**: it is a `::-webkit-slider-thumb`
pseudo-element, so no `part` reaches it — see "Limitations".

## Tokens and hooks

| Hook                       | Paints                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--bk-slider-thumb-size`   | the diameter of the thumb, and the height of the box the input hit-tests (defaults to `--bk-space-4`)                  |
| `--bk-slider-track-height` | the height of the painted track (defaults to `--bk-space-2`)                                                           |
| `--bk-slider-radius`       | the corner radius of the track and of the run (defaults to `--bk-radius-lg`)                                           |
| `--bk-slider-length`       | the length of a vertical slider, which is the rail's inline span in that orientation (defaults to `--bk-space-4` × 15) |

Everything else the slider paints is a shared role or base token: the track is
`--bk-bg-surface-strong` and steps to `--bk-bg-surface-strong-hover` under the
pointer, the run is `--bk-bg-accent`, the thumb is `--bk-bg-surface`, and the focus
ring is `--bk-focus-ring`. A disabled slider dims the whole track with
`--bk-opacity-disabled`, thumb and run included, so nothing about it looks
operable.

`--bk-slider-variant-thumb-size`, `--bk-slider-variant-track-height` and
`--bk-slider-variant-radius` are the internal defaults the hooks fall back to, so an
override set on an ancestor still wins. Set the three hooks above, not those.

```css
.equalizer {
  --bk-slider-thumb-size: calc(var(--bk-space-4) * 1.25);
  --bk-slider-track-height: var(--bk-space-1);
  --bk-slider-radius: var(--bk-radius-sm);
}
```

## Accessibility

- One real `<input type="range">` per thumb, and the input is never hidden: the
  drag, the hit-testing, the arrow keys, `Home`/`End`, the form participation and
  the announced value are the platform's. `appearance: none` is the paint, not a
  hidden control.
- The `label` slot is bound to the lower thumb's input with `for`/`id`. With two
  thumbs each input also carries `aria-label` — `Minimum` and `Maximum` — because
  two unnamed sliders in one row are indistinguishable; that label overrides the
  `for` association, which is why "Limitations" states it.
- Each input carries `aria-orientation`, so a vertical slider is announced as one;
  the vertical layout itself is CSS only.
- `value-text` and `value-text-end` are forwarded to `aria-valuetext` on their
  thumb, which is what makes "21 °C" an announcement and "21" a number with no
  unit.
- `aria-describedby` points at the error region while it has text, otherwise at the
  description region, and at neither while both are empty. Content that arrives
  through a slot is read from `slotchange` and `assignedNodes()`, never from the
  region's `textContent`. The error region is `role="status"` and stays in the
  accessibility tree while it is visually collapsed.
- The `error` property, or the text of a `bk-field-error` in the `error` slot,
  sets `aria-invalid="true"` on both inputs, colours the label row and the message,
  and reports `customError` to the form; a move in either thumb clears it.
- The focus ring is drawn on the thumb through `:focus-visible` on the input, so it
  appears for keyboard focus and not for a pointer click. It is painted with
  `--bk-focus-ring` and `--bk-focus-ring-width`.
- The track against the surface, the thumb against the track, the thumb against the
  run, the run against the surface and the focus ring each clear 3:1, and the suite
  asserts them in both themes (WCAG 1.4.11). The value is never carried by colour
  alone: the thumb has moved, and the run shows how far.
- `disabled` is the native attribute on both inputs, because a range is a field:
  the platform refuses the drag and the keys, and the control is skipped in the tab
  order and announced as unavailable, like the platform's own range. The track dims
  so nothing about it looks operable.
- **Form-associated** through `ElementInternals`. With one thumb the value is a
  plain string; with two, both are appended to one `FormData` under `name`, so
  `new FormData(form).getAll('price')` reads `["20", "80"]`. A disabled slider
  submits nothing and reports no error, a disabled `<fieldset>` disables the field,
  and `reset()` restores the authored `value` and `value-end` and drops `error`.

## Limitations

- **The thumb is a pseudo-element, not a `part`.** It is painted through
  `::-webkit-slider-thumb`, so no `::part()` reaches it: it is themable through
  `--bk-slider-thumb-size` and the role tokens it paints, and a consumer who wants
  to restyle the thumb itself has no hook to do it with.
- **With two thumbs, `Minimum` and `Maximum` replace the label as the accessible
  name of each thumb.** The `<label>` still points at the lower input, but
  `aria-label` wins the accessible-name computation, so neither thumb is announced
  with the visible label text; the description is still associated through
  `aria-describedby`. One thumb, one name: a pair cannot be told apart without it.
- **With two thumbs, a click on the bare track does not jump a thumb.** The two
  inputs overlap across the whole track, so each of them drops pointer events and
  only the thumbs take the pointer; a click between the two thumbs hits the track
  and moves nothing. With one thumb the input is the whole track, and a click jumps
  the thumb there, as the platform does.
- **A disabled fieldset disables it.** The control submits nothing while a `<fieldset
disabled>` contains it, because the value getter asks `fieldDisabled` before it builds
  the form value — the same guard `bk-native-select` carries.
- **No `required`.** The HTML specification excludes `range`: a range always has a
  value, the browser defaults it to the midpoint without the user touching it, so
  `valueMissing` can never fire; none of the established libraries in this space
  exposes a required range either. The attribute exists because the shared form API
  declares it, and it is inert: nothing is marked, nothing is reported.
- **The events split in two.** `bk-input` fires while a thumb is still being
  dragged and `bk-change` when the value settles; a listener that reads `bk-input`
  alone reads values the user has not chosen yet. A key press is a drag and a
  release in one, so the keyboard fires both, in that order.
- **The property is not the browser's value.** A `value` outside `min`/`max` stays
  what the author wrote on the property while the browser clamps the input it
  holds and the form submits the clamped number; reading `el.value` after such a
  write is not what the control shows.
- **Two thumbs clamp, they never swap.** Dragging the lower thumb past the upper
  one stops it at the upper value, and lowering `value-end` past `value` drags the
  lower thumb down with it; the author's two values keep their roles instead of
  trading places.
