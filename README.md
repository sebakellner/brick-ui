# Brick

[![ci](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sebakellner/brick-ui/actions/workflows/ci.yml)

A small component library built with [Lit](https://lit.dev) and TypeScript. The components
are plain custom elements, and what they paint comes from a token layer: a theme decides
every colour, length and radius in the kit, and no component carries a fallback value.

> **Status: 0.1.0, not published.** The package is `private`; consume it from this
> repository.

## The theme is required

There are no fallback values anywhere, by decision rather than by omission. A component that
paints `var(--bk-bg-accent)` renders visibly unstyled on a page that never loaded the theme,
and that is the point: a half-themed page is a bug report, not a design choice.

Load `theme.css` from `@brick/styles`, or a build of it, once. It defines the roles the components
read and the `color-scheme` the browser needs, so the page and the controls paint from the
same values in both themes.

## See it

[Storybook](https://sebakellner.github.io/brick-ui/) — every component, every state, and a
page per component built from its own README.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) holds the setup, the commands and the gates. The
reasoning behind the arrangement — the token layers, the accessibility bar, the testing
rules and the decisions that were reversed — is in [docs/](docs/README.md).

## License

[MIT](LICENSE)
