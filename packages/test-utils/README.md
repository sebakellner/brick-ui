# `@brick/test-utils`

The helpers every suite in this repository shares. Private, and never published: it is not a
testing framework, it is the vocabulary this kit's tests are written in.

```ts
import { settle } from '@brick/test-utils/settle.js';
```

The import carries `.js` and resolves through the package's exports — `"./*.js"` maps to
`"./src/*.ts"` — so there is no build step and no path alias to keep in step with a bundler.

## What each helper knows

Three of them are bound to web components, one to the theme contract, and the rest would work
on any page.

| Helper        | What it knows                                                          | Bound to                    |
| ------------- | ---------------------------------------------------------------------- | --------------------------- |
| `contrast.ts` | luminance and a ratio between two colours                              | nothing                     |
| `pointer.ts`  | `sendMouse` from the runner, and where an element's centre is          | nothing                     |
| `form.ts`     | `submit` and `invalid` on a `<form>`, and the order they arrive        | nothing                     |
| `a11y.ts`     | axe with this kit's rule set, and "the subject rendered"               | nothing, judged as this kit |
| `style.ts`    | a custom property resolved through a probe element                     | the token contract          |
| `theme.ts`    | `data-theme` on the document, in two values                            | the token contract          |
| `dom.ts`      | shadow roots, `slot`, `part`, `assignedNodes`                          | web components              |
| `settle.ts`   | one render, one flush, the render that flush caused (`updateComplete`) | Lit                         |
| `atoms.ts`    | builds a `<bk-field-label>` or a `<bk-field-description>`              | this kit                    |

## The rule that keeps the drawer from becoming a mess

**A helper that mentions shadow DOM, Lit or one of the kit's atoms is bound to web components.
One that mentions none of them is agnostic.** The bound ones live beside the agnostic ones
today because there is exactly one technology in this repository; the day a package that is
not web components needs the others, they part along that line and nowhere else:

```
@brick/test-utils          the agnostic ones, and the ones the theme contract binds
@brick/test-utils-lit      shadow DOM, slots, parts, updateComplete, the atoms
```

An adapter is named after its technology — `@testing-library/dom` and
`@testing-library/react` are the same arrangement — because the suffix is the boundary. A
directory called "misc" or "internal" would hide it, and everything would land there.

## What it is not

- Not published: `private: true`, and nothing here is exported from `@brick/web-components`.
- Not a runner: `web-test-runner.config.mjs` at the root owns the browser, the theme on the
  test page and the zeroed transition. A helper never configures the environment.
- Not a mock library: the suites drive real input, and there is nothing here that fakes one.
