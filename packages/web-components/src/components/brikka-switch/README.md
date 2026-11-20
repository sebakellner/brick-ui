# `brikka-switch`

A switch with a real `<label>`, a description and an error slot, and a
`brikka-change` event. The track sits beside the label, never above it.

[Docs page](https://github.com/sebakellner/brikka/?path=/docs/components-switch--docs)

```html
<brikka-field>
  <brikka-switch name="wifi">
    <brikka-field-label>Wi-Fi</brikka-field-label>
    <brikka-field-description>The radio stays on while you are signed in.</brikka-field-description>
  </brikka-switch>
</brikka-field>
<brikka-field>
  <brikka-switch name="sync" checked error="Turn sync off to keep this device offline.">
    <brikka-field-label>Sync</brikka-field-label>
  </brikka-switch>
</brikka-field>
```

A switch is not a checkbox. A checkbox includes one thing in a set, and several of
them are read together; a switch turns one thing on or off, and reading it is a
yes-or-no answer about the thing the label names. Two states, never a third one —
a third state is a checkbox's problem, and `brikka-checkbox` already ships it.

## Attributes and properties

| Property   | Attribute  | Type      | Default | Notes                                                                                                                                                                                                           |
| ---------- | ---------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`    | `error`    | `string`  | `''`    | the message from JavaScript; a slotted `brikka-field-error` with text wins over it; wins over the description and over the native message; sets `aria-invalid="true"` and blocks submission; cleared on `input` |
| `checked`  | `checked`  | `boolean` | `false` | the state. The attribute is the state the form returns to on reset, like the platform's `defaultChecked`; the property is not reflected, so the attribute stays what the author wrote                           |
| `value`    | `value`    | `string`  | `''`    | submits as `on` while on, and submits nothing while off                                                                                                                                                         |
| `name`     | `name`     | `string`  | `''`    |                                                                                                                                                                                                                 |
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets `aria-disabled` on the inner switch and blocks activation                                                                                                                                       |
| `required` | `required` | `boolean` | `false` | reflected; marks the label with a `*` when there is one, and the platform reports `valueMissing` while the switch is off                                                                                        |

There is no `size` attribute and no `readonly`. The geometry is themable through
the hooks in "Tokens and hooks", which is how every shared value in this kit is
changed, and a switch the user may not change is a disabled switch.

## Slots

| Slot          | Content                    | Notes                                                                                                                                                                                                                |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `brikka-field-label`       | rendered inside the `<label>` that wraps the native input; the slot is the only label, and the track is unnamed while it is empty                                                                                    |
| `description` | `brikka-field-description` | the help text, under the label row and indented to the label text; `aria-describedby` names the region while it has content                                                                                          |
| `error`       | `brikka-field-error`       | the problem, rendered outside the label; an atom with text **is** the switch's error (marks the field invalid, blocks submission) and wins over the `error` property; the description is hidden while it has content |

The error channel has two writers and one display: `error` from JavaScript, and a
`brikka-field-error` with text in the `error` slot. When both are set the atom wins,
and the property comes back when the atom's text goes; an atom with no text is not
content and says nothing about validity.

The atoms need no `slot` attribute inside a `brikka-field`, which assigns them by tag
name. Rendered straight as a child of the control they do, because the control is
not a field.

The `label` goes inside the `<label>` that wraps the native input, so the
association stays implicit by containment. The description and the error are
rendered outside it: text inside a label joins the control's accessible name, and
the name of this control is the label, not its help text.

## Events

| Event           | Detail                 | Notes                                                           |
| --------------- | ---------------------- | --------------------------------------------------------------- |
| `brikka-change` | `{ checked: boolean }` | `bubbles: true`, `composed: true`; fires like a native `change` |

```js
document.querySelector('brikka-switch').addEventListener('brikka-change', (event) => {
  console.log(event.detail.checked);
});
```

## Parts

| Part          | Element                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| `label`       | the `<label>` row: the track and the label, carrying `data-state` and `data-disabled` |
| `input`       | the native `<input type="checkbox" role="switch">`                                    |
| `track`       | the painted track: the fill and the focus ring                                        |
| `thumb`       | the painted thumb, which travels from one end of the track to the other               |
| `required`    | the `*` that marks a required switch, `aria-hidden`                                   |
| `message`     | the container of the two message regions, indented to the label text                  |
| `description` | the help region                                                                       |
| `error`       | the error region, `role="status"`                                                     |

Both message regions always exist so screen readers announce an error when it
appears. The description is hidden while the error has text, and an empty region is
collapsed with `data-empty` instead of being removed, so it stays in the
accessibility tree. The error region always carries `data-state="error"`, which
names it as the region that paints a problem, whichever channel fills it; whether
it holds a message is `data-empty`, not that attribute.

The **message block starts where the label text starts**, not under the track: it
is indented by `var(--brikka-switch-track-width, var(--brikka-switch-variant-track-width))`
plus the row gap `--brikka-space-2`, both read from the hook the track paints. A
consumer who widens the track through `--brikka-switch-track-width` keeps the
alignment, because one value paints the track and the indent.

## Tokens and hooks

| Hook                          | Paints                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| `--brikka-switch-track-width` | the length of the track (defaults to `--brikka-space-4` × 2 + `--brikka-space-1` × 2)        |
| `--brikka-switch-thumb-size`  | the diameter of the thumb (defaults to `--brikka-space-4`); the track height derives from it |
| `--brikka-switch-radius`      | the corner radius of the track (defaults to `--brikka-radius-lg`)                            |

Everything else the switch paints is a shared role or base token: theming the
switch means theming the roles, not the field. The track is `--brikka-bg-surface-strong`
while off and `--brikka-bg-accent` while on, with `--brikka-bg-surface-strong-hover` under the
pointer while it is off; the thumb is `--brikka-bg-surface` in both states. Nothing is
outlined: the track is a flat fill, and because that boundary has to read on its own
it is a mid tone, at 4.80:1 against the light surface and 6.93:1 against the dark one.
The thumb is the surface, so it reads against the track at the same 4.80:1 and 6.93:1.

An on track keeps the accent fill under the pointer instead of stepping to the accent
hover role: in the dark theme that step is darker than the thumb it holds, and the
pair falls to 2.61:1. The off track can step, because its hover role moves away from
the surface the thumb is painted with in both themes.

**The height follows the thumb.** The track is the thumb plus a `--brikka-space-1` gap split
between its two ends, so a consumer who resizes the thumb gets a track that still
contains it. The travel is the track width minus the thumb and that gap, and the
inset at each end is half the gap, so an override keeps the thumb inside the track
instead of leaving it hanging over the edge. There is no track-height hook: one
dimension the consumer sets and the other follows from it, so the two cannot
disagree. The suite asserts the identity between the painted track and the thumb's
transform.

`--brikka-switch-variant-track-width`, `--brikka-switch-variant-thumb-size` and
`--brikka-switch-variant-radius` are the internal defaults the hooks fall back to, so an
override set on an ancestor still wins. Set the three hooks above, not those.

```css
.settings {
  --brikka-switch-track-width: calc(var(--brikka-space-4) * 3);
  --brikka-switch-thumb-size: calc(var(--brikka-space-4) * 1.25);
}
```

## Accessibility

- A real `<label for>` wraps a real `<input type="checkbox" role="switch">`, and
  focus is delegated to that input: the accessible name, the Space key, the form
  participation and the announced on/off state are the platform's.
- The role is on the native input, not on the painted track: `role="switch"` on a
  focusable checkbox is the pairing the ARIA in HTML specification allows, so the
  state is announced as a switch without re-implementing click, key handling or
  `aria-checked`.
- The accessible name is the text of the `label` slot and nothing else. There is no
  attribute a switch can be labelled with, so a switch whose slot is empty stays
  unnamed rather than named by one.
- The painted track and thumb are `aria-hidden` decoration. Everything the
  assistive technology reads — `checked`, `aria-invalid`, `aria-disabled`,
  `aria-describedby` — lives on the native input.
- The label colour is reinforcement, never the signal: the message region and the
  label row carry the error, `aria-invalid` carries it for assistive technology, and
  the `*` is `aria-hidden` decoration. A flat track paints no error colour of its own.
- The focus ring is drawn on the track through `:focus-visible` on the input, so it
  appears for keyboard focus and not for a mouse click.
- The off track against the surface, the thumb against the off track, the on fill
  against the surface, the thumb against the on track and the focus ring each clear
  3:1, and the suite asserts them in both themes (WCAG 1.4.11). The state is never
  carried by colour alone: the thumb has moved, and the two ends are the two states.
- A disabled switch paints its track and its thumb with `--brikka-bg-surface-muted` in
  both states and is dimmed on top of that, so nothing about it looks operable.
- `disabled` sets `aria-disabled` on the inner input and cancels the click: the
  control stays in the tab order and is announced as unavailable, while Space and
  the label stop changing it. A native `disabled` input would be skipped entirely,
  which hides it from someone navigating with a screen reader.
- `aria-describedby` points at the error region while it has text, otherwise at the
  description region, and at neither while both are empty. Content that arrives
  through a slot is read from `slotchange` and `assignedNodes()`, never from the
  region's `textContent`. The error region is `role="status"` and stays in the
  accessibility tree while it is visually collapsed.
- **Form-associated** through `ElementInternals`: an on switch submits under
  `name` — its `value`, or `on` when none is set — an off switch submits nothing,
  `required` reports `valueMissing` while it is off, `error` — or the text of a
  `brikka-field-error` in the `error` slot — reports `customError`, a disabled
  `<fieldset>` disables the field, and `reset()` restores the authored `checked`
  state and drops `error`.

## Limitations

- **No mixed state.** A switch answers on or off, and the ARIA pattern for it
  defines nothing else. A "select all" header over a set is `brikka-checkbox` with
  `indeterminate`.
- **`required` is not announced as "required".** `role="switch"` does not support
  `aria-required`, so the state is carried by the platform's `valueMissing`
  constraint, by the `*` the label carries, and by the message the failed submit
  shows — not by the input's announcement.
- No group. Wrapping several switches is a layout, not a component: each one is its
  own control with its own label, message and validity, and none of them reads an
  ancestor.
- A value the browser restores after a navigation comes back as the submitted
  `value`, not as `checked`, so a restored switch can render off.

## Label state

The control writes its state on its own label row — this `<label>`, and a
`brikka-field-label` hosted through the `label` slot — as `data-state`:

| Value      | When                                               | Paints                      |
| ---------- | -------------------------------------------------- | --------------------------- |
| `invalid`  | `error` is set, or the native message is showing   | `--brikka-text-danger`      |
| `disabled` | `disabled`, or the field is inside a disabled form | `--brikka-opacity-disabled` |

A switch that is both is painted with the danger colour and still dimmed: the
colour is the state's and the dim is the fact's. `data-state` carries one value and
`invalid` wins it, so the row also carries `data-disabled` while the switch is
unavailable.

A disabled switch drops its state colour: the track paints `--brikka-bg-surface-muted`
whichever end the thumb is at, so nothing about it looks on, while the thumb keeps
`--brikka-bg-surface-strong` and still shows which end it reached. The row dims on top of
that with `--brikka-opacity-disabled`. An enabled switch keeps its fill — the row is the
one container that dims, and a disabled track that kept the accent would still read
as on.
