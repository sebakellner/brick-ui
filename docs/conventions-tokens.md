# Token Conventions

Rules for the token source in `tokens/*.json` and for the layers it generates.
The pipeline is explained in [ADR 0001](adr/0001-generate-token-css-from-json.md);
why aliases survive as `var()` is [ADR 0003](adr/0003-keep-aliases-as-var.md).

| # | Rule | Enforced by |
| --- | --- | --- |
| R1 | A semantic role exists only while a component reads it directly | `pnpm check:tokens` |
| R2 | References point downwards, one hop, never at a role | review |
| R3 | The palette is a reference ramp, not a usage list | review |
| R4 | The token path is the public name | review |

## R1. A semantic role exists only while a component reads it

**Rule.** A role under `color.*` or `focus-ring` is added when a component reads
it directly, and deleted in the same change that stops reading it. A role that
exists only so that a control token can alias it is a middle tier — this kit has
none, and the ten roles that tried to be one were removed. A role with no
consumer is not forward planning; it is a public name with no behaviour.

The converse holds too. A value that only one component paints is a control
token, not a role — a role read by one component is that component's token
wearing a public name. And a control token needs a component: when the component
stops reading it, delete it in the same change.

**Why.** Ten roles were authored up front — `primary`, `primary-hover`,
`primary-active`, `on-primary`, `on-danger`, `surface`, `surface-hover`, `text`,
`text-on-muted` and `border` — and no component ever read one. They were removed
in `d9dfacd`, after the controls took their own layer. The five that survive are
the five that are read: `danger`, `text-muted`, `surface-muted`, `border-strong`
and the focus ring.

The cost of a speculative role is not its bytes. A token name is public
contract: removing `--bk-color-primary` later is a breaking change for any host
that themed it, so adding the role is a decision to pay that cost eventually.

**Do** — add the role in the same change as the control that reads it.

**Don't** — add the canonical ten-role set so the token file "looks complete".

**Enforced by.** `pnpm check:tokens`, which derives the roles from `color.css` and
fails when no component reads one. Tests and stories do not count as consumers.
The control-token half of the rule is review only.

## R2. References point downwards, one hop, never at a role

**Rule.** `role → palette`, `radius → space`. A role aliases a palette step,
never another role, and no chain is longer than one hop.

**Why.** A role that aliases a role leaves the resolved value two hops from the
reader, and with a shadow root in between the only practical way to find the color
is DevTools. One hop means a role is answerable by opening two small files.

The control tier is gone. Sixteen tokens that existed only to alias the palette
were removed when the roles arrived — four of them were `text-default`, two were
`border-default`, two were `bg-surface-hover`. `--bk-button-disabled-opacity` is
the only component token left, because opacity is not a color.

**Do**

```css
--bk-bg-accent: var(--bk-palette-blue-600);
```

**Don't**

```css
--bk-border-default: var(--bk-bg-accent);
```

**Enforced by.** Review.

## R3. The palette is a reference ramp, not a usage list

**Rule.** Unused palette entries stay. A palette is a scale, and a step that
nothing reads today is the step the next component or the next theme needs.

**Why.** Two entries lost their last consumer when the ten roles were removed —
`orange-900` and `stone-700` — and both stayed, deliberately. Pruning the ramp
to current usage would turn every new component into a palette edit.

**Do** — add the full ramp for a color even if only two steps are read.

**Don't** — delete `--bk-palette-orange-900` because `grep` finds no consumer.

**Enforced by.** Review.

## R4. The token path is the public name

**Rule.** A token name is its JSON path joined with `-`, prefixed with `--bk-`
(`platform.prefix`). `bg.accent-hover` becomes `--bk-bg-accent-hover`, so the path
you write is the name a host overrides.

**Why.** A token name is public contract, and renaming one is a breaking change
for anyone who themed it. Naming is API design rather than filing: the name has
to say what the value is for, because that is what a consumer greps for.

**Do** — name the role: `--bk-bg-accent`.

**Don't** — name the appearance: `--bk-blue-surface`.

**Enforced by.** Review.
