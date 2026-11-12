# Add a token

Use this when a component needs a value it cannot get from an existing token, or
when a control needs a new paint. Read [architecture.md](architecture.md) first if
the three layers are not familiar; the rules are in
[conventions-tokens.md](conventions-tokens.md).

## Prerequisites

- The value is real: a color, length, weight, duration or opacity that a host might
  reasonably want to change. A reset or a technique geometry is not a token
  ([ADR 0004](adr/0004-forbid-style-literals-in-components.md)).
- You know which layer it belongs to. Only one component paints it → a control
  token. Shared across controls, or read directly by a component for a state → a
  semantic role. A raw color → the palette, if the ramp is missing the step.

## Steps

1. **Name it by its path.** The token name is its JSON path joined with `-`,
   prefixed with `--bk-`. `button.secondary.bg-hover` becomes
   `--bk-button-secondary-bg-hover`, so the path you write is the public name.
   Choose it as carefully as a function name in an API.

2. **Add it to the group's JSON file.** `tokens/control.json` for a control token,
   `tokens/color.json` for a palette entry or a semantic role. Point it at a
   palette entry, or write the literal — values live only here.

3. **Register the group, if it is new.** `style-dictionary.config.mjs` builds one
   platform per group from explicit name lists. A group that is not listed is
   written into no file at all. Either add the name to an existing platform's
   `only(…)`, or add a platform with `cssFile('<group>.css', only('<group>'))`.

4. **Generate.** `pnpm build:tokens` writes `src/styles/tokens/*.css` and
   `src/styles/tokens.generated.ts`.

5. **Validate.** `pnpm check:tokens` confirms every name the components read
   exists, and that every semantic role is read by something.

6. **Commit all three artifacts.** The JSON, the generated CSS and
   `tokens.generated.ts`. CI regenerates and fails on any diff under `src/styles`,
   untracked files included.

## Verify

```bash
$ pnpm build:tokens && pnpm check:tokens
token names ok: 57 declared, 11 hooks, 5 semantic roles consumed
```

Then confirm the value reached the browser: a test that overrides the token on
`document.documentElement` and asserts the computed style follows. That is the
pattern the existing tests use, and it proves the token is read rather than merely
declared.

## Traps

| Symptom | Cause | Fix |
| --- | --- | --- |
| The token exists in the JSON and appears in no CSS file | its group is not in a platform's filter list, and this failure is silent | add the group to `style-dictionary.config.mjs` |
| `build:tokens` fails on an unresolvable reference | the alias points at a path that does not exist, e.g. `{palette.stone-100}` | check the palette; the build fails before writing anything, so nothing is half-generated |
| A hook resolves to nothing in the browser | the name is neither declared in `tokens/` nor listed in the `hooks` map in the config | `pnpm check:tokens` names the offender |
| A semantic role breaks CI | nothing reads it | either a component reads it, or it is not a role |

## Related

- [conventions-tokens.md](conventions-tokens.md) — the rules this follows
- [0001](adr/0001-generate-token-css-from-json.md) — why the CSS is generated
- [0003](adr/0003-keep-aliases-as-var.md) — why aliases stay `var()`
