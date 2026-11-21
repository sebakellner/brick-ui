---
title: Principles
description: How Brikka thinks — a core that is not edited and a surface that is configured.
summary: The core is the set of decisions, not their values; a brand supplies values, never names. Four levels say how far you go, and the guards say what cannot break.
---

# Principles

This is not a manual of components. It is how we think, so that when something is not written on a
component's page you can derive it from here.

**The core is not edited. The surface is configured.**

## What the core is

The misunderstanding worth clearing first, because it decides everything else: **the core is the set
of decisions, not the values that fill them.**

Adding a name, a scale or a rule changes the core, and that is ours to decide, with a version.
Changing the colour of a palette step, the width of the space unit or how tall a control is does
**not** change it — that is exactly what a brand comes here to do. It is why a brand writes
primitives and never roles (the role is the name _we_ gave the decision), and why the preset exists:
so the boundary is mechanical rather than a recommendation.

If you ever have to touch a name in the core to reach your goal, the system failed you. A
configuration point was missing, and that is our defect, not your exception.

## How far you go

Four levels, and one rule: **move up only when the one below cannot reach.** Most days are spent in
the first two.

**Configure.** You turn on a dark mode, pick a density, pick a type scale, and if you are a brand you
hand over your values through a preset. You do not write CSS; you turn knobs that already have a
range.

**Compose.** You put roles in your own markup. `bg-surface` is a surface; `text-danger` is text that
names a problem. There is nothing new to invent — the decisions are taken, and you use them.

**Except.** You adjust one detail of one component — the background of _this_ button — through its
hook, and you write down why. An exception is legitimate. A **repeated** exception is information:
someone is asking for a configuration point, or for a component that does not exist.

**The core.** Names, scales, rules, and which property each role forms. Touch it and the system stops
being a system and becomes an archive of particular cases.

## One rule makes the rest possible

**A component never reads a primitive.** It reads a role.

That looks like a style rule and is the condition of theming. The role is the indirection: it names a
decision without naming a colour, so a brand can change the palette and every role that references
it moves on its own, without anybody rewriting a role.

```css
:root {
  --brikka-palette-blue-600: #2563eb; /* what a brand supplies */
  --brikka-bg-accent: var(--brikka-palette-blue-600); /* what we decided */
}

/* The brand redefines the palette. The roles follow, because they never named a colour. */
[data-brand='acme'] {
  --brikka-palette-blue-600: oklch(0.55 0.19 285);
}
```

What a brand does not do is write `--brikka-bg-accent` itself. A contract every party drafts is not a
contract, and `surface` would stop meaning anything.

One consequence surprises people the first time: **a token that contains another resolves where it is
declared.** A shadow's tint is retinted by theme, not on the card that paints it. That is the right
shape for that knob — a shadow tint is a theme decision — but the obvious attempt fails in silence.

## Naming

A **role** is named for what it does: `bg-surface`, `text-danger`. A role named after its colour
would not survive a redesign.

A **primitive** is named for where it sits in its ramp: `blue-600`, `space.4`. It is a reference, not
a usage, and naming it by intent would force us to decide which intent owns step 600.

A **hook** is named for the component it belongs to: `button-bg`, not `accent-two`.

## The guards

Freedom is only safe when something refuses the harmful cases.

**Ranges, not free values.** A brand supplies a colour, a unit and two multipliers. It does not
supply a stylesheet.

**Contrast is measured, not assumed.** Every pair a role forms is measured and written down — the
status families in [tokens.md](tokens.md) are the example — and a preset that would form a pair below
the body-text threshold has to fail rather than ship.

**Failures are visible.** A token that does not resolve invalidates the declaration that reads it, in
silence. That is why a layer is loaded through `tokens.css`, and why the graph is checked rather than
trusted.

**Defaults are complete.** Somebody who configures nothing gets a system that works, in both themes
and at the factory density. What ships pre-set is the design for most people.

**Accessibility is an invariant.** No axis may produce a result below WCAG 2.2 AA. If one can, the
defect is the system's and not a choice of whoever configured it.

## How this breaks

Reading a primitive inside a component closes the door on theming, and the check refuses it (R6). A
magic number — `padding: 13px` — is a decision with no name and no owner. A variation per client
inside the core turns the system into an archive of particular cases, which is what the levels above
exist to avoid. And a second way to say the same thing — two scales for one dimension, an opacity
beside a disabled role, an alias that only restates its primitive — is how two components come to
look different while both being "correct".

A rule nobody can check is a wish. Every guard above names what holds it up.

## What this document does not govern

Component anatomy, design-to-code parity and release governance are real, and none of them is a token
decision. This document governs the graph: what it declares, how far it can be configured, and what
cannot break.

## Further reading

The thinking is not ours: Meyer on open/closed, Evans on the shared language, Sweller on cognitive
load, Johnson and Goldstein on defaults, Tesler's law on conservation of complexity, and from the W3C
the WCAG 2.2 and the Design Tokens Format Module. Material 3, Carbon, Polaris, Primer and Atlassian
are the public systems whose configuration models are worth comparing against ours.
