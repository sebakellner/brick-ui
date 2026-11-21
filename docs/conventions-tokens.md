# Token Conventions

Rules for the token source in `tokens/*.json` and for the layers it generates.
The pipeline is explained in [ADR 0001](adr/0001-generate-token-css-from-json.md);
why aliases survive as `var()` is [ADR 0003](adr/0003-keep-aliases-as-var.md).

A layer is loaded through `tokens.css`, never on its own. A layer may read a token another
layer declares — the type and density scales live in `base.css` and `typography.css` computes
from them — and a component or host that imports one file in isolation gets an unresolved
`var()`. That is why no token read carries a literal fallback: a fallback would be a second
value to keep true, and AGENTS.md forbids a literal one outright.

| #   | Rule                                                                         | Enforced by         |
| --- | ---------------------------------------------------------------------------- | ------------------- |
| R1  | A role is a documented, typed commitment that resolves in every theme        | `pnpm check:tokens` |
| R2  | In the graph an alias points one layer down, and a role never aliases a role | review              |
| R3  | The palette is a reference ramp, not a usage list                            | review              |
| R4  | The token path is the public name                                            | review              |
| R5  | A role is read under the property it belongs to                              | `pnpm check:tokens` |
| R6  | A component reads a role for colour and a primitive for everything else      | `pnpm check:tokens` |
| R7  | Motion is one composite token, and reduced motion zeroes it at the theme     | review              |
| R8  | Elevation is two shadow tokens, and a shadow is the one unchecked value      | review              |
| R9  | Stacking is a token when the DOM and the top layer cannot order the surface  | review              |

Before any of these rules, `pnpm check:tokens` asserts **existence**: every
`--brikka-*` name read inside a CSS string must be a declared token or a hook. No
other tool sees those names, and a typo renders nothing at runtime. It covers
tests, stories and `storybook/*/.storybook/`, because a typo in any of them is still a typo.

It also refuses a read on the prefix this kit published before the rename. `--bk-*` is
not a name `check:tokens` can see, so a read left on it passes existence and renders
through its fallback — the failure this check exists to catch, arriving by a route it
could not look at. `pnpm test:checks` is what keeps that second refusal honest, because
a gate nobody can make fail is decoration.

## R1. A semantic role is a documented commitment, not a derivation of usage

**Rule.** A role under `color.*` or `focus-ring` is added when the design system
publishes the decision, not when a component starts reading it. A role may ship with no
consumer. What it may not ship without is a `$type`, a `$description` that says what it
is for, and a definition in every theme. Renaming or removing one is a breaking change,
and ships with the changeset that says so.

The converse is unchanged. A value only one component paints is a component token, not a
role, and it is deleted in the same change that stops reading it.

**Why.** R1 used to say a role exists only while a component reads it. That answered the
right question while the token graph was the theming of a component kit: the only thing
that could justify a public name was the thing that consumed it. The graph is now
published as a design system a host can paint with and never register an element, so
`bg-surface` and `border-default` are the contract themselves, whatever the components
do with them.

What the rule protected is unchanged, and larger. It said the cost of a speculative role
is not its bytes: it is that removing `--brikka-color-primary` later is a breaking change
for any host that themed it. With a consumer who never saw this source, that cost is paid
by a stranger. So the gate moves from _is it read_ to _is it committed_: the description
is what a reader is owed, the theme coverage is what the theme contract promises, and the
changeset is what makes a removal visible instead of silent.

The history is why the new gate is shaped this way. Ten roles were authored up front so
the token file would look complete, nothing ever read one, and they were deleted. The
lesson was not "a role needs a consumer". It was "a role needs a reason a reader can
find", and a description is that reason, where a consumer is whoever needed it first.

**Do** — ship `bg-warning` with its type, its description, and a value in every theme, on
the day the ramp it needs exists.

**Don't** — ship `bg-warning` as a bare name because a component might want it next
quarter. That is the ten roles again, with the difference that now a stranger depends on
it.

