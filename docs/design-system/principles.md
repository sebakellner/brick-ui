---
title: Principles
description: What the Brikka design system decides, who may change each layer, and what it refuses.
summary: The core is not edited, the surface is configured; four levels and three layers say who may touch what, and the guards say what no configuration may break.
---

# Principles

**The core is not edited; the surface is configured.** Everything below is that sentence made
precise.

## Levels: who may touch what

Four levels, from the most stable to the most local. The rule for using them: go up a level only
when the one below cannot express what you need.

| Level                 | What it is                | Who decides it                              | Where it lives                                                                    |
| --------------------- | ------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| **0 · core**          | the values and the rules  | this system only, and a change is a version | `tokens/base`, `tokens/role`, [`conventions-tokens.md`](../conventions-tokens.md) |
| **1 · configuration** | the axes a host turns     | any host, inside the ranges                 | `scale.type`, `scale.density`, `data-theme`, a preset                             |
| **2 · composition**   | surfaces built from roles | any host                                    | its own markup and CSS, reading roles                                             |
| **3 · exception**     | one value overridden      | any host, with a reason recorded            | a hook, or a local custom property                                                |

A tier is not metadata: **it is which file a token lives in.** A primitive in `tokens/base`, a
role in `tokens/role`, a hook in the component that exposes it. Moving a value between tiers is a
change to this system, not a local edit.

## The three layers, and the one rule that makes configuration possible

| Layer     | Example                                            | Who writes it                 |
| --------- | -------------------------------------------------- | ----------------------------- |
| primitive | `--brikka-palette-blue-600`, `--brikka-space-base` | a brand, through a preset     |
| role      | `--brikka-bg-accent`, `--brikka-text-danger`       | this system                   |
| hook      | `--brikka-button-bg`                               | one component, for one detail |

**A component never reads a primitive.** It reads a role, or a hook that defaults to one. That
single rule is what makes a theme possible: the role is the indirection, and a brand that changes a
palette step moves every role that references it without touching a role at all.

```css
:root {
  --brikka-palette-blue-600: #2563eb; /* the primitive a brand supplies */
  --brikka-bg-accent: var(--brikka-palette-blue-600); /* the role: one hop, never two */
}

/* A brand redefines the palette. The roles follow, because they never named a colour. */
[data-brand='acme'] {
  --brikka-palette-blue-600: oklch(0.55 0.19 285);
}
```

What a brand may **not** do is write `--brikka-bg-accent` itself: a contract every party writes is
not a contract. The preset in [ADR 0028](../adr/0028-let-a-preset-define-primitives-not-roles.md)
exists to make that boundary mechanical instead of advisory.

## Naming

- A **role** is named by what it is for: `bg-surface`, `text-danger`, `warning-border`. A role
  named after its colour would not survive a redesign.
- A **primitive** is named by where it sits in its ramp: `blue-600`, `space.4`. It is a reference,
  not a usage, and naming it by intent would beg the question of which intent owns step 600.
- A **hook** is named for the component it belongs to: `button-bg`, not `accent-two`.

## The guards

Configuration is only safe when something refuses the harmful cases.

1. **Ranges, not free values.** A preset supplies a colour, a unit and two multipliers. It does not
   supply a stylesheet.
2. **Contrast is measured, not assumed.** Every pair a role forms is measured and written down —
   the status families in [tokens.md](tokens.md) are the example — and a preset that would form a
   pair below the body-text threshold must fail rather than ship.
3. **Failures are visible.** An unresolved token invalidates the declaration that reads it, in
   silence. That is why a layer is loaded through `tokens.css` and why the graph is checked, not
   trusted.
4. **Defaults are complete.** A host that configures nothing gets a system that works, in both
   themes, at the default density.
5. **Accessibility is an invariant.** No axis may produce a result below WCAG 2.2 AA. If one can,
   it is a defect of this system rather than a choice of the host.

## Anti-patterns

- **Reading a primitive in a component.** It closes the door on theming, and `pnpm check:tokens`
  refuses it (R6).
- **A magic number.** `padding: 13px` is a decision with no name and no owner.
- **A variation per client in the core.** The system turns into an archive of particular cases;
  the levels above exist so it does not have to.
- **A second way to say the same thing** — two scales for one dimension, an opacity beside a
  disabled role, an alias that only restates its primitive. Each one is how two components come to
  look different while both being "correct".
- **A rule nobody can check.** Every guard above names what enforces it, or it is a wish.
- **A system nobody may question.** These principles are meant to be understood, and revised
  through the process in [`docs/README.md`](../README.md).

## What this document does not govern

Component anatomy, design-to-code parity and release governance are real, and none of them is a
token decision. This document governs the graph: what it declares, who may change each layer, and
what no configuration may break.

## Readings

The thinking is not ours and is worth reading at the source: Meyer on open/closed, Evans on the
ubiquitous language, Sweller on cognitive load, Johnson and Goldstein on defaults, Tesler's law of
conservation of complexity, and the W3C's WCAG 2.2 and Design Tokens Format Module. Material 3,
Carbon, Polaris, Primer and Atlassian are the public systems whose configuration models are worth
comparing against ours.
