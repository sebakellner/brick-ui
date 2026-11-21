---
title: Principles
description: What the Brikka design system decides, in whose name, and what it refuses.
summary: Primitives are what a brand owns, roles are what a page paints, hooks are what a component exposes — and the graph is the product, not a byproduct of the elements.
---

# Principles

A design system is a set of decisions a page can be built with. Brikka ships those decisions as a
token graph: **the graph is the product.** The components are its first consumer and its integration
test, not its reason to exist. When a value is missing, the fix is a decision in the graph — never a
number in a component.

## The three layers, and who owns each

| Layer         | Who decides it              | Example                                            | What a consumer does      |
| ------------- | --------------------------- | -------------------------------------------------- | ------------------------- |
| **Primitive** | a brand, via a preset       | `--brikka-palette-blue-600`, `--brikka-space-base` | supplies its values       |
| **Role**      | this system                 | `--brikka-bg-surface`, `--brikka-text-danger`      | reads it, never writes it |
| **Hook**      | a component, for one detail | `--brikka-button-bg`                               | adjusts it, per component |

A brand writes primitives. A role written by a brand would stop meaning anything: `bg.surface` is
the contract, and a contract every party writes is not one. A hook exists so a single component can
be adjusted without touching the system.

## When the graph is complete

**When it declares every decision the system needs to state — whether or not a component uses it
today.** Not "when a component can be painted without inventing a value": that criterion makes the
components the spec, and this system is built first and consumed second.

The practical consequence, and the one that keeps coming up: a token is not premature because
nothing reads it yet. It is premature when the decision itself is not made. A hover wash on a
transparent surface is a decided thing even if no ghost button exists; a fifth elevation level is
not, until something needs to sit that high.

## The axes a host turns

Four, and nothing else changes the system's shape:

| Axis       | How                                       | What it changes                                    |
| ---------- | ----------------------------------------- | -------------------------------------------------- |
| theme      | `data-theme="dark"`, or the OS preference | every role                                         |
| density    | `--brikka-scale-density`                  | the control height                                 |
| type scale | `--brikka-scale-type`                     | every font size, and the text styles built on them |
| brand      | a preset, supplied as primitives          | its colours, fonts, scale and motion feel          |

## What it refuses

Named refusals, each with the reason in [conventions-tokens.md](../conventions-tokens.md) or an ADR:
a second scale next to the space ramp, an opacity scale beside the colour roles, gradient and
stroke-style tokens, a data-visualisation ramp, and a semantic alias that only restates a
primitive. A short list is a decision; a long one is an absence of one.
