---
title: Tokens
description: The families Brikka declares, the roles a page paints with, and the names a consumer reads.
summary: The families Brikka declares, the roles a page paints with, the four axes, and the families it deliberately refuses.
---

# Tokens

Every name below is public. Renaming one is a breaking change, so the graph is the contract and
the components are its first consumer.

## Primitive families

| Family                | Carries                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| `palette`             | 64 steps in 7 ramps (neutral, blue, green, yellow, orange, red, sky) plus white      |
| `space`               | 12 steps, `0` to `16`, each `calc(base * n)`                                         |
| `size`                | 32 / 40 / 48 / 64, for a subject: an avatar, a thumbnail, a preview                  |
| `icon`                | 16 / 20 / 24, aligned to text                                                        |
| `radius`              | `none`, `sm`, `md`, `lg`, `xl`, `full` — the last is the pill                        |
| `border-width`        | 1px, and a 2px `thick`                                                               |
| `font`                | two stacks: `sans`, `mono`                                                           |
| `font-size`           | `xs` 12px to `2xl` 28px, every one multiplied by the type scale                      |
| `font-weight`         | `regular`, `medium`, `semibold`, `bold`                                              |
| `line-height`         | `tight`, `md`, `relaxed`                                                             |
| `letter-spacing`      | `tight`, `normal`                                                                    |
| `typography`          | six text styles: `heading-lg/md/sm`, `body-md/sm`, `label-md`                        |
| `measure`             | `sm` 45ch, `md` 65ch — how wide a line may get                                       |
| `duration` / `easing` | three durations, four curves                                                         |
| `transition`          | the one timing a component reads: duration and easing together                       |
| `elevation`           | one tint, two shadows: `resting`, `floating`                                         |
| `breakpoint`          | five widths, exported as **numbers**, because `@media` cannot read a custom property |
| `z-index`             | five layers: `base`, `dropdown`, `overlay`, `modal`, `toast`                         |
| `scale`               | the two multipliers a host turns: `type`, `density`                                  |
| `control-height`      | computed from the density                                                            |

## Semantic roles

A role is read **under the
property it names** — `bg-*` under `background`, `text-*` under `color`, `border-*` under
`border-*` — and that is the rule `pnpm check:tokens` enforces.

The status families are `success`, `warning` and `info`, each with `bg`, `text` and `border`, and
their pairs are measured rather than chosen: `text.on-selected` on `bg.selected` reads at 14.33:1
in light and 9.49:1 in dark, and the disabled ink at 3.82:1 and 3.16:1 — below body contrast on
purpose, because WCAG exempts inactive components and a label still has to be identifiable.

## What it refuses, and why

**A second scale next to the space ramp.** `size` and `icon` alias it, because two scales for one
dimension drift and nobody notices until a gap is 4px off.

**An opacity scale beside the colour roles.** There are two models in the market and they do not mix:
Material treats state as an overlay alpha, Primer as colour roles (`bgColor-disabled`). This graph
took Primer's — `bg.disabled`, `text.disabled`, `border.disabled`, `bg.scrim` — and a second way to
say the same thing is how two components end up looking different while both being "correct".

**Gradient and stroke-style tokens.** Nothing here paints a gradient, and a stroke style is a canvas
concept.

**A data-visualisation ramp.** A chart palette needs colour-blind safe ramps, which is a different
problem from reusing the status families.

**An alias that only restates a primitive.** It is a second name for one decision.

`orange` stays without a role on purpose: nine steps exist, no role references them, and a preset may
claim the family — cheaper than deleting it and adding it back.

## Naming

- `--brikka-` and then the path, kebab-cased: `bg.surface-muted` is `--brikka-bg-surface-muted`.
- The theme is not part of a name. A role is one name in both themes, and the theme decides its
  value.
- A token read carries no literal fallback. The only legal default is the variable half of a hook,
  `var(--brikka-button-bg, var(--brikka-button-variant-bg))`.

## What consumes this

Load `@brikka-ui/tokens/theme.css` — one file, both themes, all layers. A layer is never imported
on its own: `typography.css` computes from a scale that `base.css` declares.

The graph is also a source for tools: the palette for Figma, the breakpoints as numbers for a
media query, and the whole thing as a design system a host can paint with without registering a
single element.
