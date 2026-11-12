# 0002. Require the theme instead of shipping fallback values

Date: 2026-11-12

## Status

accepted

## Context

Components read their values as `var(--bk-…)` with a hard-coded fallback baked
into the same declaration, so a missing token still painted something:

```css
background: var(--bk-button-bg, var(--bk-palette-sky-600));
```

There were 51 of those across `bk-button` and `bk-input`. Each one duplicated a
value that already existed in `tokens/*.json`, and the duplication was the point
of failure rather than a safety net.

Nothing exercised the fallback path. The playground and Storybook both load
`theme.css`, so the fallbacks never ran in development, in the test suite, or in
the published docs. They were a promise without a consumer.

The cost was silent drift. Change a palette entry, rebuild the tokens, and the
component kept painting the previous color through its own copy — no error, no
warning, no failing test. A component that renders visibly unstyled gets reported
and fixed within the hour; a component that is subtly off-brand ships and stays.

## Decision

Components carry no value fallbacks. Every paint reads `var(--bk-…)` and nothing
else, and defaults live once, in the generated CSS. Loading the theme through
`src/styles/theme.css` is part of the contract, not a convenience.

The exception, stated precisely, because the flat rule "no fallbacks" is not
what the code does: a fallback is allowed when it is the **default half of the
public hook pattern**, never a literal and never a copy of a token value.

```css
button {
  background: var(--bk-button-bg, var(--bk-button-variant-bg));
}
```

The public hook is read first so that a `--bk-button-bg` set on any ancestor
still wins; the default — the variant's internal variable — is read second. If
the variant wrote the public hook itself, every inherited override would lose.
Seven such composites remain, and they are the mechanism, not an oversight.

Two supporting decisions came with this one:

- Tests load the real stylesheet through `before(loadTheme)` from
  `src/test/helpers/theme.ts`, so the suite runs the same configuration a
  consumer runs. With the theme absent, the typography, control-token and hover
  tests all failed — that was the observed RED.
- A page that skips the theme renders visibly unstyled. That is the intended
  failure mode: loud instead of silent.

### Alternatives considered

| Alternative | Why it was rejected |
| --- | --- |
| Keep the fallbacks as a safety net for pages that forget the theme | They never ran — no consumer in the repo omitted the theme — so they were untested code duplicating the source of truth. The value they guaranteed was already wrong the moment a token changed. |
| Ship the defaults inside each component instead, so the element themes itself | Every component would carry its own copy of the token declarations; two components on a page would duplicate them twice, and per-subtree theming through an ancestor override would stop working, because a value set on the element beats an inherited one. |

## Consequences

Easier:

- Defaults have exactly one home. Changing a palette entry is one edit and one
  rebuild, with no copy left behind.
- Drift is impossible by construction: there is no second value to go stale.
- The suite exercises the consumer configuration, so a component reading a token
  that was never declared fails a test instead of rendering nothing.
- "Is this component themed?" has one answer: does the page load the theme.

Harder:

- The kit can no longer be dropped into a page with a single `<script>`. Every
  consumer pays one `<link>`, and that cost is permanent.
- The failure is now total rather than partial. A forgotten theme produces a
  broken-looking page, which is expensive for a first-time consumer and
  therefore depends on the README saying it loudly instead of in a footnote.
- The hook pattern is load-bearing and looks reversible. Writing the variant
  value into `--bk-button-bg` on `:host` instead of into
  `--bk-button-variant-bg` is a one-token edit that appears equivalent and
  silently breaks every inherited override. The override tests exist for this:
  they set the hook on `document.documentElement` and assert the computed style
  follows.

Accepted debt: there is no bare mode and no reduced-theme mode — a consumer
either loads the whole theme or gets nothing. Revisit if the kit gets a consumer
that cannot load a global stylesheet, such as a host that strips page CSS and
animates the components inside its own shadow root.
