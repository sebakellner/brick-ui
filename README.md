# Brick

A small set of web components built with [Lit](https://lit.dev) and TypeScript,
shipped as plain custom elements with a documented theming contract.

Two components are in scope: `bk-button` and `bk-input`. Everything else is
deliberately out of it.

## Quick start

```bash
pnpm install
pnpm dev                 # playground at http://localhost:5173
pnpm storybook           # stories at http://localhost:6006
pnpm test                # Web Test Runner, real Chrome
pnpm typecheck           # tsc --noEmit
```

Requirements: Node 22+ (the test runner requires it), pnpm and a local Chrome install.

## Structure

```
src/
├── components/          one folder per component: element, stories, test
├── styles/tokens.css    theming contract (CSS custom properties)
└── index.ts             public entry point
```

Contracts, usage and technical decisions are documented in the final section of
this README.