**Enforced by.** `pnpm check:tokens` refuses a role that resolves in one theme and not
another. The `$description` and `$type` half is not a gate yet: the token source moved to
DTCG, and the check that reads it arrives with the `tokens.json` entry point; the graph diff a
removal needs against the base branch is recorded in
[ADR 0017](adr/0017-ship-the-token-graph-as-a-design-system.md), together with the changeset the
removal ships with — suspended for now by
[ADR 0020](adr/0020-suspend-changesets-until-the-first-version.md). Neither is a gate today. What the graph as a public contract obliges is
[ADR 0012](adr/0012-the-token-graph-is-the-public-contract.md).

## R2. In the token graph, an alias points one layer down and a role never aliases a role

**Rule.** `role → palette`, `radius → space`. Within `tokens/*.json`, a role aliases a
palette step, never another role, and no chain in the graph is longer than one hop. The
hops that hooks and component-local defaults add live outside the graph:
`--brikka-button-bg` defaults to `--brikka-button-variant-bg`, which `brikka-button` sets
to `--brikka-bg-accent`, which is the role. That is where the depth budget sits, and it is
why the rule says which of the two it governs.

**Why.** A role that aliases a role leaves the resolved value two hops from the reader,
and with a shadow root in between the only practical way to find the color is DevTools.
One hop in the graph means a role is answerable by opening two small files, and the three
hops a button resolves through are each owned by the layer that sets them.

The rest is unchanged. The control tier is gone: the sixteen tokens removed were
`button.{primary,secondary,ghost}.{bg,bg-hover,fg,border}` and
`input.{bg,color,label-color,border-color}`, their values now live in `text-default`,
`border-default`, `bg-surface*` and `bg-accent*`, and `--brikka-button-disabled-opacity`
is the only component token left because opacity is not a color. It holds no value of its
own: it defaults to the base primitive `{opacity.disabled}`, so a disabled control has one
default and one place to override it.

**Do**

```css
--brikka-bg-accent: var(--brikka-palette-blue-600);
```

**Don't**

```css
--brikka-border-default: var(--brikka-bg-accent);
```

**Enforced by.** Review.

## R3. The palette is a reference ramp, not a usage list

**Rule.** Unused palette entries stay. A palette is a scale, and a step that
nothing reads today is the step the next component or the next theme needs.

**Why.** Two entries lost their last consumer when the ten roles were removed —
`orange-900` and `stone-700` — and both stayed, deliberately. Pruning the ramp
to current usage would turn every new component into a palette edit.

**Do** — add the full ramp for a color even if only two steps are read.

**Don't** — delete `--brikka-palette-orange-900` because `grep` finds no consumer.

**Enforced by.** Review.

## R4. The token path is the public name

**Rule.** A token name is its JSON path joined with `-`, prefixed with `--brikka-`
(`platform.prefix`). `bg.accent-hover` becomes `--brikka-bg-accent-hover`, so the path
you write is the name a host overrides.

**Why.** A token name is public contract, and renaming one is a breaking change
for anyone who themed it. Naming is API design rather than filing: the name has
to say what the value is for, because that is what a consumer greps for.

**Do** — name the role: `--brikka-bg-accent`.

**Don't** — name the appearance: `--brikka-blue-surface`.

**Enforced by.** Review. What a breaking rename obliges — an alias, or a release note that
names the old token — is the decision in
[ADR 0012](adr/0012-the-token-graph-is-the-public-contract.md).

## R5. A role is read under the property it belongs to

**Rule.** `--brikka-bg-*` in a `background`, `--brikka-text-*` in a `color`,
`--brikka-border-*` in a border colour, `--brikka-focus-ring` in an `outline`. A role
assigned to a custom property is not checked: that is the hook indirection, and
the property that matters is wherever the hook is finally read.

