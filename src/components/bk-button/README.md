# `bk-button`

A button that delegates focus to its inner native `<button>`.

[Docs page](https://sebakellner.github.io/brick-ui/?path=/docs/components-button--docs)

```html
<bk-button>Save changes</bk-button>
<bk-button variant="secondary">Cancel</bk-button>
<bk-button variant="ghost">Learn more</bk-button>
<bk-button disabled>Disabled</bk-button>
```

## Properties

| Property | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | reflected |
| `type` | `type` | `'submit' \| 'reset' \| 'button'` | `'button'` | reflected; acts on the closest `<form>` |
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets `aria-disabled` on the inner button and blocks activation |

## Content

A single default slot: the label.

## Forms

`type` defaults to `'button'`, not to the platform default of `'submit'`: a button
that is usually a plain action should not send a form by accident. In a form,
`type="submit"` validates and submits, `type="reset"` resets to the initial
values, and `'button'` does nothing on its own.

The inner `<button>` cannot reach the form — form association does not cross a
shadow boundary — so the host looks it up and calls `requestSubmit()` or
`reset()`. Everything a form needs to see, including validation, still happens
through the platform.

## Parts

| Part | Element |
| --- | --- |
| `button` | the inner native `<button>` |

## Tokens

Every visual value comes from a token; the component holds no literals.

| Token | Paints |
| --- | --- |
| `--bk-button-bg`, `--bk-button-bg-hover` | background, resting and hovered |
| `--bk-button-fg` | label color |
| `--bk-button-border`, `--bk-button-border-hover` | border color |
| `--bk-button-radius` | corner radius (defaults to `--bk-radius-md`) |
| `--bk-button-disabled-opacity` | opacity while `aria-disabled` |
| `--bk-border-width` | border width |
| `--bk-control-height` | minimum height |
| `--bk-space-2`, `--bk-space-4` | gap and horizontal padding |
| `--bk-font-sans`, `--bk-font-size-md`, `--bk-line-height-md`, `--bk-font-weight-medium` | typography |
| `--bk-focus-ring`, `--bk-focus-ring-width`, `--bk-focus-ring-offset` | focus ring |
| `--bk-transition` | hover transition |

The default variant paints on the accent role (`--bk-bg-accent`, which the light
theme resolves to `blue-600` and the dark one to `blue-600` as well); white text on
it clears 4.5:1 in both, which the tests assert.

The first six are **override hooks**: they win over the variant default even when
inherited from an ancestor. That covers the five colour hooks and the radius. The
per-variant values they fall back to (`--bk-button-variant-*`) are internal, not
part of the API.

```css
.checkout {
  /* the role: every component that reads it follows */
  --bk-bg-accent: var(--bk-palette-sky-600);
  /* the hook: one component, even inherited from an ancestor */
  --bk-button-bg: var(--bk-bg-accent);
}
```

## Accessibility

- Focus is delegated to the native button, so keyboard behaviour is the
  platform's.
- The focus ring uses `:focus-visible` and clears 3:1 against a white surface.
- `disabled` sets `aria-disabled` instead of the native attribute: the button
  stays in the tab order and is announced as unavailable, while clicks and
  keyboard activation are blocked. A native `disabled` button is skipped
  entirely, which hides it from someone navigating with a screen reader.
- The secondary border clears 3:1 against a white surface (WCAG 1.4.11), which
  the tests assert.
