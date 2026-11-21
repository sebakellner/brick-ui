# 0010. Coverage is not measured

Date: 2026-11-16

## Status

accepted

## Context

The suite asserts rules, and it prints a count of cases. It has never printed a coverage
percentage, and there is no coverage tool in `package.json`.

Three positions exist in the wild, and all three are real:

- **A threshold with a ratchet.** Spectrum Web Components holds `components/**/*.{ts,js}` at
  99% lines, functions and statements, with each threshold set to the current coverage
  rounded down so it only moves up.
- **Report-only.** Spectrum's first generation runs coverage with `continue-on-error: true`
  and uploads it, with no failing step.
- **No measurement.** Shoelace and Material Web declare nothing.

This repository is not Spectrum: it has no visual regression suite and no Playwright
accessibility layer, and every assertion runs in one browser in a few seconds.

## Decision

**No coverage threshold, no coverage report in CI, and no percentage quoted in a pull
request.** A suite is judged by whether each rule a component documents has a case — the
path and the refusal (T10), the fixture proven to have rendered (T16), and the audit beside
the rules (T15) — not by how much of a file it executes.

This is a policy, not a missing setup: adopting `c8` or `istanbul` with a threshold means
superseding this record, not adding a dev dependency.

## Why not a number

- Google's testing chapter names the failure mode directly: coverage "quickly becomes a goal
  unto itself", engineers "treat it like a ceiling", and "soon, changes begin landing with no
  more than 80% coverage". Its own recommendation is to measure coverage from small tests
  only.
- Fowler: "Test coverage is of little use as a numeric statement of how good your tests
  are", and "if you make a certain level of coverage a target, people will try to attain it".
- Shoelace's maintainer, on the same question: "I don't care about the number of tests or
  even coverage — I care about sensibility and making sure the important things are
  covered."

## Alternatives considered

| Alternative                                        | Why it was rejected                                                                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A threshold with an auto-ratchet, as Spectrum runs | It works there beside a visual regression suite and a Playwright accessibility layer; here it would be the only number anyone reads, and it measures execution rather than the rules a `README.md` documents. |
| Report-only, uploaded and never read               | A report nobody gates on teaches people that a falling number is normal.                                                                                                                                      |
| A percentage in the pull request body              | It changes the question a reviewer asks: "is this file covered" instead of "which documented rule has no case".                                                                                               |

## Consequences

- `docs/conventions-testing.md` T12 states the rule and links here; the reasoning lives in
  this record.
- **The honest risk is that "no number" hides a component nobody wrote a suite for.** The
  mitigations are structural rather than numeric: T8 makes a missing file visible in the
  inventory, T16 stops a suite from passing on a page where nothing rendered, and the audit
  in T15 grades every component whether or not somebody remembered a case for it.
- Nothing about this decides _which_ cases a rule earns — that is T10, and it stays a review
  judgement.
