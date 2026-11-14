# 0007. Ship a default theme instead of fallback literals

Date: 2026-11-13

## Status

proposed

## Context

Two complaints pull in opposite directions.

A reviewer said of `bk-input` that it works as a text field inside this design
system but is not yet a piece another team can adopt without friction: a consumer
who does not load the token sheet sees it broken — no borders, no sizes — and
proposed the chain said to be what the large libraries do:

```css
var(--bk-input-border, var(--bk-border-default, #8a8f98))
```

That chain is what [0002](0002-require-the-theme.md) forbids, written down for
this reason: a literal fallback makes a missing theme stop hurting. It also
duplicates a brand decision wherever a token is read, and each copy is free to
drift.

What exists in this repository today:

- **0002**: only the hook pattern may carry a fallback, and its default must be a
  variable, never a literal.
- **The failure the chain would hide.** `tokens/component/control.css` declares
  `--bk-button-disabled-opacity`; without the theme, `opacity: var(…)` is invalid
  at computed-value time, resolves to nothing, and a disabled button looks
  enabled.
- **No outside consumer.** [architecture.md](../architecture.md) records the
  published package as out of scope because there is no consumer yet, so the
  friction is prospective rather than observed. It becomes real the day one
  exists, and the cost of deciding it then is a breaking change.

Two families do this in the wild, and they are not the same mechanism:

- **A global sheet plus a class or attribute on an ancestor**: Shoelace
  (`sl-theme-dark`), Spectrum (`spectrum--dark`), Ionic (`.ios`, `.md`).
- **A theme element that wraps a subtree**: Adobe `<sp-theme color scale>` and
  FAST `<fast-design-system-provider>`.

The second family does not exist to make tokens reach the components. Custom
properties inherit across a shadow boundary on their own. A provider buys
scoping plus values derived in JavaScript — scale, density, direction — and those
axes are the reason it earns a node in the tree.

## Decision

The package ships a default theme from its entry point.

- `src/styles/theme.css` keeps owning the tokens. The package entry imports it,
  so "the consumer forgot the theme" stops being a reachable state.
- A second entry without styles exists for a consumer that brings its own design
  system. Documented, because an undocumented second entry is the same friction
  with a different name.
- **No literal fallback on any token read.** 0002's rule stands unchanged; what
  changes is who is responsible for the theme existing.
- **No theme element.** `data-theme` already scopes by subtree, and a provider
  would be a second mechanism for something that already works, at the cost of a
  node and a first-paint ordering problem.
- **`color-scheme` leaves the default.** It is the one rule in `theme.css` that
  repaints the host page — scrollbars, caret, native form controls — so shipping
  it from a component library would change a page the library does not own. It
  becomes an opt-in file.

## Consequences

- Adoption stops depending on a step nobody remembers, and the brand values live
  in one place instead of in every read.
- A bundler drops a CSS import unless `package.json` declares
  `"sideEffects": ["*.css"]`. The shipped theme is only as reliable as that
  field, which makes it part of the contract rather than a packaging detail.
- Two entries to document and to keep in sync, and a consumer with its own design
  system has to choose one knowingly.
- Splitting `color-scheme` out means `theme.css` no longer does everything: a
  component on a dark page needs the opt-in file or it looks like a light island
  on a dark page.
- The suite imports `theme.css` directly and is unaffected.
- **0002 becomes `superseded in part`.** What holds is that an alias stays a
  `var()` and no read carries a literal default. What falls is that loading the
  theme is the consumer's responsibility.
- Not implemented. It needs `exports`, `sideEffects`, an entry that imports the
  CSS, the opt-in `color-scheme` file, and a test that fails if the entry stops
  shipping the tokens.
- **Rejected: the literal chain.** It hides the failure the theme is supposed to
  make loud, and it turns one brand decision into one copy per read.
- **Rejected: a theme element.** Two mechanisms for one job, and the axes that
  justify a provider do not exist here yet. If `size` becomes a global scale, or
  density appears, this is the decision to revisit.
- **Rejected: keep requiring the consumer to import the theme.** That is the
  complaint, not a solution to it.
