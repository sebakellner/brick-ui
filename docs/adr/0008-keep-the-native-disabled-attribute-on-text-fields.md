# 0008. Keep the native `disabled` attribute on text fields

Date: 2026-11-14

## Status

accepted

## Context

A5 in [conventions-accessibility.md](../conventions-accessibility.md) says a
disabled control sets `aria-disabled` and blocks the action in the component, and
`AGENTS.md` lists the native attribute under "Never". `bk-button` and `bk-checkbox`
follow it. `bk-input` did not: it set `disabled` on the inner field. The
contradiction was written down in the checkbox feature and left there rather than
fixed inside a branch that was already open.

Making the field match turned out not to be two swapped attributes. Without the
native attribute the field still takes typed text, so it needs `readonly` as well,
and `readonly` is a different state: it stays in the tab order, is announced as
read-only, and keeps participating in submission. The kit would then block a
field with a combination the platform does not have, while the ecosystem does the
opposite of what the convention asks: Shoelace, Radix, MUI and Spectrum all use
the native attribute on text inputs, and the ARIA recipe is what they use on
buttons and widgets.

The two states were measured in Chrome rather than argued about, on `main` and on
the branch that tried the ARIA route:

|                             | `disabled` on the inner input                       | `aria-disabled` + `readonly`                                                       |
| --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Typed text                  | refused                                             | refused, by `readonly`                                                             |
| Tab order                   | left                                                | kept                                                                               |
| Discovered by screen reader | by browse-mode navigation, announced as unavailable | by Tab, announced as unavailable                                                   |
| Reads as                    | unavailable                                         | read-only _and_ unavailable                                                        |
| Constraint validation       | barred by the platform                              | barred only if the component says so                                               |
| Submitted                   | nothing                                             | nothing, but because the host attribute bars the element, not because of the field |

## Decision

A text field keeps the native `disabled` attribute. A widget blocks with
`aria-disabled` on its inner control and cancels the activation in the component.

The split follows what is being blocked. On a field, nothing is activated: the
state to block is "editable", and the native attribute blocks it completely — the
caret, typed text, the browser's own affordances — with the same meaning in every
browser. On a button or a checkbox, what is blocked is an action, and the user
decides whether to act; they have to be able to reach the control to learn why it
is unavailable.

What A5 keeps everywhere is the half that carries the argument: a control is
announced as unavailable, and the block lives in the component, never in the host
page. What it loses is the claim that one mechanism serves both shapes.

### Alternatives considered

| Alternative                                                   | Why it was rejected                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aria-disabled` + `readonly` on the field (#33, first commit) | Two mechanisms to reproduce one platform state. `readonly` is announced as read-only, so a field ends up described as both read-only and unavailable, and a component now has to cancel typing, pasting and dropping by hand to behave like the attribute it replaced. It also leaves the kit explaining two disabled models across three controls, with no rule saying which shape takes which. |
| The native attribute on all three controls                    | Cheapest to reason about, and it is what the button would get for free. It removes `bk-button` and `bk-checkbox` from the tab order, which is the specific failure A5 was written for: a keyboard user cannot reach a disabled control, cannot have its state announced, and cannot learn why a form cannot be submitted. The cost is highest exactly where A5 was doing the most work.          |
| No disabled state at all, as GOV.UK advises                   | The right advice for a product team and the wrong one for a kit: a component library cannot refuse to ship a state its consumers will build anyway, and an app that reads "don't disable controls" from us and then needs one has no component to reach for.                                                                                                                                     |

## Consequences

Each control's README now states which mechanism it uses, and the reason is one
lookup away instead of a judgement call.

`bk-input` loses keyboard discoverability of its disabled state — a keyboard user
tabbing through a form passes over it, exactly as they do on any `disabled` input
on the web. That is the accepted cost, and the reason to keep the state rare: a
disabled field is a field a screen reader user cannot tab to. Two fields in the
same form is when this starts to hurt, and the answer then is not the component.

The mistake this invites: reading the split as "fields are native, everything else
is ARIA" and applying it to the next widget by shape rather than by question. A
`bk-radio` is a widget and takes `aria-disabled`; a `bk-textarea` is a field and
takes the native attribute. When a control both holds a value and performs an
action — a switch that submits on toggle — the question to ask is what a user must
do to find out why it is unavailable, and the answer decides.

The kit still carries both mechanisms, so both are tested: `bk-button` and
`bk-checkbox` assert `aria-disabled`, a blocked click and a focusable control;
`bk-input` asserts the native attribute, that no `aria-disabled` is written, and
that typing changes nothing.

Verified debt, kept from the branch: `FormControlMixin.syncFormValue` cleared
validity while the field was disabled because `error` reported `customError` on a
field the platform had already barred from validation, so `validity` said invalid
while `form.checkValidity()` said valid. That incoherence was not caused by the
mechanism and would reappear under either one, so the guard stays.
