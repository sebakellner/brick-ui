# `brikka-button`

A button that delegates focus to its inner native `<button>`.

[Docs page](https://github.com/sebakellner/brick-ui/?path=/docs/components-button--docs)

```html
<brikka-button>Save changes</brikka-button>
<brikka-button variant="secondary">Cancel</brikka-button>
<brikka-button variant="ghost">Learn more</brikka-button>
<brikka-button disabled>Disabled</brikka-button>
```

## Attributes and properties

| Property   | Attribute  | Type                                  | Default     | Notes                                                                                     |
| ---------- | ---------- | ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `variant`  | `variant`  | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | reflected                                                                                 |
| `type`     | `type`     | `'submit' \| 'reset' \| 'button'`     | `'button'`  | reflected; acts on the closest `<form>`                                                   |
| `label`    | `label`    | `string`                              | `''`        | accessible name for a button that shows an icon and no text; mirrored to the inner button |
| `disabled` | `disabled` | `boolean`                             | `false`     | reflected; sets `aria-disabled` on the inner button and blocks activation                 |

## Slots

| Slot        | Content | Notes                                    |
| ----------- | ------- | ---------------------------------------- |
| _(default)_ | text    | the label; a button with no text is bare |

## Parts

| Part     | Element                     |
| -------- | --------------------------- |
| `button` | the inner native `<button>` |

## Tokens and hooks

Every visual value comes from a token; the component holds no literals.

| Token                                                                                                   | Paints                                                                  |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `--brikka-button-bg`, `--brikka-button-bg-hover`                                                        | background, resting and hovered                                         |
| `--brikka-button-fg`                                                                                    | label color                                                             |
| `--brikka-button-border`, `--brikka-button-border-hover`                                                | border color                                                            |
| `--brikka-button-radius`                                                                                | corner radius (defaults to `--brikka-radius-md`)                        |
| `--brikka-button-disabled-opacity`                                                                      | opacity while `aria-disabled` (defaults to `--brikka-opacity-disabled`) |
| `--brikka-border-width`                                                                                 | border width                                                            |
| `--brikka-control-height`                                                                               | minimum height                                                          |
| `--brikka-space-2`, `--brikka-space-4`                                                                  | gap and horizontal padding                                              |
| `--brikka-font-sans`, `--brikka-font-size-md`, `--brikka-line-height-md`, `--brikka-font-weight-medium` | typography                                                              |
| `--brikka-focus-ring`, `--brikka-focus-ring-width`, `--brikka-focus-ring-offset`                        | focus ring                                                              |
| `--brikka-transition`                                                                                   | hover transition                                                        |

The default variant paints on the accent role (`--brikka-bg-accent`, which the light
theme resolves to `blue-600` and the dark one to `blue-600` as well); white text on
it clears 4.5:1 in both, which the tests assert.

The first six are **override hooks**: they win over the variant default even when
inherited from an ancestor. That covers the five colour hooks and the radius. The
per-variant values they fall back to (`--brikka-button-variant-*`) are internal, not
part of the API.

```css
.checkout {
  /* the role: every component that reads it follows */
  --brikka-bg-accent: var(--brikka-palette-sky-600);
  /* the hook: one component, even inherited from an ancestor */
  --brikka-button-bg: var(--brikka-bg-accent);
}
```

## Accessibility

- Focus is delegated to the native button, so keyboard behaviour is the
  platform's.
- The focus ring uses `:focus-visible` and clears 3:1 against a white surface.
- `disabled` sets `aria-disabled` instead of the native attribute: the button
  stays in the tab order and is announced as unavailable, while clicks and
  keyboard activation are blocked. A native `disabled` button is skipped
  entirely, which hides it from someone navigating with a screen reader. It is
  drawn with `--brikka-opacity-disabled` through its hook and has no hover state, so
  a pointer over it changes nothing.
- The secondary border clears 3:1 against a white surface (WCAG 1.4.11), which
  the tests assert.

## Forms

`type` defaults to `'button'`, not to the platform default of `'submit'`: a button
that is usually a plain action should not send a form by accident.

The element is **form-associated**, the same way `brikka-input` is, so it finds its
form the same way and needs no lookup of its own: a `form="other-id"` attribute
works, and a `<fieldset disabled>` disables it just as it disables the fields
beside it. The fieldset state is kept apart from the author `disabled` and
neither implies the other.

`type="submit"` calls `requestSubmit()` and `type="reset"` calls `reset()`, so
validation and resetting still happen through the platform.

**It is not the form's default submit button.** The inner `<button>` lives in the
shadow root and therefore has no form owner, so pressing Enter in a text field
elsewhere in the form does not route to it, and a form with more than one field
will not submit from the keyboard at all. Keep a native
`<button type="submit">` in any form that has to submit that way.

One limit remains, and it is the platform's: `requestSubmit()` runs without a
submitter, so `event.submitter` is `null` and the button's own `name` and `value`
do not travel with the submission. Passing a custom element as the submitter
throws, by design.

A programmatic `el.click()` runs exactly the activation a real click runs, and
does nothing while the button is disabled or its fieldset is.
