# 0022. An element marks only itself

Date: 2026-11-18

## Status

accepted. Supersedes in part
[0010](0010-name-a-group-on-its-host-and-let-its-atoms-be-the-regions.md) (`:41` and the
`data-empty` half of `:72`) and
[0012](0012-a-radio-group-is-a-widget-not-a-container.md) (`:111`): the group still owns the
`id`, the `role` and `aria-describedby` it gives its atoms' regions, and it no longer writes
`data-empty` on them. What [0014](0014-an-option-can-carry-its-own-hint.md) says (`:79`, the item
sets no id, no `role` and no `data-empty`) still holds and this is why.

## Context

[architecture.md](../architecture.md) states the rule this decision is about: **presence means
text, so an empty atom is not content.** CSS is what makes it hard. `:empty` cannot see slotted
content — a slot is a child of the shadow tree, not of the element — so
[`FieldMessagesController`](../../src/components/shared/form-control/field-messages.controller.ts)
marks the control's own region wrapper with `data-empty` and collapses it from there
([conventions-accessibility.md](../conventions-accessibility.md), A7).

That half is honest: the controller marks its own element. The other half was not.
[`FieldRegionsController`](../../src/components/shared/form-control/field-regions.controller.ts)
wrote `data-empty` on the consumer's atoms — `bk-field-description` and `bk-field-error` inside
`bk-checkbox-group` and `bk-radio-group` — so the atom decided nothing: it only reacted to
`:host([data-empty])`, and its rule fired only while a container had adopted it. The consequence
was measurable rather than theoretical: the atom's standalone test could not be written. The only
case that reached the empty state had to nest the atom in a group and let the group mark it
(`should collapse to no space while the group that owns it marks it empty`), which documents the
container's behaviour, not the atom's.

## Decision

**A host derives its own state from its own content, and writes it on itself.** `data-empty` keeps
its name and its meaning — present while the element holds no text — and changes owner: the atom
reads its own light DOM with `SlottedTextController` and reflects the attribute on its own host in
its update cycle. A controller no longer sets or clears attributes on a node it does not host.

A container that needs to know its own region is empty still decides that for itself, on its own
element: the controls keep `data-empty` on their `.message` wrapper because that wrapper is
theirs, and `:empty` cannot answer for it.

## Alternatives considered

| Alternative                                                   | Why it lost                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `:host(:empty)` on the atom, `::slotted(:empty)` in the group | `:empty` is false for whitespace-only text and for a comment node, and the rule is about text: `<bk-field-error> </bk-field-error>` is empty to a reader and not to `:empty`.                                                                                |
| The container keeps writing the mark (status quo)             | The atom's own `:host([data-empty])` rule became conditional on being inside a container that had adopted it, and the container had to read the text of a node it does not own — with two controllers already computing the same answer for different hosts. |
| The container observes the atom's child list itself           | Same ownership problem moved one microtask earlier, and two observers on one node where one element can answer for itself.                                                                                                                                   |
| Collapse with `display: none`                                 | It removes the region from the tree, so `aria-describedby` points at nothing and a live region stops announcing. A7a already rules this out; the empty region stays present and clipped.                                                                     |
| A `hidden` attribute instead of a separate mark               | The groups already use `hidden` for a different fact — a description yields to a visible error — and one attribute with two meanings is the defect these conventions exist to prevent.                                                                       |

## Consequences

Easier: the atom is honest on its own, so the standalone cases exist and the clip is proven
without a group; a container stops reading foreign text; adding a third container needs no
`data-empty` code at all; and the two readers of the mark — the atom's `:host([data-empty])` and the
groups' `::slotted(:not([data-empty]))` margin — keep working, now from the atom's own attribute.

Harder: the mark lands on the atom's first update rather than synchronously inside a container's
`updated()`, so a consumer that appends an atom and reads the attribute in the same task sees it a
microtask later. CSS consumers cannot tell the difference, and no test pins the synchronous read
because it never existed as a promise.

Debt accepted: `data-empty` stays a public, styleable attribute on the atoms and is documented in
their READMEs — the change moved the writer, not the contract. `bk-field-label` carries no mark
because nothing reads one, so the rule is written by the two atoms whose own styles or a
container's `::slotted` rule consume it.
