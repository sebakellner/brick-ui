# Accessibility Conventions

The bar every component has to clear before it ships. It is not a review
aspiration: most of it is asserted by the suite, because the failure mode is
invisible until someone cannot use the control.

| # | Rule | Enforced by |
| --- | --- | --- |
| A1 | Native semantics first | the suite, and review |
| A2 | Non-text contrast is asserted, not eyeballed | `src/test/helpers/contrast.ts` |
| A3 | ARIA is wired in the component, never left to the host page | review |
| A4 | Descriptions are referenced only while they have content | the suite |
| A5 | Disabled is `aria-disabled`, with activation blocked | the suite |
| A6 | Form controls are form-associated through `ElementInternals` | review |
| A7 | A live region is never removed from the accessibility tree | review |

## A1. Native semantics first

**Rule.** A real `<label>` with `for`, a native `<input>` or `<button>` inside the
shadow root, and focus delegated to that inner control (`delegatesFocus`).

**Why.** A keyboard user, a screen reader and a voice control user all work
through the platform's own semantics. Rebuilding them on a `<div>` is how a
component ends up correct in a demo and unusable in a form.

**Enforced by.** The suite asserts the label's `htmlFor` matches the input's `id`,
that the control is focusable, and that the inner element is a real control.

## A2. Non-text contrast is asserted, not eyeballed

**Rule.** A control boundary and a focus ring need at least 3:1 against the surface
they sit on. Each one gets an assertion through `src/test/helpers/contrast.ts`.

**Why.** Repeated over forty components, an eyeball judgement is a coin flip that
depends on the reviewer's monitor. The threshold for non-text content is lower than
for text and easier to miss, which is exactly why it needs a number in the suite
rather than an opinion in a review.

**Enforced by.** The suite.

## A3. Wire the ARIA in the component

**Rule.** All of it — labels, `aria-describedby`, `aria-invalid`, the focus ring —
is the component's job. A host page never has to add anything.

**Why.** A wiring contract split across two files fails at the seam. The consumer
who forgets is the consumer who gets a broken form, and they have no way to know.

**Enforced by.** Review.

## A4. Reference a description only while it has content

**Rule.** `aria-describedby` points at the message region only while that region
has text. An empty helper or error removes the reference.

**Why.** A reference to an empty element is announced as an empty description by
some screen readers, and it is the kind of detail that only surfaces by using the
thing.

**Enforced by.** The suite.

## A5. Disabled is announced, and blocked in the component

**Rule.** A disabled control is announced as unavailable and its block lives in
the component, never in the host page. The mechanism follows what is blocked. A
**widget** — a button, a checkbox — sets `aria-disabled="true"` on its inner
element and cancels the activation, so it keeps its place in the tab order. A
**text field** sets the native `disabled` attribute, which already refuses typed
text, autofill, pointer interaction, submission and constraint validation, and
leaves the tab order as the platform means it to — [0008](adr/0008-keep-the-native-disabled-attribute-on-text-fields.md).

**Why.** On a widget, what is blocked is an action the user has not decided on
yet, so they have to be able to reach the control to find out why it is
unavailable: `disabled` removes it from the tab order, `aria-disabled` keeps it
focusable. On a field, nothing is activated — the state to block is "editable" —
and the native attribute blocks it completely, with one meaning across browsers,
where the ARIA recipe needs a second mechanism (`readonly`) to stop typing and
still reads as read-only to a screen reader.

**Enforced by.** The suite, per shape: for a widget, that the attribute is set,
that the inner control is still focusable and that a click changes nothing; for a
field, that the native attribute is set, that no `aria-disabled` is written, and
that typing changes nothing.

## A6. Form controls are form-associated

**Rule.** A form control uses `ElementInternals` for value, reset, disabled state
and validity, so it participates in the surrounding `<form>` through the platform.

**Why.** Anything else means reimplementing form serialization in JavaScript and
being wrong about reset, about validity, and about submission order.

**Enforced by.** Review.

## A7. Never hide a live region from the accessibility tree

**Rule.** A live region that must not be visible is collapsed visually —
`clip-path`, a 1px box, `white-space: nowrap` — and keeps `role="status"`.

**Why.** `display: none` or `visibility: hidden` removes it from the tree, so the
region stops being announced and the visual hiding also silenced it.

**Do** — the `.message:empty` block in `bk-input` is the reference implementation.
`1px` there is the geometry the technique requires, not a design value
([ADR 0004](adr/0004-forbid-style-literals-in-components.md)).

**Enforced by.** Review.
