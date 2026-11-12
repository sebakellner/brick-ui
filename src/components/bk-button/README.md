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
| `disabled` | `disabled` | `boolean` | `false` | reflected; sets `aria-disabled` on the inner button and blocks activation |

## Content

A single default slot: the label.

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
| `--bk-border-width` | border width |
| `--bk-control-height` | minimum height |
| `--bk-space-2`, `--bk-space-4` | gap and horizontal padding |
| `--bk-font-sans`, `--bk-font-size-md`, `--bk-line-height-md` | typography |
| `--bk-focus-ring`, `--bk-focus-ring-width`, `--bk-focus-ring-offset` | focus ring |
| `--bk-transition` | hover transition |

The first five are **override hooks**: they win over the variant default even
when inherited from an ancestor. The variant defaults are
`--bk-button-{primary,secondary,ghost}-{bg,bg-hover,fg,border}`.

```css
.checkout {
  --bk-button-bg: var(--bk-palette-sky-600);
  --bk-button-bg-hover: var(--bk-palette-sky-700);
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
