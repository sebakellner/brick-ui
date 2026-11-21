---
title: Foundations
description: The seven foundations a page is built from, and the one decision each of them carries.
summary: Colour decides meaning, type decides hierarchy, space decides rhythm, elevation decides what floats, an edge decides how hard a boundary reads, motion decides how a change arrives, and layout decides where the page breaks.
---

# Foundations

A page is built from seven foundations, and each one answers a single question. This is the
conceptual layer: what each foundation decides, and the criterion that makes one choice right and
another merely different. The way the system thinks about all of them is in
[principles.md](principles.md); the names that carry them are in [tokens.md](tokens.md).

| Foundation | The question it answers                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Colour     | what is this: a surface, a text, or a boundary?                          |
| Typography | how important is this, and how much of it is read at once?               |
| Space      | what belongs together, and what is merely nearby?                        |
| Elevation  | does this rest on the page, or float above it?                           |
| Edges      | how hard does this boundary read?                                        |
| Motion     | is the eye meant to follow this change?                                  |
| Layout     | where does the page stop being one column, and what sits on top of what? |

Most pages are built in that order, and each foundation constrains the next: type sets the measure,
the measure sets the columns, the columns set the space between them, and elevation and motion arrive
last because they describe a surface that already exists. Built in the other order, a layout spends
its time fighting its own type.

## Colour decides meaning

Colour never answers "which colour". It answers what a thing _is_: a surface to read on, something
that recedes, a text that carries weight, a boundary, a failure. The system keeps those meanings
apart, which is why a boundary never quietly becomes a background because someone found a nicer grey.
A colour that can be any colour and still be right is the sign the decision was never made.

Two things follow, and both are visible in how a page ages.

**No name describes its own value.** A colour called after its hue cannot survive a rebrand, and the
first thing a rebrand exposes is every place a page was allowed to reach past its name. So the raw
steps exist only to be referenced, the meaning is what gets named, and a page paints with the meaning.

**Neither light nor dark is the default.** The same name means the same thing in both, so a theme
changes the value and never the vocabulary. A page that mentions a colour instead of a meaning keeps
its light-mode look in the dark, and nobody notices until the dark theme is the only one they use.

Contrast is measured rather than judged. A pair is chosen by the reading it has to support and then
verified, because "it looks fine on my display" is not evidence a page can carry. And a state is not a
shade: a control that cannot be used keeps its label identifiable and loses its invitation, which is
the opposite of fading everything until it disappears.

## Typography decides hierarchy

Hierarchy comes from a few decisions repeated, not from many sizes. A page needs three levels of
heading, one comfortable size for running text, one smaller for support, and one for the label on a
control. Beyond that, a second size is usually a paragraph that should have been cut.

**A text style is one decision, not four.** Size, weight, line height and tracking are chosen
together, so they travel together. A page that picks a size and improvises the rest produces two
paragraphs on the same screen with different rhythms, and the reader feels it without being able to
name it.

**The line matters more than the point size.** What a reader's eye has to do is return to the start of
the next line, and it does that badly past about sixty-five characters. A comfortable measure is the
single typographic decision that most affects whether a page is read, which is why it is a foundation
and not a detail of a container.

**The scale is a multiplier, not a second design.** It exists so a host can read comfortably or fit
more without a redesign. A host that sets one element's size by hand has opted that element out of the
scale, and the inconsistency will show up exactly where the two systems meet.

## Space decides what belongs together

One rhythm serves the whole system: a single base and a proportional ramp, never a list of separately
chosen numbers. Proportional steps are what let a page keep its balance when the base changes, and a
list of numbers is what makes one gap look accidental forever.

**A single base moves everything.** Because the corner of a card, the box of an icon and the height of
a control are all read from the same rhythm, changing that base changes the page as a whole. Nothing
is left behind at the old scale, which is the difference between a system and a set of decisions that
happened to agree at the start.

**There is one ramp, deliberately.** A second scale for "sizes" is how two dimensions drift until a
gap is four pixels off and nobody can say which of the two is wrong. Squares, icons and corners
reference the rhythm instead of inventing their own.

**Proximity is the message.** What sits close reads as related, and no border or background will
override that. A gap that contradicts the grouping is a layout bug that no amount of colour fixes.

## Elevation decides what floats

Two states, not a ladder. A surface either rests on the page — a card, something that belongs to what
you are reading — or it floats above it and takes your attention, which is a promise about behaviour:
a floating surface can be dismissed, and the page behind it is waiting.

A system decides what floating _means_ before the first dialog asks for it. Declaring the states early
is what stops the third dialog from inventing a fourth shadow, and it is why the two states exist
before any component casts one.

**The tint belongs to the theme, not to the surface.** A shadow is a relationship between a surface and
the light in the room, so the theme owns it. Retinting a shadow on the card that paints it looks
correct in isolation and wrong on the page, because the card is no longer describing the same light as
its neighbours.

## An edge decides how hard a boundary reads

A corner has a softness, and it is read from the same rhythm as the space beside it — a rounded card
with a gap that ignores the corner looks hand-assembled. A square corner is not a mistake; it is a
decision that this surface is not meant to feel soft.

**A border is a boundary; a divider is punctuation.** One frames an object and one separates two
things inside the same object, and they do not swap weights. A boundary that has to communicate
selection cannot use the weight used for a table rule, or it reads as disabled instead of chosen.

**Focus is drawn twice.** An opaque ring states that something is focused, and a translucent halo
around it keeps that statement visible when the ring sits on a surface of its own colour. A single
ring is legible on some surfaces and invisible on others, which is the same as being unreliable.

## Motion decides how a change arrives

Motion answers one question: was the eye meant to follow this? A state that changes under the pointer
is instant enough to feel immediate; a colour settling after a change is quick; a movement the eye has
to track is slower, because tracking is work. Duration is chosen by what the reader has to do, never
by how long the animation looks good.

**One timing, shared.** A single timing that every component reads is what lets a system feel like one
system — and it is the only thing that makes reduced motion possible: a preference can retime the
whole kit at once only because there is one timing to replace. A component that writes its own
duration sits outside that promise.

**Motion is never decoration.** It describes a change; it does not draw attention to the interface
having changed. When a page animates to be noticed, the reader learns to wait, and the animation has
cost them time for nothing.

## Layout decides where the page breaks and what stacks

Breakpoints are content decisions, not device names. A column stops working when the line gets too
long or the content stops fitting, and that is what a break is; naming a breakpoint after a device
guarantees it is wrong on the next one.

**Stacking is a vocabulary, not a number.** A finite set of layers, far enough apart that a host can
slot something between them, means no component has to invent its position in a queue it cannot see.
The moment one writes a raw number, the next one has to guess above or below it.

**Two multipliers, and they are not the same axis.** One is reading comfort, the other is how much
fits on a screen. A denser interface is not a smaller one: shrinking everything makes text harder to
read and controls harder to hit, while increasing density makes control surfaces shorter and leaves
the type alone. Confusing the two produces a page that is both cramped and unreadable. And density
never touches the space rhythm: it shortens the surfaces a page is made of and leaves every gap
alone, which is what keeps one base unit coherent at every density. Both multipliers have a floor,
and the computation is what holds it: the height never computes below the 24 pixels a target needs,
and the scale never goes below 0.875, where the smallest size would fall under 11 pixels. A host
cannot configure a page past either of them.
