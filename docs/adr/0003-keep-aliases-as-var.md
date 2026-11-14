# 0003. Keep token aliases as var() references

Date: 2026-11-12

## Status

superseded in part by [0006](0006-stack-the-token-layers-and-add-a-theme.md).
The decision below still holds: an alias is a `var()` reference, never a flattened
value. What 0006 replaced is the three-layer description this file assumed, which
had one theme and no role tier.

## Context

Tokens reference each other. A semantic role is declared in terms of a palette
entry, not as a color:

```json
{ "color": { "danger": { "value": "{palette.red-700}" } } }
```

Style Dictionary can do two things with that reference: resolve it into
`#b91c1c` at build time, or emit it as `var(--bk-palette-red-700)` and let the
browser resolve it. The default behaviour of a CSS pipeline is to resolve — a
reference looks like a build-time substitution, and a flattened stylesheet is
what you get if you never ask for anything else.

What was at stake is the theming contract the kit publishes. A host is meant to
re-theme a subtree by setting a hook on an ancestor:

```css
.checkout {
  --bk-button-bg: var(--bk-palette-sky-600);
}
```

That works because custom properties inherit. A resolved literal is a value with
no name: once `#1d4ed8` is written into `--bk-button-primary-bg`, redefining
`--bk-palette-blue-600` anywhere in the tree no longer reaches the button, and
re-theming requires a rebuild — which is the one thing a token-driven design
system is supposed to remove.

There is a second casualty. The layering — palette, then semantic roles, then
control tokens — is the shape of the design. Flattened, it exists only in
`tokens/*.json`; the CSS that ships is an unordered list of hex values, and the
structure is unreadable at the place where people actually look.

## Decision

`outputReferences: true` on every platform. A reference in JSON becomes a
`var(--bk-…)` reference in CSS, never a literal. Nothing resolves at build time;
the browser resolves the chain at computed-value time.

In practice that means the alias is also the documentation:

```css
--bk-color-danger: var(--bk-palette-red-700);
--bk-button-primary-bg: var(--bk-palette-blue-600);
```

The name says what the value is for, the reference says where it comes from, and
a rename of the palette entry propagates to everything that points at it.

Two properties of the resulting chains are deliberate and worth stating, because
they are not what a reader assumes:

- Chains are one hop. Control tokens and semantic roles both point at the
  palette; nothing points at a control token.
- The semantic layer and the control layer are peers, not a stack. A control
  token never reads `--bk-color-*`; the five semantic roles are instead read by
  components directly, for behavior shared across controls.

The layering rules themselves — reference downwards, one hop, and when a
semantic role earns its existence — live with the conventions, not here: see
[Token Conventions](../conventions-tokens.md).

### Alternatives considered

| Alternative                                                                                    | Why it was rejected                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolve references at build time                                                               | The emitted CSS becomes static values. Redefining a palette entry on an ancestor stops working, so every override hook the kit documents becomes a rebuild instead of a CSS rule.                   |
| Emit the reference with the resolved value as a fallback: `var(--bk-palette-red-700, #b91c1c)` | Looks like a safer middle ground and is the same defect [0002](0002-require-the-theme.md) removed: a duplicated value that drifts silently the moment the palette changes, on every generated line. |

## Consequences

Easier:

- Re-theming is a CSS operation. Setting a palette entry or a control hook
  anywhere in the tree re-paints everything derived from it, with no build.
- The generated CSS documents the design. `color.css` carries five aliases
  pointing at the palette, `control.css` carries sixteen control tokens pointing
  at the palette. Reading the output tells you how the system is structured.
- Renaming a palette entry is one edit in JSON and the references follow,
  because they are names, not copies.

Harder:

- Every painted property costs one more indirection at computed-value time —
  negligible in a browser, but the emitted color is no longer readable in the
  stylesheet. You follow the chain, or you read DevTools; `grep` tells you the
  name and not the value.
- The output mixes references and keywords. `--bk-button-ghost-bg: transparent`
  is a literal in `tokens/control.json`, so a palette re-theme does not touch
  it. Correct for a keyword, but it means "everything follows the palette" is
  not literally true, and that boundary is invisible in the output.
- A semantic role reaches only the components that read it. Re-theming
  `--bk-color-danger` repaints the input's error border and message, because the
  input reads the role; it does not reach the button, whose paints come from its
  own control tokens. The isolation is invisible in the token files and easy to
  misread as a bug the first time it surprises someone.

Accepted debt: there is no single place to re-theme "every danger-colored
thing". The options are the palette entry or each control hook, one at a time.
Revisit when a theme needs to move a semantic role independently of the palette
— a dark theme where surfaces invert but danger stays the same red is exactly
that case, and the parallel layers would not support it.
