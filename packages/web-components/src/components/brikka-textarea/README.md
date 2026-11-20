# `brikka-textarea`

A multiline text field: a real `<textarea>`, a real `<label>`, a description and an
error slot, a `brikka-change` event, and a counter while `maxlength` bounds the value.
It is the counterpart of `brikka-input` for answers longer than one line.

[Docs page](https://github.com/sebakellner/brick-ui/?path=/docs/form-textarea--docs)

```html
<brikka-field>
  <brikka-textarea name="comment" placeholder="Anything else we should know?">
    <brikka-field-label>Comment</brikka-field-label>
    <brikka-field-description>Details about what you saw and when.</brikka-field-description>
  </brikka-textarea>
</brikka-field>
<brikka-field>
  <brikka-textarea name="comment" maxlength="280" error="That note is too long.">
    <brikka-field-label>Comment</brikka-field-label>
  </brikka-textarea>
</brikka-field>
```

## Usage

A field whose height the author decides, resizable by the consumer:

```html
<brikka-field>
  <brikka-textarea name="comment" rows="6" resize="vertical">
    <brikka-field-label>Comment</brikka-field-label>
  </brikka-textarea>
</brikka-field>
```

`rows` is the starting height and `resize="none"` takes the handle away, for a
field whose size the layout owns.

A field that grows with what it holds:

```html
<brikka-field>
  <brikka-textarea name="comment" rows="2" resize="auto">
    <brikka-field-label>Comment</brikka-field-label>
  </brikka-textarea>
</brikka-field>
```

`auto` measures the content on every value change — a keystroke and a value set
from JavaScript alike — so the field gives the height back when the text shrinks,
and it never scrolls inside.

A bounded field, with the count next to it:

```html
<brikka-field>
  <brikka-textarea name="comment" maxlength="280">
    <brikka-field-label>Comment</brikka-field-label>
  </brikka-textarea>
</brikka-field>
```

A message your own validation produces:

```html
<brikka-field>
  <brikka-textarea name="comment" error="Tell us what you expected to happen.">
    <brikka-field-label>Comment</brikka-field-label>
  </brikka-textarea>
</brikka-field>
```

`error` wins over the description and over the native message, and it clears on
`input`: set it again from the schema result or the rejection.

Blocked by the form rather than by the field:

```html
<form>
  <fieldset disabled>
    <brikka-field>
      <brikka-textarea name="comment"
        ><brikka-field-label>Comment</brikka-field-label></brikka-textarea
      >
    </brikka-field>
  </fieldset>
</form>
```

The inner `<textarea>` is the one that is disabled, so the field leaves the tab
order — unlike `brikka-button` and `brikka-checkbox`, which keep it and announce
`aria-disabled`.

## Attributes and properties

| Property       | Attribute      | Type                             | Default      | Notes                                                                                                                                                                                                               |
| -------------- | -------------- | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`        | `value`        | `string`                         | `''`         | the text; submitted under `name`                                                                                                                                                                                    |
| `name`         | `name`         | `string`                         | `''`         |                                                                                                                                                                                                                     |
| `placeholder`  | `placeholder`  | `string`                         | `''`         | forwarded to the `<textarea>`                                                                                                                                                                                       |
| `autocomplete` | `autocomplete` | `string`                         | `''`         | forwarded to the `<textarea>` (WCAG 1.3.5)                                                                                                                                                                          |
| `rows`         | `rows`         | `number`                         | `4`          | the starting height, in lines; forwarded to the `<textarea>` and then left to the CSS                                                                                                                               |
| `resize`       | `resize`       | `'none' \| 'vertical' \| 'auto'` | `'vertical'` | reflected; `none` and `vertical` map to CSS `resize`, and `auto` grows the field with its content and takes the handle away                                                                                         |
| `maxlength`    | `maxlength`    | `number`                         | `0`          | the bound the platform enforces, and the counter's switch: the attribute reaches the `<textarea>` and the count appears while it is above `0`                                                                       |
| `minlength`    | `minlength`    | `number`                         | `0`          | the bound the platform enforces while typing; forwarded above `0`                                                                                                                                                   |
| `disabled`     | `disabled`     | `boolean`                        | `false`      | reflected; sets the native `disabled` attribute on the `<textarea>`                                                                                                                                                 |
| `required`     | `required`     | `boolean`                        | `false`      | reflected; announces the state and marks the label with a `*` when there is one                                                                                                                                     |
| `error`        | `error`        | `string`                         | `''`         | the message from JavaScript; wins over the description and over the native message, and loses to a slotted `brikka-field-error` that has text; sets `aria-invalid="true"` and blocks submission; cleared on `input` |

`maxlength` and `minlength` are constraints the platform already enforces: the
field forwards them and reads the native validity like any other anchor, so a
field with `minlength="10"` and six characters reports `tooShort` and an empty
`required` one reports `valueMissing`, without a rule of its own.

## Slots

| Slot          | Content                    | Notes                                                                                                                                                                                                                           |
| ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `brikka-field-label`       | rendered inside the `<label>` bound to the `<textarea>` with `for`/`id`; the slot is the only label, and the field is unnamed while it is empty                                                                                 |
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
document.querySelector('brikka-textarea').addEventListener('brikka-change', (event) => {
  console.log(event.detail.value);
});
```

`value` updates on `input`, as it does for `brikka-input`, and `brikka-change` fires when
the field is left, like a native `change`.

## Parts

| Part          | Element                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `label`       | the `<label>`, carrying `data-state` when the field is invalid or disabled, and `data-disabled` while it is disabled |
| `textarea`    | the native `<textarea>`                                                                                              |
| `required`    | the `*` that marks a required field, `aria-hidden`                                                                   |
| `message`     | the container of the two regions                                                                                     |
| `description` | the help region                                                                                                      |
| `error`       | the error region, `role="status"`                                                                                    |
| `counter`     | the `value.length` / `maxlength` count, its own `role="status"` region, rendered only while `maxlength` bounds       |

The two regions always exist so screen readers announce an error when it
appears: the description is hidden while the error has text, and an empty region
is collapsed with `data-empty` instead of being removed, so it stays in the
accessibility tree. The error region always carries `data-state="error"`, which
names it as the region that paints a problem, whichever channel fills it; whether
it holds a message is `data-empty`, not that attribute.

The counter shares the row under the control with the description and the error: the message
takes the left, the count sits on the right, and an error taking the description's place does
not move it.

The counter is the one part that is not always there: it exists while
`maxlength` bounds the value and is removed when the bound goes, so `::part(counter)`
styles a count that is on screen and nothing else.

## Tokens and hooks

| Token                                                                                                                            | Paints                                             |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `--brikka-textarea-radius`                                                                                                       | corner radius (defaults to `--brikka-radius-md`)   |
| `--brikka-bg-surface`                                                                                                            | field surface                                      |
| `--brikka-border-default`                                                                                                        | field border                                       |
| `--brikka-border-strong`                                                                                                         | border on hover                                    |
| `--brikka-border-danger`                                                                                                         | border on error                                    |
| `--brikka-text-default`                                                                                                          | field text and label                               |
| `--brikka-text-danger`                                                                                                           | message on error, label while invalid, `*`         |
| `--brikka-text-muted`                                                                                                            | placeholder, message, counter, text while disabled |
| `--brikka-opacity-disabled`                                                                                                      | the field and its label row while disabled         |
| `--brikka-border-width`                                                                                                          | border width                                       |
| `--brikka-space-1`, `--brikka-space-2`, `--brikka-space-3`                                                                       | padding and the gaps under the label and the field |
| `--brikka-font-sans`, `--brikka-font-size-sm`, `--brikka-font-size-md`, `--brikka-line-height-md`, `--brikka-font-weight-medium` | typography                                         |
| `--brikka-focus-ring`, `--brikka-focus-ring-width`, `--brikka-focus-ring-offset`                                                 | focus ring                                         |
| `--brikka-transition`                                                                                                            | border transition                                  |

`--brikka-textarea-radius` is the only override hook. The rest are shared roles or
base values: theming the textarea means theming the roles, not the field.

```css
.checkout {
  --brikka-textarea-radius: var(--brikka-radius-sm);
}
```

The shared field sheet is written for a one-line control: an `<input>` has no
lines of its own, so it takes `--brikka-control-height` as its height and no padding
block. This element gives both back — `min-block-size: 0` and the block padding
of its text — because `rows` and the content are what size a `<textarea>`.

## Accessibility

- A real `<label>` bound by `for`/`id`; the id is generated once per instance so
  re-renders never break the link, and the name comes from the `label` slot — a
  field whose slot is empty stays unnamed rather than named by an attribute.
  Focus is delegated to the `<textarea>`.
- `aria-describedby` points at the error region while it has content, otherwise
  at the description region, and at the counter's region while `maxlength` bounds
  the value. `aria-invalid` follows what the error region displays, never what
  the field computes: an invalid field nobody has touched is not marked. The
  error region is `role="status"` and stays in the accessibility tree while
  empty (visually collapsed instead of `display: none`), so an announcement is
  not lost when the text appears.
- The counter is a `role="status"` region of its own, and its id is what
  `aria-describedby` names, so the count is read out as part of the field's
  description rather than as a floating string beside it.
- A slotted `brikka-field-error` with text is the field's error: the same text is
  what the region shows, what `aria-invalid` marks and what `customError` blocks
  the submit with, so the announcement and the form cannot disagree. An empty atom
  is invisible to assistive technology — no reference and no invalidity — and the
  control watches the text of the atom it was given, so an edit to the node updates
  the validity without a re-assignment.
- `autocomplete` is forwarded, so a field can identify its purpose (WCAG 1.3.5).
- The label colour is reinforcement, never the signal (WCAG 1.4.1): the border,
  `aria-invalid` and the message region carry the error, the native `required`
  attribute carries "required", and the `*` is `aria-hidden` decoration.
- A field with `resize="auto"` never scrolls inside itself: the whole answer stays
  in the document, so a keyboard reader is not trapped in a box that hides the
  line it read a moment ago.
- **Form-associated**: the element takes part in a `<form>` — its `value`
  submits under `name`, the form can disable it, and constraint validation
  reflects `required`, `minlength`, `maxlength` and `error` through
  `ElementInternals`.
- `disabled` uses the native attribute on the inner field: typed text, the
  pointer and constraint validation are the browser's to refuse, and the field
  leaves the tab order. That is unlike `brikka-button` and `brikka-checkbox`, which keep
  `aria-disabled` so a keyboard user can still reach them and be told why they
  are unavailable: the split follows what is blocked, and only a control whose
  job is an action has to stay reachable to answer for itself. A disabled field
  also submits nothing and reports no error, so it never blocks a submit it
  cannot take part in.
- `reset()` restores the default: the `value` attribute, read when the reset
  happens — the contract a native `<textarea>` has for its default value, not a
  snapshot of the value the field held when it mounted. It is synchronous, so a
  reset handler can read `FormData` or submit immediately. It also drops `error`
  and the touched state, so a reset form does not come back red.
- The author's `disabled` and a `<fieldset>` disabling the field are separate
  states: re-enabling the fieldset never clears an author-disabled field.
- The field border clears 3:1 against a white surface (WCAG 1.4.11), which the
  tests assert.

## Limitations

- `resize="auto"` measures on a value change, not on a re-wrap. A width change
  that puts the same text on more lines — a window resize, a narrower column —
  leaves the height measured at the last value change, so the field is shorter or
  taller than its content until the text changes again. The element observes no
  size of its own: give an `auto` field a width that does not change, or set
  `rows` and let the consumer resize.
- The counter exists only while `maxlength` bounds the value. There is no counter
  for `minlength`, and no count is shown without a bound to count against.
- `maxlength="0"` and `minlength="0"` are not forwarded to the `<textarea>`.
  Zero is the platform's "no bound", and for `maxlength` it is also the
  counter's "off", so the attribute would say one thing and the field another.
  Leave either off instead of writing `0`.
- No `readonly`, no `wrap` and no `spellcheck`: the element exposes no API for
  them, and a markup attribute written on the host is not forwarded to the inner
  `<textarea>`. `disabled` is the only way to make the field uneditable.
