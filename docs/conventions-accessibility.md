# Accessibility Conventions

The bar every component has to clear before it ships. It is not a review
aspiration: most of it is asserted by the suite, because the failure mode is
invisible until someone cannot use the control.

| #   | Rule                                                         | Enforced by                             |
| --- | ------------------------------------------------------------ | --------------------------------------- |
| A1  | Native semantics first                                       | the suite, and review                   |
| A2  | Non-text contrast is asserted, not eyeballed                 | `src/test/helpers/contrast.ts`          |
| A3  | ARIA is wired in the component, never left to the host page  | review                                  |
| A4  | Descriptions are referenced only while they have content     | the suite                               |
| A5  | Disabled is `aria-disabled`, with activation blocked         | the suite                               |
| A6  | Form controls are form-associated through `ElementInternals` | the suite                               |
| A7  | A live region is never removed from the accessibility tree   | the suite, for what a test can see      |
| A7a | A container of controls is named on its host                 | the suite, by resolving every reference |
| A8  | A halo is never the focus indicator                          | the suite, per control                  |

**The rules are asserted, and the component is also audited.** Each rule below has its own
cases; on top of them, every component suite runs one axe audit per theme
(`wcag2a`, `wcag2aa`, `best-practice`) through `src/test/helpers/a11y.ts`. Neither half
replaces the other, and the split is `docs/conventions-testing.md` T15.

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
has text. An empty description or error removes the reference. The text is not always
the region's own: content that arrives through a slot is not in its
`textContent`, so a control with slotted descriptions decides from `slotchange`
and `assignedNodes()`, never from the rendered string
([0009](adr/0009-nest-the-field-parts-inside-the-control.md)).

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

**Enforced by.** The suite: every control participates through `ElementInternals`, and
its own suite asserts the submit, the reset and the disabled state a surrounding
`<form>` observes — plus the validity, for the controls that carry a value (a button
has none).

## A7. Never hide a live region from the accessibility tree

**Rule.** A live region that must not be visible is collapsed visually —
`clip-path`, a 1px box, `white-space: nowrap` — and keeps `role="status"` on the
region itself, never on the content slotted into it: a slotted atom is a child
node, and a region whose assigned nodes change is the node that stays in the tree.

**Why.** `display: none` or `visibility: hidden` removes it from the tree, so the
region stops being announced and the visual hiding also silenced it.

**Do** — the `.message` blocks in
`src/components/shared/form-control/form-control.styles.ts` are the reference
implementation. `:empty` cannot see slotted content, so a region is collapsed
from `data-empty` as well: a control marks its own `.message` wrapper, which
`FieldMessagesController` sets from `assignedNodes()`, and an atom marks itself,
reading its own light DOM with `SlottedTextController`
([ADR 0022](adr/0022-an-element-marks-only-itself.md)). Each host marks only what
it hosts. `1px` there is the geometry the technique requires, not a design value
([ADR 0004](adr/0004-forbid-style-literals-in-components.md)).

**Enforced by.** The suite, for the part a test can see: the region keeps
`role="status"` while it is empty (`bk-checkbox.test.ts`, `bk-input.test.ts`), stays
connected, and is collapsed rather than hidden (`bk-field-error.test.ts` proves the
collapse; the `role` it carries is the atom's own). Whether the
announcement actually reaches a screen reader is not assertable here — the suite runs
in Chrome alone ([0005](adr/0005-test-in-chrome-only.md)) — so that half stays a review
question.

## A7a. A container of controls is named on its host

**Rule.** An element that groups several controls carries `role="group"` on
itself and takes its accessible name from the label the consumer wrote, assigned
with `ariaLabelledByElements`; its description and error text are the consumer's
own atoms, referenced by IDREF from the host, which puts `role="status"` and the
empty-state mark on them. It never renders a region into its own shadow root and
references it.

**Why.** An IDREF is resolved in the tree of the element that carries it, and
element reflection keeps that rule: a host cannot name or describe a node in its
own shadow root. A container that renders its own regions looks finished and
announces nothing. The alternative — `referenceTarget` — is Chromium-only, and the
suite runs in Chrome alone ([0005](adr/0005-test-in-chrome-only.md)), so it would
be green and broken everywhere else.

**This is the one place A7 is relaxed**: the live region is the slotted error
atom, not a region the component owns, because a container has no same-tree region
to offer. It is still never removed and still collapsed rather than
`display: none`d while empty
([ADR 0010](adr/0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md)).

**Enforced by.** The suite: every reference is asserted by resolving it
(`document.getElementById` on the host's `aria-describedby`), never by comparing
the attribute string.

## A8. A halo is never the focus indicator

**Rule.** Every control draws its focus indicator with `--bk-focus-ring` as a solid
`outline`. A translucent halo (`--bk-focus-halo`) is allowed only on a control whose hit
surface sits on top of the control's own track — today that is the slider's knob — and it
is a pointer state, never the keyboard indicator.

**Why.** A solid ring has a measurable contrast and a defined area; a translucent layer
over an arbitrary backdrop has neither, so it cannot be the thing a keyboard user relies
on to find where they are. The one place a halo earns its keep is a knob sitting on a
track: a 2px ring there reads as part of the track it is painted over, and the state
layer Material and Ant Design use is what separates the two. The projects that use halos
keep them off the controls that have air around their box.

**Enforced by.** The suite, per control: the focus ring is asserted as a solid `outline`
with its colour resolved from the role, and the slider asserts both that the track does
not answer the pointer and that the knob's halo is an `outline` sized by its hook.