**Why.** The family is in the name so the misuse is decidable without judgement.
`color: var(--brikka-bg-surface)` compiles, paints something nobody intended, and a
reviewer reading forty correct declarations does not notice the forty-first.

**Do** — `background: var(--brikka-bg-surface);`

**Don't** — `color: var(--brikka-bg-surface);`

**Enforced by.** `pnpm check:tokens`.

## R6. A component reads a role for colour and a primitive for everything else

**Rule.** A component never reads `--brikka-palette-*`. It reads space, radius,
typography, opacity and the structural primitives directly.

**Why.** A role exists where one name must resolve to different values in
different contexts. Colour has two themes; spacing has one. Reaching for the ramp
bypasses the theme silently: the value is right today and wrong the moment the
theme switches, with nothing to notice it.

**Do** — `background: var(--brikka-bg-accent);`

**Don't** — `background: var(--brikka-palette-blue-600);`

**Enforced by.** `pnpm check:tokens`. Why the primitives a component reads stay single-purpose
— one axis each, never merged — is the decision in
[ADR 0012](adr/0012-the-token-graph-is-the-public-contract.md).

## R7. Motion is one composite token, and reduced motion zeroes it at the theme

**Rule.** `--brikka-transition` is the only timing a component reads, and it carries the
duration and the easing together. `theme.css` sets it to `1ms` under
`prefers-reduced-motion: reduce`, and no component writes a duration of its own.

**Why.** One value read everywhere means one rule retimes the whole kit, which is the
property a host needs in order to opt out of motion without auditing every component.
`1ms` rather than `0` because a zero duration never fires `transitionend`, and the
consumer listening for it would wait forever.

**Enforced by.** Review, and the suite: the test page zeroes `--brikka-transition`, which is
the same mechanism the media query uses.

## R8. Elevation is two shadow tokens, and a shadow is the one unchecked value

**Rule.** Depth is `elevation.resting` and `elevation.floating`, both referencing
`elevation.color`, and a component reads one of them under `box-shadow` rather than
composing offsets of its own.

**Why.** [ADR 0022](adr/0022-elevation-exists-before-a-component-paints-it.md) reversed the
old rule, and only one of its two reasons had expired. The pipeline now expresses a shadow:
ADR 0021 allowed serializers, so `shadow/css/shorthand` composes offset, blur, spread and
colour. The other reason did not expire — `check:tokens` derives a role's expected property
from the first segment of its name, so `elevation` falls through unchecked, and a shadow stays
the one value in the graph nothing verifies. That is written down here instead of being
papered over by renaming the colour into a family the checker happens to know.

**Enforced by.** Review, and the suite: a test reads the computed `box-shadow` the tokens
produce. The `box-shadow` question in `check:tokens` is still open, deliberately, because the
useful thing to check about a shadow is not the property it is read under.

## R9. Stacking is a token when the DOM and the top layer cannot order the surface

**Rule.** A component that needs a stacking order reads `--brikka-z-index-*` and never writes a
number of its own. A dialog uses `<dialog>` with `showModal()` and a popover uses the `popover`
attribute: both paint in the top layer, which no `z-index` can compete with, so they read no
token at all. A component that has to contain what its children stack sets `isolation: isolate`
instead of inventing a number.

**Why.** `z-index` orders within a stacking context and nowhere else, and a component that sets
`position` with a `z-index` creates one its parents cannot see past. The layers that genuinely
stack are few — dropdown, overlay, modal, toast — and they are already ordered in the graph;
everything else is a context question, not a number question. The `9999` a component writes in a
hurry is the symptom of having asked the wrong one.

**Enforced by.** Review. The tokens exist in `packages/tokens/tokens/base/layout.json`; a literal
`z-index` in a component is what review refuses.

## Scope

What the graph carries, and what it refuses, is now stated for a consumer in
[design-system/tokens.md](design-system/tokens.md) and [design-system/principles.md](design-system/principles.md).
This document keeps the rules; the reference keeps the inventory, so a family added in one place
cannot disagree with the other.
