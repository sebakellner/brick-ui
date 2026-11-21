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
**not** change it — that is exactly what a brand comes here to do. It is why a brand supplies
values for primitives and never roles (the role is the name _we_ gave the decision), and why the preset exists:
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

**The core.** Names, scales, rules, and which property each role forms — and it has an address:
`tokens/base` holds the ramps, the scales and the singletons, `tokens/role` holds the role names with
their values per theme, and the rules they obey live beside them in `conventions/tokens.md`. The
thinking behind those rules is on this page and in [foundations.md](foundations.md). Touch any of them
and the system stops being a system and becomes an archive of particular cases.

**The fourth level is not one you climb.** It is requested, and the answer is a version.

## One rule makes the rest possible

**A component never reads a palette step.** It reads a role.

That looks like a style rule and is the condition of theming. The role is the indirection: it names a
decision without naming a colour, so a brand can change the palette and every role that references
it moves on its own, without anybody rewriting a role.

```css
/* The ramp is declared once, at the root; a theme re-declares the roles. */
:where(:root) {
  --brikka-palette-blue-600: #2563eb; /* one step of the default ramp */
}

:where(:root),
:where([data-theme='light']) {
  --brikka-bg-accent: var(--brikka-palette-blue-600); /* what we decided */
}

/* What a preset emits for a brand: the steps it derives from the anchor. */
:root[data-brand='acme'] {
  --brikka-palette-blue-600: oklch(0.55 0.19 285);
  --brikka-palette-blue-400: oklch(0.68 0.17 285);
  /* …and every other step a role reads, in either theme. */
}
```

A brand on the document works because the ramp is inherited. A role that resolves on the root reads
the palette there; a role the theme re-declares on a subtree inherits it from the root. Every step of
the ramp reaches every role that reads it, in every theme, at any depth.

One more reason the brand block holds: the theme blocks are written with `:where()`, which carries no
specificity, so the selector that names the brand outranks them on the element they share without
depending on the order the stylesheets load in.

**A brand is a document-level fact.** The ramp is declared once, at the root, and a theme re-declares
the roles; the palette itself has no theme. So one brand block serves both themes, needs no rule per
theme, and nothing below it can put the default ramp back.

A brand confined to a subtree is a generated extension — `var()` resolves where a declaration applies,
so redefining a palette step inside a subtree never reaches a role declared on the root, and the roles
that read the brand's steps are re-declared under that same selector. Nobody hand-writes those roles,
and that is the whole point: a brand supplies values, and a role is always the system's name for a
decision. The suite tests the document, including the role a light subtree resolves from an override
at the root; the subtree itself is held by review. A contract every party drafts is not a contract,
and `surface` would stop meaning anything.

One consequence is the same mechanism from the other side: **a token that contains another resolves
where it is declared.** A shadow's tint is applied at the theme that declares it, not on the card that
paints the shadow — and retinting it on the card is the attempt that fails in silence.

## Naming

A **role** is named for what it does: `bg-surface`, `text-danger`. A role named after its colour
would not survive a redesign.

A **primitive** is named for where it sits in its ramp: `blue-600`, `space.4`. It is a reference, not
a usage, and naming it by intent would force us to decide which intent owns step 600. The tone in that
name belongs to the default palette: a brand that brings another hue is replacing the ramp, and the
name keeps pointing at the step rather than at the colour.

A **hook** is named for the component it belongs to: `button-bg`, not `accent-two`.

## The guards

Freedom is only safe when something refuses the harmful cases.

**Ranges, not free values.** A brand supplies an anchor colour — or the ramp it builds — a unit and
two multipliers. It does
not supply a stylesheet.

**An anchor, not a step.** A role reads the step its theme needs, and the two themes do not read the
same ones, so the unit a brand supplies is the ramp: the colour it is built around arrives as one
value and every step a role reads is derived from it. A brand that wants exact control supplies the
whole ramp it touches instead, and a ramp it does not supply stays the default. What is never
supplied is a single step.

Where two inputs meet the system owns the computation: a control's height is supplied at the resting
density and the multiplier that adapts it stays the system's, so a plain length would opt that
control out of density.

**Contrast is measured, not assumed.** Every pair a role forms is measured and written down — the
status families in [the token reference](tokens.md) are the example — and a preset that would form a pair below
its threshold must not ship. Two classes of pair are measured: text on its surface at
4.5:1, and everything that is not text — a control's edge, a focus ring, a boundary that carries
meaning — at 3:1. The pairs are measured on the composed ramp — a brand's values over the defaults,
never the factory ramp alone — which is the reason a ramp arrives whole: a palette supplied one step
at a time keeps the default at every step it did not touch, and the measurements above stop
describing that page. Nothing automated stops it; review does, like the ranges above it.

**Failures are made visible.** A token that does not resolve invalidates the declaration that reads it, in
silence. That is why a layer is loaded through `tokens.css`, and why the graph is checked rather than
trusted.

**Defaults are complete.** Somebody who configures nothing gets a system that works, in both themes
and at the factory density. What ships pre-set is the design for most people.

**Accessibility is an invariant.** No axis may produce a result below WCAG 2.2 AA. If one can, the
defect is the system's and not a choice of whoever configured it — and no check fails a build that
breaks it: the pairs are measured by hand, and this guard is held by review.

## How this breaks

Reading a palette step inside a component closes the door on theming, and the graph's own check
refuses it. A magic number — `padding: 13px` — is a decision with no name and no owner. A variation per
client inside the core turns the system into an archive of particular cases, which is what the levels
above exist to avoid. The families this graph refuses, and why, are listed once in
[the token reference](tokens.md).

A rule nobody can check is a wish. Where a guard above names a check, that check exists today; where
it names none, the guard is held by review, and an exception is argued in a new architecture decision
record rather than granted in passing.

## What this document does not govern

Component anatomy, design-to-code parity and release governance are real, and none of them is a token
decision. This document governs the graph: what it declares, how far it can be configured, and what
cannot break.

## Further reading

The thinking is not ours: Meyer on open/closed, Evans on the shared language, Sweller on cognitive
load, Johnson and Goldstein on defaults, Tesler's law on conservation of complexity, and from the W3C
the WCAG 2.2 and the Design Tokens Format Module. Material 3, Carbon, Polaris, Primer and Atlassian
are the public systems whose configuration models are worth comparing against ours.
