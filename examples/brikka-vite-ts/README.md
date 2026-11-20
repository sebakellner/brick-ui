# brikka-vite-ts

A consumer of Brikka: Vite, TypeScript, and **the packed packages** — not the workspace. That is
what this example is for. Storybook and the suite read the source; nothing else in the repository
installs what would be published, so this is where a broken `exports`, a missing file in `files`
or an unresolved peer shows up as a page that does not work.

## Run it

```bash
# from the repository root: the packages as a consumer receives them
pnpm --filter @brikka-ui/styles build
pnpm --filter @brikka-ui/web-components build
mkdir -p examples/brikka-vite-ts/.pack
(cd packages/styles && pnpm pack --pack-destination ../../examples/brikka-vite-ts/.pack)
(cd packages/web-components && pnpm pack --pack-destination ../../examples/brikka-vite-ts/.pack)

# then the example
cd examples/brikka-vite-ts
pnpm install
pnpm dev
```

`pnpm build` type-checks and bundles. The output is the proof: `dist/assets/*.css` is the theme
and `dist/assets/*.js` carries the elements.

## Why it has its own `pnpm-workspace.yaml`

The example is **outside** the repository's workspace on purpose: a workspace link would resolve
the source and prove nothing. Its own `pnpm-workspace.yaml` exists for two settings that pnpm 12
only reads there:

- `packages: []` — it is a mini-workspace of one, as the Turborepo examples are.
- an override pointing `@brikka-ui/styles` at its tarball. In a published world the registry
  satisfies the peer range `@brikka-ui/web-components` declares; here the tarball does, because no
  registry is reachable.

## Why there is no lockfile here

Its dependencies are tarballs built by this repository, so their checksums change every time the
packages are packed. A committed lockfile would record the bytes of one build and fail the next
one with `ERR_PNPM_TARBALL_INTEGRITY`, which is what CI found.

## What it pins, and why

`vite` and `lit` are pinned to the versions the repository builds with. A floating range resolved
a newer Vite whose native bundler binding was not in the local store, and the example failed to
build for a reason that had nothing to do with Brikka.

## What it shows

An `email` field, a `brikka-slider` with ticks, and two buttons — the smallest page that exercises a
control with a label, a control with a continuous value, and a control with variants. `main.ts`
listens to `brikka-input`, the channel that moves with the thumb, and registers the kit with one
import.
